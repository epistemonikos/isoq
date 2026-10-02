import { shallowMount, createLocalVue } from '@vue/test-utils'
import EditUserModal from '@/components/admin/modals/EditUserModal.vue'
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
  ...overrides
})

const makeWrapper = (propsData = {}) => {
  const wrapper = shallowMount(EditUserModal, {
    localVue,
    propsData: { user: makeUser(), ...propsData },
    mocks: { $t: key => key },
    stubs: {
      'b-modal': true, 'b-alert': true, 'b-spinner': true,
      'b-form': true, 'b-form-group': true, 'b-form-input': true
    }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

// ─── initForm ────────────────────────────────────────────────────────────────

describe('EditUserModal.vue — initForm()', () => {
  it('copies user fields into form', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    expect(wrapper.vm.form.first_name).toBe('Juan')
    expect(wrapper.vm.form.last_name).toBe('Pérez')
    expect(wrapper.vm.form.username).toBe('user@test.com')
  })

  it('stores original values separately', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    expect(wrapper.vm.original).toEqual({ first_name: 'Juan', last_name: 'Pérez', username: 'user@test.com' })
  })
})

// ─── buildPayload ─────────────────────────────────────────────────────────────

describe('EditUserModal.vue — buildPayload()', () => {
  it('returns only changed fields', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    const payload = wrapper.vm.buildPayload()
    expect(payload).toEqual({ first_name: 'Pedro' })
    expect(payload.last_name).toBeUndefined()
    expect(payload.username).toBeUndefined()
  })

  it('returns empty object when nothing changed', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    expect(wrapper.vm.buildPayload()).toEqual({})
  })

  it('can return multiple changed fields', () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    wrapper.vm.form.username = 'new@test.com'
    const payload = wrapper.vm.buildPayload()
    expect(payload).toEqual({ first_name: 'Pedro', username: 'new@test.com' })
  })
})

// ─── confirm ─────────────────────────────────────────────────────────────────

describe('EditUserModal.vue — confirm()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets error_no_changes and does not call API when nothing changed', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    await wrapper.vm.confirm()
    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.error).toBe('admin.error_no_changes')
  })

  it('calls PATCH /admin/users/:id with only changed fields', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/admin/users/user_abc', { first_name: 'Pedro' })
  })

  it('emits updated with userId and changes on success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.emitted('updated')).toBeTruthy()
    expect(wrapper.emitted('updated')[0]).toEqual(['user_abc', { first_name: 'Pedro' }])
  })

  it('hides modal on success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('sets error_username_taken on username_taken result', async () => {
    Api.patch.mockRejectedValueOnce({
      response: { status: 400, data: { result: 'username_taken', message: 'Username already in use.' } }
    })
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.username = 'taken@test.com'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_username_taken')
    expect(wrapper.emitted('updated')).toBeFalsy()
  })

  it('sets error_no_changes on no_changes result from server', async () => {
    Api.patch.mockRejectedValueOnce({
      response: { status: 400, data: { result: 'no_changes' } }
    })
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_no_changes')
  })

  it('sets generic save_error on other failures', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('notifications.save_error')
  })

  it('resets isLoading to false after success', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('resets isLoading to false after failure', async () => {
    Api.patch.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    wrapper.vm.initForm()
    wrapper.vm.form.first_name = 'Pedro'
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })
})
