import { shallowMount, createLocalVue } from '@vue/test-utils'
import ShareProjectModal from '@/components/organization/modals/ShareProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function createWrapper (project = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const $t = jest.fn((k, params) => params ? `${k} ${JSON.stringify(params)}` : k)
  const store = new Vuex.Store({ state: { user: { name: 'owner@example.com', id: 'user-1' } } })
  const wrapper = shallowMount(ShareProjectModal, {
    localVue,
    store,
    mocks: { $t, $route: { params: { id: 'org-123' } }, $notify },
    propsData: {
      project: {
        id: 'p1', name: 'P', sharedTo: '', sharedToError: '', sharedTokenOnOff: false,
        sharedToken: '', temporaryUrl: '', invite_emails: [], tmp_invite_emails: [], ...project
      },
      usersAllowed: []
    }
  })
  wrapper.vm.$refs['modal-share-options'] = { hide: jest.fn(), show: jest.fn() }
  return { wrapper, $notify }
}

// Desde 2026-10-06 el servidor concede el acceso aunque el correo de invitación rebote, y
// devuelve en `invitations_not_sent` las direcciones que no lo recibieron. Antes un rebote
// era un 500 a la mitad del reparto y aquí se leía como «no se pudo compartir».
describe('ShareProjectModal — invitaciones que no salieron', () => {
  beforeEach(() => jest.clearAllMocks())

  it('avisa a quién no le llegó y deja esas direcciones para reintentar', async () => {
    const { wrapper, $notify } = createWrapper({
      sharedTo: 'bad@example.com, ok@example.com',
      tmp_invite_emails: ['bad@example.com', 'ok@example.com']
    })
    Api.post.mockResolvedValueOnce({ status: 200, data: { id: 'p1', invitations_not_sent: ['bad@example.com'] } })

    await wrapper.vm.saveSharedProject()
    await flushPromises()

    expect($notify.warning).toHaveBeenCalledWith(
      'notifications.share_invite_not_sent {"emails":"bad@example.com"}')
    expect($notify.error).not.toHaveBeenCalled()
    // El proyecto sí se compartió: la vista se actualiza.
    expect(wrapper.emitted('project-shared')).toBeTruthy()
    expect(wrapper.vm.project.sharedTo).toBe('bad@example.com')
    expect(wrapper.vm.project.tmp_invite_emails).toEqual(['bad@example.com'])
  })

  it('si todo salió, limpia el campo como siempre y no avisa nada', async () => {
    const { wrapper, $notify } = createWrapper({ sharedTo: 'ok@example.com', tmp_invite_emails: ['ok@example.com'] })
    Api.post.mockResolvedValueOnce({ status: 200, data: { id: 'p1', invitations_not_sent: [] } })

    await wrapper.vm.saveSharedProject()
    await flushPromises()

    expect($notify.warning).not.toHaveBeenCalled()
    expect(wrapper.vm.project.sharedTo).toBe('')
  })

  it('un servidor sin el campo se comporta como antes', async () => {
    const { wrapper, $notify } = createWrapper({ sharedTo: 'ok@example.com', tmp_invite_emails: ['ok@example.com'] })
    Api.post.mockResolvedValueOnce({ status: 200, data: { id: 'p1' } })

    await wrapper.vm.saveSharedProject()
    await flushPromises()

    expect($notify.warning).not.toHaveBeenCalled()
    expect(wrapper.vm.project.sharedTo).toBe('')
  })
})
