import { mount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquireRef: jest.fn(),
  releaseRef: jest.fn(),
  probeRefLocks: jest.fn().mockResolvedValue({ locks: [], reachable: true, enabled: true })
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// `b-modal` no dibuja su contenido cerrado: se reemplaza por un contenedor que rinde el
// cuerpo y el footer. Lo de adentro —tabla, botones, cartel— es lo real.
const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true,
  'b-modal': {
    render (h) {
      return h('div', [this.$slots.default, this.$scopedSlots['modal-footer'] && this.$scopedSlots['modal-footer']()])
    }
  }
}

// Las afirmaciones van sobre el DOM renderizado: dos veces en este repositorio un estado
// correcto no llegaba a la plantilla y la suite estaba verde igual.
describe('viewProject.vue — modal de grupos con el lock de otra persona', () => {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }

  async function abrirModal (acquireResult) {
    LockService.acquireRef.mockResolvedValue(acquireResult)
    const wrapper = mount(viewProject, {
      localVue,
      mocks: {
        $t: (key, params) => (params && params.user ? `${key}|${params.user}` : key),
        $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { personal_organization: 'org1', id: 1 }, isOnline: true } },
        $notify,
        isOnline: true
      },
      stubs
    })
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        options: [{ id: 'c1', text: '1. Feasibility', label: '1. Feasibility' }]
      }
    })
    await wrapper.vm.onCategoriesModalShow()
    await flushPromises()
    return wrapper
  }

  const buttonTexts = (wrapper) => wrapper.findAll('button').wrappers.map(b => b.text())

  beforeEach(() => jest.clearAllMocks())

  it('al abrir pide el lock de la clave list_categories del proyecto', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'list_categories')
    wrapper.destroy()
  })

  it('con el lock propio: sin cartel, y con Edit / Remove / Add', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(wrapper.find('[data-testid="categories-lock-alert"]').exists()).toBe(false)
    expect(buttonTexts(wrapper)).toEqual(expect.arrayContaining(['common.edit', 'common.remove', 'common.add_new_finding_group']))
    wrapper.destroy()
  })

  it('tomado por otra persona: cartel con su nombre, la tabla se ve, y no hay con qué editar', async () => {
    const wrapper = await abrirModal({ success: false, lockedBy: 'Ana Pérez', reason: 'locked_by_other_user' })
    const alert = wrapper.find('[data-testid="categories-lock-alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toBe('lock.categories_locked_by|Ana Pérez')
    expect(wrapper.text()).toContain('1. Feasibility')
    const texts = buttonTexts(wrapper)
    expect(texts).not.toContain('common.edit')
    expect(texts).not.toContain('common.remove')
    expect(texts).not.toContain('common.add_new_finding_group')
    wrapper.destroy()
  })

  it('perderlo a mitad de un rename deshabilita Update', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.editListCategoryName(0)
    await wrapper.vm.$nextTick()
    const update = () => wrapper.findAll('button').wrappers.find(b => b.text() === 'common.update')
    expect(update().attributes('disabled')).toBeUndefined()

    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: 'list_categories', lockedBy: 'Ana' } }))
    await wrapper.vm.$nextTick()

    expect(update().attributes('disabled')).toBe('disabled')
    expect(wrapper.find('[data-testid="categories-lock-alert"]').text()).toBe('lock.categories_lost_to|Ana')
    wrapper.destroy()
  })

  it('el 409 del servidor al guardar muestra el cartel y no un error genérico', async () => {
    Api.patch.mockRejectedValueOnce({
      config: { url: '/isoqf_list_categories/c1', method: 'patch' },
      response: { status: 409, data: { status: false, reason: 'locked_by_other_user', locked_by: 'Ana' } }
    })
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.editListCategoryName(0)
    wrapper.vm.modal_edit_list_categories.text = '1. Otra'

    await wrapper.vm.updateCategoryName()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="categories-lock-alert"]').text()).toBe('lock.categories_lost_to|Ana')
    expect($notify.error).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('el 409 del servidor al borrar muestra el cartel y no «error al borrar»', async () => {
    Api.delete.mockRejectedValueOnce({
      config: { url: '/isoqf_list_categories/c1', method: 'delete' },
      response: { status: 409, data: { status: false, reason: 'locked_by_other_user', locked_by: 'Ana' } }
    })
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.removeListCategory({ index: 0, item: { id: 'c1' } })

    wrapper.vm.removeCategory()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="categories-lock-alert"]').text()).toBe('lock.categories_lost_to|Ana')
    expect($notify.error).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('con el lock arma el reloj de inactividad, y al cerrar lo apaga', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(wrapper.vm.lastInactivityActivityAt()).not.toBeNull()
    wrapper.vm.onCategoriesModalHidden()
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.lastInactivityActivityAt()).toBeNull()
    wrapper.destroy()
  })

  it('sin el lock no hay reloj de inactividad', async () => {
    const wrapper = await abrirModal({ success: false, lockedBy: 'Ana' })
    expect(wrapper.vm.lastInactivityActivityAt()).toBeNull()
    wrapper.destroy()
  })

  it('al expirar la inactividad suelta el lock, avisa y ofrece retomar', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.onInactivityExpired(Date.now())
    await wrapper.vm.$nextTick()

    expect(LockService.releaseRef).toHaveBeenCalledWith('list_categories')
    expect(wrapper.find('[data-testid="categories-lock-alert"]').text()).toContain('lock.categories_released_idle')
    expect(buttonTexts(wrapper)).not.toContain('common.edit')

    await wrapper.find('[data-testid="categories-lock-resume"]').trigger('click')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="categories-lock-alert"]').exists()).toBe(false)
    expect(buttonTexts(wrapper)).toContain('common.edit')
    wrapper.destroy()
  })

  it('el aviso de cuenta regresiva se dibuja dentro del modal', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.inactivityWarning = true
    wrapper.vm.inactivitySecondsLeft = 65
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="inactivity-warning"]').text()).toContain('lock.categories_inactivity_message')
    wrapper.destroy()
  })

  it('al cerrar suelta el lock', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.onCategoriesModalHidden()
    expect(LockService.releaseRef).toHaveBeenCalledWith('list_categories')
    wrapper.destroy()
  })
})
