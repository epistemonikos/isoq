import { shallowMount } from '@vue/test-utils'
import CreateAccount from '@/components/CreateAccount'

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

  it('includes shared params when o/p/r are in query', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountCreateAccount({ o: 'org1', p: 'proj1', r: 'ref1' })
    await wrapper.vm.createAccount()
    expect(Api.post).toHaveBeenCalledWith('/create_user', expect.objectContaining({
      shared: { o: 'org1', p: 'proj1', r: 'ref1' }
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
