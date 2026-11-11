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
      // La forma REAL del backend: sus manejadores globales (server.py) responden
      // `{status: 'error'}` en 400/401/403/404/500. Con `data: {}` el test confirmaba la
      // suposición del cliente en vez de lo que manda el servidor, y un 500 real quedaba mudo.
      return Promise.reject(Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error', message: 'Internal server error.' } } }))
    })
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.server_failed')
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
  })

  it('credenciales incorrectas siguen diciendo eso', async () => {
    // Sin tocar `store.status`: el aviso tiene que salir del motivo que llega en el rechazo,
    // no del estado global (que el store pone en todo fallo).
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation(() => Promise.reject({ response: { data: { status: 'invalid_credentials' } } }))
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('auth.login_error')
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('common.connection_failed')
  })

  // El destello: el store pone `status = 'error'` ANTES de rechazar. Si el aviso de
  // credenciales colgara de ese estado, se mostraría en ese instante aunque el motivo real
  // fuera la red. Se congela justo ahí —estado en error, promesa todavía sin resolver— y no
  // tiene que haber ningún aviso de credenciales.
  it('mientras el motivo no se sabe, no se muestra el aviso de credenciales', async () => {
    const wrapper = mountLogin()
    let rechazar
    wrapper.vm.$store.dispatch.mockImplementation(() => {
      wrapper.vm.$store.state.status = 'error'
      return new Promise((resolve, reject) => { rechazar = reject })
    })
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
    rechazar(Object.assign(new Error('x'), { isOfflineError: true, response: { status: 0 } }))
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.connection_failed')
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
  })

  it('cerrar el aviso de credenciales lo oculta y limpia el estado del store', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation((name) => {
      if (name === 'login') {
        wrapper.vm.$store.state.status = 'error'
        return Promise.reject({ response: { data: { status: 'invalid_credentials' } } })
      }
      return Promise.resolve()
    })
    wrapper.vm.login()
    await flushPromises()
    wrapper.vm.onCredentialsAlertDismissed()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('changeStatus')
  })

  it('volver a escribir borra el aviso de credenciales', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockImplementation(() => Promise.reject({ response: { data: { status: 'invalid_credentials' } } }))
    wrapper.vm.login()
    await flushPromises()
    // Primero tiene que verse: sin esto el test pasa aunque el aviso nunca aparezca.
    expect(visibleAlerts(wrapper).join(' ')).toContain('auth.login_error')
    wrapper.vm.password = 'otra'
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('auth.login_error')
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

describe('Login — los otros rechazos del servidor', () => {
  beforeEach(() => jest.clearAllMocks())

  const rechazaCon = (wrapper, error) => wrapper.vm.$store.dispatch.mockImplementation(() => Promise.reject(error))

  // Allowlist: sólo los tres `status` conocidos tienen aviso propio. Cualquier otro que mande
  // el servidor —hoy `'error'`, mañana el que sea— es un fallo de la petición, y se ve.
  it.each([
    [400, { status: 'error', type: 'missing_fields' }],
    [403, { status: 'error', message: 'Access denied.' }],
    [500, { status: 'un_status_que_todavia_no_existe' }]
  ])('un %s con status desconocido se ve', async (code, data) => {
    const wrapper = mountLogin()
    rechazaCon(wrapper, Object.assign(new Error(String(code)), { response: { status: code, data } }))
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.server_failed')
  })

  // `/auth/login` está limitado a 5 por minuto y Flask-Limiter responde HTML sin `status`.
  // A la sexta contraseña equivocada, «el servidor falló» mandaba a esperar algo que no iba a
  // arreglarse solo antes de un minuto — ni a decir por qué.
  it('un 429: demasiados intentos', async () => {
    const wrapper = mountLogin()
    rechazaCon(wrapper, Object.assign(new Error('429'), { response: { status: 429, data: '<html>Too Many Requests</html>' } }))
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.too_many_attempts')
  })

  // Un error del router después de un login exitoso no es de red: decir «no se pudo
  // conectar» sería falso. No es un fallo de petición, así que no hay aviso de petición.
  it('un error que no es de una petición no dice que no se pudo conectar', async () => {
    const wrapper = mountLogin()
    rechazaCon(wrapper, new TypeError('boom en la navegación'))
    wrapper.vm.login()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('common.connection_failed')
  })
})

