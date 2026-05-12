import { shallowMount, createLocalVue } from '@vue/test-utils'
import ActivateUserModal from '@/components/admin/modals/ActivateUserModal.vue'
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
  active: false,
  ...overrides
})

const makeWrapper = (propsData = {}) => {
  const wrapper = shallowMount(ActivateUserModal, {
    localVue,
    propsData: { user: makeUser(), ...propsData },
    mocks: { $t: key => key },
    stubs: { 'b-modal': true, 'b-alert': true, 'b-spinner': true }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('ActivateUserModal.vue — confirm()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls PATCH /admin/users/:id/activate with the correct id', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/admin/users/user_abc/activate')
  })

  it('emits activated with the userId on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.emitted('activated')).toBeTruthy()
    expect(wrapper.emitted('activated')[0]).toEqual(['user_abc'])
  })

  it('hides modal on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('sets error_self_action when response message contains "own"', async () => {
    Api.patch.mockRejectedValueOnce({
      response: { status: 400, data: { result: 'forbidden', message: 'Cannot activate your own account.' } }
    })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_self_action')
    expect(wrapper.emitted('activated')).toBeFalsy()
  })

  it('sets generic save_error on other API failures', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 403, data: {} } })
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
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('does not hide modal on failure', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).not.toHaveBeenCalled()
  })
})
