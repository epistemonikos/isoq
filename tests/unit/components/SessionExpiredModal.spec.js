import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import SessionExpiredModal from '@/components/SessionExpiredModal'
import { SESSION_EXPIRED, markSessionExpired, clearSessionExpired, isSessionExpired } from '@/utils/sessionExpiry'

jest.mock('@/utils/Api', () => ({ syncPendingOperations: jest.fn().mockResolvedValue(undefined) }))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { refHeartbeat: jest.fn().mockResolvedValue(undefined) }
}))

const Api = require('@/utils/Api')
const LockService = require('@/services/lockService').default
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const mountModal = (user = { id: 'u1', username: 'ana@example.com' }) => {
  const state = Vue.observable({ user })
  const store = {
    state,
    commit: jest.fn(),
    dispatch: jest.fn((action) => {
      if (action === 'login') state.user = { id: 'u1' }
      return Promise.resolve({ data: {} })
    })
  }
  return shallowMount(SessionExpiredModal, {
    mocks: {
      $t: (key) => key,
      $store: store,
      $route: { fullPath: '/workspace/org/isoqf/p1' },
      $router: { push: jest.fn() }
    }
  })
}

describe('SessionExpiredModal.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearSessionExpired()
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => key === 'l_s' ? 'tok' : null)
  })

  afterEach(() => jest.restoreAllMocks())

  it('aparece cuando la sesión vence, con el correo ya puesto', async () => {
    const wrapper = mountModal()
    expect(wrapper.vm.visible).toBe(false)

    markSessionExpired()
    await Vue.nextTick()

    expect(wrapper.vm.visible).toBe(true)
    expect(wrapper.vm.username).toBe('ana@example.com')
  })

  it('aparece aunque la sesión haya vencido antes de montarse', () => {
    markSessionExpired()
    expect(mountModal().vm.visible).toBe(true)
  })

  // Volver a entrar no navega: los editores abiertos y la cola offline siguen donde
  // estaban, y lo encolado sale en cuanto hay sesión.
  it('al volver a entrar con la misma cuenta restaura sin navegar y sincroniza', async () => {
    markSessionExpired()
    const wrapper = mountModal()
    wrapper.vm.password = 'secreto'

    await wrapper.vm.reLogin()
    await flushPromises()

    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('login', {
      username: 'ana@example.com', password: 'secreto'
    })
    expect(isSessionExpired()).toBe(false)
    expect(wrapper.vm.visible).toBe(false)
    expect(wrapper.vm.password).toBe('')
    expect(Api.syncPendingOperations).toHaveBeenCalled()
    expect(LockService.refHeartbeat).toHaveBeenCalled()
    expect(wrapper.vm.$router.push).not.toHaveBeenCalled()
  })

  it('con credenciales incorrectas sigue abierto y lo dice', async () => {
    markSessionExpired()
    const wrapper = mountModal()
    wrapper.vm.$store.dispatch.mockRejectedValue({ response: { data: { status: 'invalid_credentials' } } })

    await wrapper.vm.reLogin()
    await flushPromises()

    expect(isSessionExpired()).toBe(true)
    expect(wrapper.vm.visible).toBe(true)
    expect(wrapper.vm.error).toBe('auth.login_error')
    expect(Api.syncPendingOperations).not.toHaveBeenCalled()
  })

  // Otra cuenta en la misma pestaña heredaría los editores abiertos y la cola de la
  // primera. Se recarga para empezar limpio.
  it('si entra con otra cuenta, recarga la página', async () => {
    markSessionExpired()
    const wrapper = mountModal()
    wrapper.vm.$store.dispatch.mockImplementation(() => {
      wrapper.vm.$store.state.user = { id: 'otro' }
      return Promise.resolve({ data: {} })
    })
    const reload = jest.fn()
    wrapper.vm.reloadPage = reload

    await wrapper.vm.reLogin()
    await flushPromises()

    expect(reload).toHaveBeenCalled()
    expect(Api.syncPendingOperations).not.toHaveBeenCalled()
  })

  it('«usar otra cuenta» cierra la sesión local y va al login con la vuelta', async () => {
    markSessionExpired()
    const wrapper = mountModal()

    wrapper.vm.useAnotherAccount()

    expect(wrapper.vm.$store.commit).toHaveBeenCalledWith('logout')
    expect(isSessionExpired()).toBe(false)
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({
      name: 'Login', query: { redirect: '/workspace/org/isoqf/p1' }
    })
  })

  it('deja de escuchar al desmontarse', () => {
    const wrapper = mountModal()
    const spy = jest.spyOn(window, 'removeEventListener')
    wrapper.destroy()
    expect(spy.mock.calls.map(([type]) => type)).toContain(SESSION_EXPIRED)
  })
})
