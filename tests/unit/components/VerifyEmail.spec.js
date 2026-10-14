import { shallowMount } from '@vue/test-utils'
import VerifyEmail from '@/components/VerifyEmail'

jest.mock('@/utils/Api', () => ({
  get: jest.fn()
}))

const Api = require('@/utils/Api')
const mockPush = jest.fn()

const mountVerifyEmail = (token = 'abc123') => shallowMount(VerifyEmail, {
  mocks: {
    $t: (key) => key,
    $route: { params: { token } },
    $router: { push: mockPush }
  }
})

describe('VerifyEmail.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('starts in verifying state', () => {
    Api.get.mockReturnValue(new Promise(() => {}))
    const wrapper = mountVerifyEmail()
    expect(wrapper.vm.status).toBe('verifying')
  })

  it('calls verify_email API with token from route on created', () => {
    Api.get.mockResolvedValue({ data: { status: 'verified' } })
    mountVerifyEmail('my-token-123')
    expect(Api.get).toHaveBeenCalledWith('/auth/verify_email/my-token-123')
  })

  it('sets status to verified on successful response', async () => {
    Api.get.mockResolvedValue({ data: { status: 'verified' } })
    const wrapper = mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    expect(wrapper.vm.status).toBe('verified')
  })

  it('redirects to Login after 2s when verified', async () => {
    Api.get.mockResolvedValue({ data: { status: 'verified' } })
    mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    expect(mockPush).not.toHaveBeenCalled()
    jest.runAllTimers()
    expect(mockPush).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('sets status to failed when API returns non-verified status', async () => {
    Api.get.mockResolvedValue({ data: { status: 'invalid_token' } })
    const wrapper = mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    expect(wrapper.vm.status).toBe('failed')
  })

  // Un token inválido llega como 200 {status: 'invalid_token'} (core.py verify_email): lo que cae
  // en el catch es que la petición no llegó o el servidor falló. Decir «la verificación falló»
  // ahí mandaba a pedir otro correo cuando el enlace estaba bien.
  it('un error de la petición no es un enlace inválido: lo dice y deja reintentar', async () => {
    Api.get.mockRejectedValue(Object.assign(new Error('Network error'), { request: {} }))
    const wrapper = mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    expect(wrapper.vm.status).toBe('request_failed')
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('common.connection_failed')
    expect(wrapper.html()).not.toContain('account.verification_failed')
  })

  it('reintentar vuelve a verificar', async () => {
    Api.get.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } } }))
    const wrapper = mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain('common.server_failed')
    Api.get.mockResolvedValueOnce({ data: { status: 'verified' } })
    wrapper.vm.verifyToken()
    await Promise.resolve()
    await Promise.resolve()
    expect(wrapper.vm.status).toBe('verified')
  })

  it('does not redirect if verification fails', async () => {
    Api.get.mockRejectedValue(new Error('Network error'))
    mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    jest.runAllTimers()
    expect(mockPush).not.toHaveBeenCalled()
  })
})
