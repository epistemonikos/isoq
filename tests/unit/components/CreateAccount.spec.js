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
