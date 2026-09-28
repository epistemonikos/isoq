import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import Login from '@/components/Login'

jest.mock('@/utils/Api', () => ({ post: jest.fn() }))
const Api = require('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

function mountLogin (storeState = {}) {
  const store = { state: Vue.observable({ status: '', ...storeState }), dispatch: jest.fn() }
  return shallowMount(Login, {
    mocks: { $t: (key) => key, $route: { query: {}, hash: '' }, $router: { push: jest.fn() }, $store: store }
  })
}

// Lo que se afirma es qué alert queda VISIBLE y con qué texto, no el estado interno.
const visibleAlerts = (wrapper) => wrapper.findAll('b-alert')
  .filter(a => a.attributes('show') === 'true')
  .wrappers.map(a => a.text())

describe('Login — un fallo del servidor no es un error de credenciales', () => {
  beforeEach(() => jest.clearAllMocks())

  // El store hace `commit('auth_error')` también cuando la petición no llegó, y la pantalla
  // decía «el usuario o la contraseña son incorrectos»: con el servidor caído, la persona
  // creía haberse equivocado y podía terminar reseteando una contraseña que estaba bien.
  it('sin respuesta: dice que no se pudo conectar, no que las credenciales están mal', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation(() => {
      wrapper.vm.$store.state.status = 'error'
      return Promise.reject(Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0, data: { offline: true } } }))
    })
    wrapper.vm.login()
    await flushPromises()
    const alerts = visibleAlerts(wrapper)
    expect(alerts.join(' ')).toContain('common.connection_failed')
    expect(alerts.join(' ')).not.toContain('auth.login_error')
  })

  it('un 5xx: el servidor no pudo, no las credenciales', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation(() => {
      wrapper.vm.$store.state.status = 'error'
      return Promise.reject(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    })
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.server_failed')
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
  })

  it('credenciales incorrectas siguen diciendo eso', async () => {
    const wrapper = mountLogin({ status: 'error' })
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('auth.login_error')
  })

  it('volver a escribir borra el aviso de conexión', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation(() => Promise.reject(Object.assign(new Error('x'), { isOfflineError: true, response: { status: 0 } })))
    wrapper.vm.login()
    await flushPromises()
    wrapper.vm.username = 'otro@example.com'
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('common.connection_failed')
  })
})

describe('Login — reenviar la verificación que falla', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lo dice al lado del botón, como dice cuando sí se reenvió', async () => {
    const wrapper = mountLogin()
    await wrapper.setData({ emailNotVerified: true, username: 'ana@example.com' })
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    wrapper.vm.resendVerification()
    await flushPromises()
    expect(wrapper.html()).toContain('account.resend_email_failed')
    expect(wrapper.html()).toContain('common.server_failed')
    expect(wrapper.vm.isResendingVerification).toBe(false)
  })
})
