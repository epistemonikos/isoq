import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import Vue from 'vue'
import UserProjectsModal from '@/components/admin/modals/UserProjectsModal.vue'
import Api from '@/utils/Api'

// Un superadmin despublica desde el panel (`POST /admin/projects/:id/unpublish`). El servidor
// exige un motivo de una lista cerrada y lo deja en la auditoría: acá no hay texto libre.

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  post: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const project = (overrides = {}) => ({
  id: 'p1',
  name: 'Revisión',
  role: 'owner',
  is_public: true,
  created_at: '2026-01-01T00:00:00',
  last_update: 0,
  published_at: '2026-02-01T00:00:00',
  ...overrides
})

const makeWrapper = async ({ superadmin = true, projects = [project()] } = {}) => {
  Api.get.mockResolvedValue({ data: projects })
  const wrapper = mount(UserProjectsModal, {
    localVue,
    propsData: { user: { id: 'u1', username: 'owner@example.com' } },
    mocks: {
      $t: key => key,
      $store: { state: { user: { superadmin } } }
    },
    // El b-modal real no dibuja su contenido hasta mostrarse; lo que se prueba es la tabla.
    stubs: { 'b-modal': { template: '<div><slot /></div>' } }
  })
  await wrapper.vm.load()
  await flushPromises()
  return wrapper
}

const unpublishButton = wrapper => wrapper.find('[data-test="unpublish-p1"]')

const confirmWith = async (wrapper, reason) => {
  wrapper.vm.startUnpublish(wrapper.vm.projects[0])
  wrapper.vm.unpublishReason = reason
  await wrapper.vm.confirmUnpublish()
  await flushPromises()
  await Vue.nextTick()
}

describe('UserProjectsModal.vue — despublicar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: { result: 'success' } })
  })

  it('ofrece despublicar un proyecto publicado a un superadmin', async () => {
    const wrapper = await makeWrapper()
    expect(unpublishButton(wrapper).exists()).toBe(true)
  })

  it('no lo ofrece a quien no es superadmin', async () => {
    const wrapper = await makeWrapper({ superadmin: false })
    expect(unpublishButton(wrapper).exists()).toBe(false)
  })

  it('no lo ofrece para un proyecto privado', async () => {
    const wrapper = await makeWrapper({ projects: [project({ is_public: false })] })
    expect(unpublishButton(wrapper).exists()).toBe(false)
  })

  it('pide el motivo de una lista cerrada, sin texto libre', async () => {
    const wrapper = await makeWrapper()
    await unpublishButton(wrapper).trigger('click')

    const options = wrapper.findAll('[data-test="unpublish-reason"] option')
      .wrappers.map(o => o.element.value).filter(Boolean)
    expect(options).toEqual(['personal_data', 'not_publishable', 'owner_request', 'other'])
    expect(wrapper.find('[data-test="unpublish-confirm"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('no envía sin motivo', async () => {
    const wrapper = await makeWrapper()
    wrapper.vm.startUnpublish(wrapper.vm.projects[0])
    await wrapper.vm.confirmUnpublish()
    expect(Api.post).not.toHaveBeenCalled()
  })

  it('envía el motivo elegido al endpoint de admin', async () => {
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'personal_data')
    expect(Api.post).toHaveBeenCalledWith('/admin/projects/p1/unpublish', { reason: 'personal_data' })
  })

  it('al terminar, la fila queda privada y se ve el aviso', async () => {
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'other')

    expect(wrapper.vm.projects[0].is_public).toBe(false)
    expect(wrapper.vm.projects[0].published_at).toBe(null)
    expect(wrapper.vm.pendingProject).toBe(null)
    expect(wrapper.text()).toContain('admin.unpublish_success')
    expect(unpublishButton(wrapper).exists()).toBe(false)
  })

  it('si ya no estaba publicado (409), lo dice y deja la fila privada', async () => {
    Api.post.mockRejectedValueOnce({ response: { status: 409, data: { result: 'not_published' } } })
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'other')

    expect(wrapper.vm.projects[0].is_public).toBe(false)
    expect(wrapper.text()).toContain('admin.unpublish_already_private')
  })

  it('otro error se muestra y la fila no cambia', async () => {
    Api.post.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'other')

    expect(wrapper.vm.projects[0].is_public).toBe(true)
    expect(wrapper.text()).toContain('notifications.save_error')
    expect(wrapper.vm.isUnpublishing).toBe(false)
  })

  it('cancelar no envía nada', async () => {
    const wrapper = await makeWrapper()
    await unpublishButton(wrapper).trigger('click')
    await wrapper.find('[data-test="unpublish-cancel"]').trigger('click')
    expect(wrapper.vm.pendingProject).toBe(null)
    expect(Api.post).not.toHaveBeenCalled()
  })
})

// El servidor avisa a la persona dueña por correo y, con `personal_data`, corta el enlace anónimo.
// Si el correo falla el despublicado se mantiene: el panel tiene que decirlo, porque la persona
// dueña no se va a enterar por otra vía.
describe('UserProjectsModal.vue — aviso a la persona dueña y enlace compartido', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('antes de confirmar dice que se le avisará por correo', async () => {
    Api.post.mockResolvedValue({ data: { result: 'success', owner_notified: true } })
    const wrapper = await makeWrapper()
    await unpublishButton(wrapper).trigger('click')
    expect(wrapper.text()).toContain('admin.unpublish_owner_notice_note')
  })

  it('con motivo de datos personales advierte que se desactiva el enlace', async () => {
    const wrapper = await makeWrapper()
    await unpublishButton(wrapper).trigger('click')
    expect(wrapper.text()).not.toContain('admin.unpublish_shared_link_note')
    wrapper.vm.unpublishReason = 'personal_data'
    await Vue.nextTick()
    expect(wrapper.text()).toContain('admin.unpublish_shared_link_note')
  })

  it('si el correo no salió, lo dice', async () => {
    Api.post.mockResolvedValue({ data: { result: 'success', owner_notified: false, shared_link_revoked: false } })
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'other')
    expect(wrapper.text()).toContain('admin.unpublish_owner_not_notified')
  })

  it('si el correo salió, no muestra esa advertencia', async () => {
    Api.post.mockResolvedValue({ data: { result: 'success', owner_notified: true, shared_link_revoked: false } })
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'other')
    expect(wrapper.text()).not.toContain('admin.unpublish_owner_not_notified')
  })

  it('si se revocó el enlace, lo confirma', async () => {
    Api.post.mockResolvedValue({ data: { result: 'success', owner_notified: true, shared_link_revoked: true } })
    const wrapper = await makeWrapper()
    await confirmWith(wrapper, 'personal_data')
    expect(wrapper.text()).toContain('admin.unpublish_shared_link_revoked')
  })
})
