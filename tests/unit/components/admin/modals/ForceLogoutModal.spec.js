import { shallowMount, createLocalVue } from '@vue/test-utils'
import ForceLogoutModal from '@/components/admin/modals/ForceLogoutModal.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  delete: jest.fn().mockResolvedValue({ data: { result: 'success', tokens_deleted: 3 } })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeUser = (overrides = {}) => ({
  id: 'user_abc',
  username: 'user@test.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  ...overrides
})

const makeWrapper = (propsData = {}) => {
  const wrapper = shallowMount(ForceLogoutModal, {
    localVue,
    propsData: { user: makeUser(), ...propsData },
    mocks: { $t: (key, params) => params ? `${key}:${JSON.stringify(params)}` : key },
    stubs: { 'b-modal': true, 'b-alert': true, 'b-spinner': true }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('ForceLogoutModal.vue — confirm()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls DELETE /admin/users/:id/sessions', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.delete).toHaveBeenCalledWith('/admin/users/user_abc/sessions')
  })

  it('emits logged-out with the userId on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.emitted('logged-out')).toBeTruthy()
    expect(wrapper.emitted('logged-out')[0]).toEqual(['user_abc'])
  })

  it('hides modal on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('shows successMessage with tokens_deleted count', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.successMessage).toContain('3')
  })

  it('uses 0 as count when tokens_deleted is absent', async () => {
    Api.delete.mockResolvedValueOnce({ data: { result: 'success' } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.successMessage).toContain('0')
  })

  it('sets error_self_action when response message contains "own"', async () => {
    Api.delete.mockRejectedValueOnce({
      response: { status: 400, data: { result: 'forbidden', message: 'Cannot force logout yourself.' } }
    })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_self_action')
    expect(wrapper.emitted('logged-out')).toBeFalsy()
  })

  it('sets generic save_error on other failures', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('notifications.save_error')
  })

  it('resets isLoading to false after success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('resets isLoading to false after failure', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('does not hide modal on failure', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).not.toHaveBeenCalled()
  })
})
