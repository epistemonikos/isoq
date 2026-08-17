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
