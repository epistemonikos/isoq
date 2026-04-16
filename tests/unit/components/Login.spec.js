import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import Login from '@/components/Login'

jest.mock('@/utils/Api', () => ({
  post: jest.fn()
}))

const Api = require('@/utils/Api')
const mockPush = jest.fn()

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const mountLogin = (storeState = {}, routeQuery = {}) => {
  const store = {
    state: Vue.observable({ status: '', ...storeState }),
    dispatch: jest.fn()
  }
  return shallowMount(Login, {
    mocks: {
      $t: (key) => key,
      $route: { query: routeQuery, hash: '' },
      $router: { push: mockPush },
      $store: store
    }
  })
}

describe('Login.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('dispatches login action with credentials on submit', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockResolvedValue({ data: { personal_organization: 'org-1' } })
    wrapper.vm.username = 'user@example.com'
    wrapper.vm.password = 'password123'
    wrapper.vm.login()
    await flushPromises()
    expect(wrapper.vm.$store.dispatch).toHaveBeenCalledWith('login', {
      username: 'user@example.com',
      password: 'password123'
    })
  })

  it('redirects to workspace on successful login', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockResolvedValue({ data: { personal_organization: 'org-1' } })
    wrapper.vm.login()
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ path: '/workspace/org-1' })
  })

  it('redirects to query redirect path if present', async () => {
    const wrapper = mountLogin({}, { redirect: '/some/path' })
    wrapper.vm.$store.dispatch.mockResolvedValue({ data: { personal_organization: 'org-1' } })
    wrapper.vm.login()
    await flushPromises()
    expect(mockPush).toHaveBeenCalledWith({ path: '/some/path' })
  })

  it('sets emailNotVerified true when server returns email_not_verified', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockRejectedValue({
      response: { data: { status: 'email_not_verified' } }
    })
    wrapper.vm.username = 'unverified@example.com'
    wrapper.vm.login()
    await flushPromises()
    expect(wrapper.vm.emailNotVerified).toBe(true)
  })

  it('does not set emailNotVerified for generic login errors', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockRejectedValue(new Error('Wrong password'))
    wrapper.vm.login()
    await flushPromises()
    expect(wrapper.vm.emailNotVerified).toBe(false)
  })

  it('resets emailNotVerified when username changes', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockRejectedValue({
      response: { data: { status: 'email_not_verified' } }
    })
    wrapper.vm.login()
    await flushPromises()
    expect(wrapper.vm.emailNotVerified).toBe(true)
    wrapper.vm.username = 'other@example.com'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.emailNotVerified).toBe(false)
  })

  it('resets emailNotVerified when password changes', async () => {
    const wrapper = mountLogin()
    wrapper.vm.$store.dispatch.mockRejectedValue({
      response: { data: { status: 'email_not_verified' } }
    })
    wrapper.vm.login()
    await flushPromises()
    wrapper.vm.password = 'newpassword'
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.emailNotVerified).toBe(false)
  })

  it('calls resend_verification API with username', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountLogin()
    wrapper.vm.username = 'user@example.com'
    await wrapper.vm.resendVerification()
    expect(Api.post).toHaveBeenCalledWith('/auth/resend_verification', { email: 'user@example.com' })
  })

  it('sets resendVerificationSent true after successful resend', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountLogin()
    await wrapper.vm.resendVerification()
    expect(wrapper.vm.resendVerificationSent).toBe(true)
  })

  it('sets isResendingVerification false after resend completes', async () => {
    Api.post.mockResolvedValue({ data: {} })
    const wrapper = mountLogin()
    await wrapper.vm.resendVerification()
    expect(wrapper.vm.isResendingVerification).toBe(false)
  })

  it('resets resendVerificationSent on new login attempt', async () => {
    const wrapper = mountLogin()
    wrapper.vm.resendVerificationSent = true
    wrapper.vm.$store.dispatch.mockResolvedValue({ data: { personal_organization: 'org-1' } })
    wrapper.vm.login()
    await flushPromises()
    expect(wrapper.vm.resendVerificationSent).toBe(false)
  })
})
