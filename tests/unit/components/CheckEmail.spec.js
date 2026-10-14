import { shallowMount } from '@vue/test-utils'
import CheckEmail from '@/components/CheckEmail'

jest.mock('@/utils/Api', () => ({
  post: jest.fn()
}))

const Api = require('@/utils/Api')
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const mountCheckEmail = (email = 'user@example.com') => shallowMount(CheckEmail, {
  mocks: {
    $t: (key) => key,
    $route: { query: email ? { email } : {} },
    $router: { push: jest.fn() }
  }
})

describe('CheckEmail.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('displays message with email when email is in query', () => {
    const wrapper = mountCheckEmail('user@example.com')
    expect(wrapper.text()).toContain('account.check_email_message')
  })

  it('displays fallback message when no email in query', () => {
    const wrapper = mountCheckEmail(null)
    expect(wrapper.text()).toContain('account.check_email_no_email')
  })

  it('calls resend_verification API with email on resend', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCheckEmail()
    await wrapper.vm.resendEmail()
    expect(Api.post).toHaveBeenCalledWith('/auth/resend_verification', { email: 'user@example.com' })
  })

  it('shows success state after successful resend', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCheckEmail()
    await wrapper.vm.resendEmail()
    expect(wrapper.vm.resentSuccess).toBe(true)
    expect(wrapper.vm.resentError).toBe(false)
  })

  it('shows error state when resend fails', async () => {
    Api.post.mockRejectedValue(new Error('Network error'))
    const wrapper = mountCheckEmail()
    wrapper.vm.resendEmail()
    await flushPromises()
    expect(wrapper.vm.resentError).toBe(true)
    expect(wrapper.vm.resentSuccess).toBe(false)
  })

  it('sets isResending true during request and false after', async () => {
    let resolvePromise
    Api.post.mockReturnValue(new Promise(resolve => { resolvePromise = resolve }))
    const wrapper = mountCheckEmail()
    const resendPromise = wrapper.vm.resendEmail()
    expect(wrapper.vm.isResending).toBe(true)
    resolvePromise({ data: {} })
    await resendPromise
    expect(wrapper.vm.isResending).toBe(false)
  })

  it('resets previous success/error flags on new resend attempt', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCheckEmail()
    wrapper.vm.resentError = true
    await wrapper.vm.resendEmail()
    expect(wrapper.vm.resentError).toBe(false)
    expect(wrapper.vm.resentSuccess).toBe(true)
  })
})
