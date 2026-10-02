import { shallowMount, createLocalVue } from '@vue/test-utils'
import ManageFlagsModal from '@/components/admin/modals/ManageFlagsModal.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  patch: jest.fn().mockResolvedValue({ data: { result: 'success' } })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeUser = (overrides = {}) => ({
  id: 'user_abc',
  username: 'user@test.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  support: false,
  superadmin: false,
  business_manager: false,
  ...overrides
})

const makeWrapper = (propsData = {}) => {
  const wrapper = shallowMount(ManageFlagsModal, {
    localVue,
    propsData: { user: makeUser(), currentUserId: 'admin_id', ...propsData },
    mocks: { $t: key => key },
    stubs: {
      'b-modal': true, 'b-alert': true, 'b-spinner': true, 'b-form-checkbox': true
    }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

// ─── isSelf ──────────────────────────────────────────────────────────────────

describe('ManageFlagsModal.vue — isSelf computed', () => {
  it('returns false when user id differs from currentUserId', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.isSelf).toBe(false)
  })

  it('returns true when user id equals currentUserId', () => {
    const wrapper = makeWrapper({ user: makeUser({ id: 'admin_id' }), currentUserId: 'admin_id' })
    expect(wrapper.vm.isSelf).toBe(true)
  })
})

// ─── initFlags ────────────────────────────────────────────────────────────────

describe('ManageFlagsModal.vue — initFlags()', () => {
  it('copies user flags into local state', () => {
    const wrapper = makeWrapper({ user: makeUser({ support: true, superadmin: false, business_manager: true }) })
    wrapper.vm.initFlags()
    expect(wrapper.vm.flags.support).toBe(true)
    expect(wrapper.vm.flags.superadmin).toBe(false)
    expect(wrapper.vm.flags.business_manager).toBe(true)
  })

  it('stores original values separately', () => {
    const wrapper = makeWrapper({ user: makeUser({ support: true }) })
    wrapper.vm.initFlags()
    expect(wrapper.vm.original.support).toBe(true)
  })
})

// ─── buildPayload ─────────────────────────────────────────────────────────────

describe('ManageFlagsModal.vue — buildPayload()', () => {
  it('returns only changed flags', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    const payload = wrapper.vm.buildPayload()
    expect(payload).toEqual({ support: true })
    expect(payload.superadmin).toBeUndefined()
  })

  it('returns empty object when nothing changed', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    expect(wrapper.vm.buildPayload()).toEqual({})
  })
})

// ─── confirm ─────────────────────────────────────────────────────────────────

describe('ManageFlagsModal.vue — confirm()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('hides modal without calling API when no flags changed', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('calls PATCH /admin/users/:id/flags with only changed flags', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/admin/users/user_abc/flags', { support: true })
  })

  it('emits flags-updated with userId and new flags on success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.emitted('flags-updated')).toBeTruthy()
    const [emittedId, emittedFlags] = wrapper.emitted('flags-updated')[0]
    expect(emittedId).toBe('user_abc')
    expect(emittedFlags.support).toBe(true)
  })

  it('hides modal on success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.business_manager = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('sets error_self_action when response message contains "own"', async () => {
    Api.patch.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'Cannot revoke your own superadmin flag.' } }
    })
    // user.superadmin = true so revoking it produces a non-empty payload and the API is called
    const wrapper = makeWrapper({ user: makeUser({ superadmin: true }) })
    wrapper.vm.initFlags()
    wrapper.vm.flags.superadmin = false
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_self_action')
  })

  it('sets error_self_action on 403', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 403, data: {} } })
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_self_action')
  })

  it('sets generic save_error on other failures', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('notifications.save_error')
  })

  it('resets isLoading to false after success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('resets isLoading to false after failure', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    wrapper.vm.initFlags()
    wrapper.vm.flags.support = true
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
