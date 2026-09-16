import { shallowMount } from '@vue/test-utils'
import CreateAccount from '@/components/CreateAccount'
import { TERMS_VERSION } from '@/constants/terms'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  post: jest.fn()
}))

const Api = require('@/utils/Api')
const mockPush = jest.fn()
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const mountCreateAccount = (query = {}) => shallowMount(CreateAccount, {
  mocks: {
    $t: (key) => key,
    $route: { query },
    $router: { push: mockPush }
  }
})

describe('CreateAccount.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ENABLE_REGISTRATION = 'true'
  })

  // ─── Consentimiento de términos (GDPR) ───────────────────────────────────────
  //
  // El backend los exige y son estrictos: terms_accepted debe ser boolean y
  // terms_version un int entre 1 y CURRENT_TERMS_VERSION
  // (isoq_server_py310, auth_server/controllers/router.py:202-215). Sin ellos
  // el alta devuelve 400 y nadie puede registrarse.

  it('envía la aceptación de términos al crear la cuenta', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user.terms_accepted).toBe(true)
    expect(payload.user.terms_version).toBe(TERMS_VERSION)
  })

  it('manda terms_accepted como booleano, no como string', async () => {
    // El backend usa isinstance(x, bool): 'true' devolvería 400.
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(typeof payload.user.terms_accepted).toBe('boolean')
    expect(typeof payload.user.terms_version).toBe('number')
  })

  it('envía las dos preferencias de privacidad, desmarcadas por defecto', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user.newsletter).toBe(false)
    expect(payload.user.improvement).toBe(false)
  })

  it('propaga las preferencias que el usuario marcó', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    wrapper.setData({ newsletter: true, improvement: true })
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user.newsletter).toBe(true)
    expect(payload.user.improvement).toBe(true)
  })

  it('shows disabled message when registration is disabled', () => {
    process.env.ENABLE_REGISTRATION = 'false'
    const wrapper = mountCreateAccount()
    expect(wrapper.text()).toContain('account.registration_disabled')
  })

  it('redirects to checkEmail with email on successful registration', async () => {
    Api.post.mockResolvedValue({ data: { status: 'verification_email_sent' } })
    const wrapper = mountCreateAccount()
    wrapper.vm.user.username = 'test@example.com'
    await wrapper.vm.createAccount()
    expect(mockPush).toHaveBeenCalledWith({
      name: 'checkEmail',
      query: { email: 'test@example.com' }
    })
  })

  it('shows error message from server on registration failure', async () => {
    Api.post.mockRejectedValue({ response: { data: { message: 'Email already in use' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe('Email already in use')
  })

  it('shows generic error message when server provides no message', async () => {
    Api.post.mockRejectedValue(new Error('Network error'))
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe('account.create_error')
  })

  // ─── La clave `msg` de create_user ───────────────────────────────────────────
  //
  // El backend usa 'message' en ~200 respuestas, pero create_user usa 'msg' en 7
  // (router.py: email duplicado, email inválido, dominio rechazado, campos
  // faltantes...). Leyendo sólo 'message' esos siete caían en el error genérico:
  // quien escribía un email ya registrado veía "ocurrió un error, intente
  // nuevamente" y no tenía forma de saber qué corregir.

  it('muestra el texto del servidor cuando viene en msg', async () => {
    Api.post.mockRejectedValue({ response: { data: { msg: 'email already registered' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe('email already registered')
  })

  it.each([
    'invalid email',
    'must be filled',
    'invalid user data',
    'first_name exceeds maximum length'
  ])('muestra %p, que create_user manda en msg', async (texto) => {
    Api.post.mockRejectedValue({ response: { data: { msg: texto } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe(texto)
  })

  it('prioriza message sobre msg si vinieran los dos', async () => {
    // 'message' es la convención del backend (~200 usos contra 8), así que ante
    // la duda gana esa. No se conocen respuestas con ambas claves; el test fija
    // el orden para que no quede al azar del cortocircuito.
    Api.post.mockRejectedValue({ response: { data: { message: 'el bueno', msg: 'el legado' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe('el bueno')
  })

  it('cae al genérico si el cuerpo no trae ni message ni msg', async () => {
    Api.post.mockRejectedValue({ response: { data: { result: 'algo_inesperado' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.errorMessage).toBe('account.create_error')
  })

  // ─── Rechazos que llegan con HTTP 200 ────────────────────────────────────────
  //
  // create_user devuelve 200 en SEIS respuestas que no son un alta exitosa
  // (router.py): cinco con {"msg": ...} y una con {"status":
  // "password_compromised"}. Sólo {"status": "verification_email_sent"} es éxito.
  //
  // Axios no las trata como error, así que caen en el .then(). Si ese .then()
  // navega sin mirar la respuesta, el usuario ve "revisá tu correo" por una
  // cuenta que no existe, y espera un email que no va a llegar nunca.
  //
  // Dos de esos casos son alcanzables desde la UI: la contraseña comprometida
  // (el front valida largo, no filtraciones) y los campos de más de 200
  // caracteres (el front no valida largo de nombre ni apellido).

  it('no navega a checkEmail cuando el 200 trae un msg de rechazo', async () => {
    Api.post.mockResolvedValue({ data: { msg: 'invalid email' } })
    const wrapper = mountCreateAccount()
    wrapper.vm.user.username = 'esto-no-es-un-email'
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.vm.errorMessage).toBe('invalid email')
  })

  it('avisa de la contraseña comprometida en vez de prometer un email', async () => {
    Api.post.mockResolvedValue({ data: { status: 'password_compromised' } })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.vm.errorMessage).toBe('account.password_compromised')
  })

  it.each([
    'invalid user data',
    'must be filled',
    'first_name exceeds maximum length',
    'invalid format for last_name, must be a string'
  ])('no navega con el 200 que trae %p', async (texto) => {
    Api.post.mockResolvedValue({ data: { msg: texto } })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(mockPush).not.toHaveBeenCalled()
    expect(wrapper.vm.errorMessage).toBe(texto)
  })

  it('libera el botón tras un rechazo con 200', async () => {
    // Sin esto el botón queda en spinner para siempre: isProcessing sólo se
    // bajaba en el .catch(), y estos rechazos no pasan por ahí.
    Api.post.mockResolvedValue({ data: { msg: 'invalid email' } })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(wrapper.vm.ui.isProcessing).toBe(false)
  })

  it('sigue navegando cuando el alta realmente funciona', async () => {
    // El contrapeso de todo lo anterior: verification_email_sent es el único
    // éxito, y no debe quedar bloqueado por los chequeos nuevos.
    Api.post.mockResolvedValue({ data: { status: 'verification_email_sent' } })
    const wrapper = mountCreateAccount()
    wrapper.vm.user.username = 'nueva@example.com'
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(mockPush).toHaveBeenCalledWith({
      name: 'checkEmail',
      query: { email: 'nueva@example.com' }
    })
    expect(wrapper.vm.errorMessage).toBe('')
  })

  it('sigue navegando si el backend responde un 200 sin cuerpo reconocible', async () => {
    // Compatibilidad: varios tests y llamadas reales devuelven {} y eso
    // históricamente se trató como éxito. No convertir eso en un error.
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    wrapper.vm.user.username = 'otra@example.com'
    await wrapper.vm.createAccount()
    await flushPromises()

    expect(mockPush).toHaveBeenCalled()
  })

  it('sets isProcessing false after error', async () => {
    Api.post.mockRejectedValue(new Error('fail'))
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()
    expect(wrapper.vm.ui.isProcessing).toBe(false)
  })

  it('includes shared token when token is in query', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount({ token: 'TOKEN-ID-123' })
    await wrapper.vm.createAccount()
    expect(Api.post).toHaveBeenCalledWith('/create_user', expect.objectContaining({
      shared: { token: 'TOKEN-ID-123' }
    }))
  })

  it('does not include shared params when query is empty', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()
    expect(Api.post.mock.calls[0][1]).not.toHaveProperty('shared')
  })

  it('validates password: mismatch returns false', () => {
    const wrapper = mountCreateAccount()
    wrapper.vm.user.password = 'validpass1'
    wrapper.vm.user.password_2 = 'differentpass'
    wrapper.vm.comparePassword()
    expect(wrapper.vm.ui.password_validation).toBe(false)
  })

  it('validates password: too short returns false', () => {
    const wrapper = mountCreateAccount()
    wrapper.vm.user.password = 'short'
    wrapper.vm.user.password_2 = 'short'
    wrapper.vm.comparePassword()
    expect(wrapper.vm.ui.password_validation).toBe(false)
  })

  it('validates password: matching and long enough returns true', () => {
    const wrapper = mountCreateAccount()
    wrapper.vm.user.password = 'validpass1'
    wrapper.vm.user.password_2 = 'validpass1'
    wrapper.vm.comparePassword()
    expect(wrapper.vm.ui.password_validation).toBe(true)
  })
})

describe('CreateAccount.vue — con ENABLE_GDPR apagado', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ENABLE_REGISTRATION = 'true'
    process.env.ENABLE_GDPR = 'off'
  })

  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  // ─── Qué NO se afirma ────────────────────────────────────────────────────────
  //
  // Con el flag apagado el template no muestra notas legales ni casillas, así
  // que el payload no puede declarar una aceptación que nunca se pidió.
  // Omitir es distinto de mandar false: el backend reescribe newsletter e
  // improvement con lo que llegue (core.py:470-471).

  it('no manda los campos de términos', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user).not.toHaveProperty('terms_accepted')
    expect(payload.user).not.toHaveProperty('terms_version')
  })

  it('no manda los consentimientos, ni siquiera en false', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user).not.toHaveProperty('newsletter')
    expect(payload.user).not.toHaveProperty('improvement')
  })

  it('sigue mandando los datos del usuario', async () => {
    // El flag saca el consentimiento, no el alta: sin esto el test de arriba
    // pasaría igual con un payload vacío.
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount()
    wrapper.vm.user.username = 'ana@example.com'
    await wrapper.vm.createAccount()

    const payload = Api.post.mock.calls[0][1]
    expect(payload.user.username).toBe('ana@example.com')
  })

  it('sigue incluyendo el token compartido del query', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount({ token: 'TOKEN-ID-123' })
    await wrapper.vm.createAccount()

    expect(Api.post.mock.calls[0][1].shared).toEqual({ token: 'TOKEN-ID-123' })
  })

  it('no muestra las notas legales ni las casillas de consentimiento', () => {
    const wrapper = mountCreateAccount()
    const texto = wrapper.text()

    expect(texto).not.toContain('gdpr.signup.privacyNote')
    expect(texto).not.toContain('gdpr.signup.termsNote')
    expect(texto).not.toContain('gdpr.preferences.newsletter')
  })

  // ─── El 400 predecible ───────────────────────────────────────────────────────
  //
  // Pasa siempre que el flag esté apagado acá y el backend siga exigiendo los
  // campos. Sin un mensaje propio, invalid_terms_version (que viene SIN message)
  // caía en el error genérico y el síntoma no se relacionaba con el flag.

  it('explica el desajuste de configuración ante invalid_terms_version', async () => {
    Api.post.mockRejectedValue({ response: { data: { result: 'invalid_terms_version' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()

    expect(wrapper.vm.errorMessage).toBe('account.create_error_gdpr_mismatch')
  })

  it('explica el desajuste también ante invalid_payload', async () => {
    Api.post.mockRejectedValue({
      response: { data: { result: 'invalid_payload', message: 'terms_accepted must be a boolean' } }
    })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()

    // El message del backend es técnico y en inglés: no se le muestra al
    // usuario final aunque venga en la respuesta.
    expect(wrapper.vm.errorMessage).toBe('account.create_error_gdpr_mismatch')
  })

  it('no se apropia de otros errores del backend', async () => {
    Api.post.mockRejectedValue({ response: { data: { message: 'Email already in use' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()

    expect(wrapper.vm.errorMessage).toBe('Email already in use')
  })

  it('libera el botón tras el 400 de configuración', async () => {
    Api.post.mockRejectedValue({ response: { data: { result: 'invalid_terms_version' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()

    expect(wrapper.vm.ui.isProcessing).toBe(false)
  })
})

describe('CreateAccount.vue — invalid_terms_version con GDPR encendido', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ENABLE_REGISTRATION = 'true'
    process.env.ENABLE_GDPR = 'on'
  })

  it('no atribuye el fallo a la configuración', async () => {
    // Con el flag encendido sí mandamos los campos, así que un
    // invalid_terms_version significa otra cosa (por ejemplo TERMS_VERSION
    // desalineada con CURRENT_TERMS_VERSION del backend). Culpar al flag
    // mandaría a quien diagnostique en la dirección equivocada.
    Api.post.mockRejectedValue({ response: { data: { result: 'invalid_terms_version' } } })
    const wrapper = mountCreateAccount()
    wrapper.vm.createAccount()
    await flushPromises()

    expect(wrapper.vm.errorMessage).toBe('account.create_error')
  })
})
