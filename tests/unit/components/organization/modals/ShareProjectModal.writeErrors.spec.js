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
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/share/project/p1' } })
const offline = () => Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } })

function createWrapper (project = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const store = new Vuex.Store({ state: { user: { name: 'owner@example.com', id: 'user-1' } } })
  const wrapper = shallowMount(ShareProjectModal, {
    localVue,
    store,
    mocks: { $t: (k) => k, $route: { params: { id: 'org-123' } }, $notify },
    propsData: {
      project: {
        id: 'p1', name: 'P', sharedTo: '', sharedToError: '', sharedTokenOnOff: false,
        sharedToken: '', temporaryUrl: '', invite_emails: [], tmp_invite_emails: [], ...project
      },
      usersAllowed: []
    },
    mixins: [{ computed: { isOnline () { return true } } }]
  })
  wrapper.vm.$refs['modal-share-options'] = { hide: jest.fn(), show: jest.fn() }
  return { wrapper, $notify }
}

// Compartir es control de acceso. Antes cada una de estas escrituras terminaba en
// `console.log`: el dueño apretaba «quitar acceso», no pasaba nada visible y la persona
// seguía entrando. Cada texto dice qué quedó como estaba.
describe('ShareProjectModal — lo que falla se dice', () => {
  beforeEach(() => jest.clearAllMocks())

  it('invitar', async () => {
    const { wrapper, $notify } = createWrapper({ tmp_invite_emails: ['ana@example.com'] })
    Api.post.mockRejectedValueOnce(error500())
    await wrapper.vm.saveSharedProject()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.share_invite_error')
    // Lo escrito no se pierde: puede reintentar.
    expect(wrapper.vm.project.tmp_invite_emails).toEqual(['ana@example.com'])
  })

  it('quitar el acceso a un usuario', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(error500())
    wrapper.vm.unshare(0, { id: 'u2' })
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.share_unshare_error')
    expect(wrapper.emitted('user-unshared')).toBeFalsy()
  })

  it('quitar una invitación pendiente', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(error500())
    wrapper.vm.unshareInvited('ana@example.com')
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.share_unshare_error')
  })

  it('cambiar el permiso: avisa y devuelve el selector a lo que de verdad quedó', async () => {
    // El `v-model` ya movió el selector antes del PATCH. Sin devolverlo, la pantalla
    // diría «sólo lectura» mientras el servidor sigue dando escritura.
    const { wrapper, $notify } = createWrapper()
    const item = { project_id: 'p1', id: 'u2', user_can: 0 }
    Api.patch.mockRejectedValueOnce(error500())
    wrapper.vm.changePermission('p1', 'u2', 0, 0, item)
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.share_permission_error')
    expect(item.user_can).toBe(1)
  })

  it('cambiar el permiso bien no toca el selector', async () => {
    const { wrapper, $notify } = createWrapper()
    const item = { project_id: 'p1', id: 'u2', user_can: 0 }
    Api.patch.mockResolvedValueOnce({ data: [{ id: 'u2', user_can: 0 }] })
    wrapper.vm.changePermission('p1', 'u2', 0, 0, item)
    await flushPromises()
    expect($notify.error).not.toHaveBeenCalled()
    expect(item.user_can).toBe(0)
  })

  it('el enlace compartido: avisa, devuelve el interruptor y no vuelve a escribir', async () => {
    const { wrapper, $notify } = createWrapper({ sharedTokenOnOff: false })
    Api.patch.mockRejectedValueOnce(error500())
    wrapper.vm.project.sharedTokenOnOff = true
    await flushPromises()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.share_link_error')
    expect(wrapper.vm.project.sharedTokenOnOff).toBe(false)
    // Devolver el interruptor dispara el watcher: sin una guarda sería otro PATCH.
    expect(Api.patch).toHaveBeenCalledTimes(1)
  })

  it('sin conexión no suma un aviso: ya lo dio OfflineIndicator', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(offline())
    wrapper.vm.unshareInvited('ana@example.com')
    await flushPromises()
    expect($notify.error).not.toHaveBeenCalled()
  })

  it('un 403 dice que no tiene permiso, no un genérico', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(Object.assign(new Error('403'), { response: { status: 403, data: {} }, config: { url: '/share/project/p1/unshare' } }))
    wrapper.vm.unshare(0, { id: 'u2' })
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.write_forbidden')
  })
})
