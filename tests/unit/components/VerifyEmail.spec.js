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

  it('sets status to failed on API error', async () => {
    Api.get.mockRejectedValue(new Error('Network error'))
    const wrapper = mountVerifyEmail()
    await Promise.resolve()
    await Promise.resolve()
    expect(wrapper.vm.status).toBe('failed')
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
