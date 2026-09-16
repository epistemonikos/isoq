import { shallowMount, createLocalVue } from '@vue/test-utils'
import DeleteUserModal from '@/components/admin/modals/DeleteUserModal.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  delete: jest.fn().mockResolvedValue({ data: { result: 'success', message: 'User and associated data deleted.' } })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeUser = (overrides = {}) => ({
  id: 'user_abc',
  username: 'user@test.com',
  first_name: 'Juan',
  last_name: 'Pérez',
  active: true,
  ...overrides
})

const makeWrapper = (propsData = {}) => {
  const wrapper = shallowMount(DeleteUserModal, {
    localVue,
    propsData: { user: makeUser(), allUsers: [], ...propsData },
    mocks: { $t: key => key },
    stubs: {
      'b-modal': true,
      'b-alert': true,
      'b-spinner': true,
      'b-form-select': true,
      'b-form-select-option': true
    }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

// ─── loadProjects ─────────────────────────────────────────────────────────────

describe('DeleteUserModal.vue — loadProjects()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls GET /admin/users/:id/projects', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users/user_abc/projects')
  })

  it('populates projects on success', async () => {
    const projects = [
      { id: 'p1', name: 'Private', can_write: [], can_read: [] },
      { id: 'p2', name: 'Shared', can_write: ['u2'], can_read: [] }
    ]
    Api.get.mockResolvedValueOnce({ data: projects })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.projects).toEqual(projects)
  })

  it('initializes transfers only for shared projects (can_write or can_read non-empty)', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Private', can_write: [], can_read: [] },
      { id: 'p2', name: 'Shared write', can_write: ['u2'], can_read: [] },
      { id: 'p3', name: 'Shared read', can_write: [], can_read: ['u3'] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.transfers).not.toHaveProperty('p1')
    expect(wrapper.vm.transfers).toHaveProperty('p2', null)
    expect(wrapper.vm.transfers).toHaveProperty('p3', null)
  })

  it('sets error on API failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_load_projects')
  })

  it('does not call API when user prop is null', async () => {
    const wrapper = makeWrapper({ user: null })
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('resets isLoading to false after success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('resets isLoading to false after failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.isLoading).toBe(false)
  })
})

// ─── confirm (DELETE) ─────────────────────────────────────────────────────────

describe('DeleteUserModal.vue — confirm()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls DELETE /admin/users/:id with empty ownership_transfers when no shared projects', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.delete).toHaveBeenCalledWith('/admin/users/user_abc', { ownership_transfers: {} })
  })

  it('sends ownership_transfers for each shared project', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Shared', can_write: ['u2'], can_read: [] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    await wrapper.setData({ transfers: { p1: 'u2' } })
    await wrapper.vm.confirm()
    await flushPromises()
    expect(Api.delete).toHaveBeenCalledWith('/admin/users/user_abc', {
      ownership_transfers: { p1: 'u2' }
    })
  })

  it('omits shared projects with null transfer (not yet assigned)', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Shared', can_write: ['u2'], can_read: [] },
      { id: 'p2', name: 'Also shared', can_write: ['u3'], can_read: [] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    await wrapper.setData({ transfers: { p1: 'u2', p2: null } })
    await wrapper.vm.confirm()
    await flushPromises()
    const callArg = Api.delete.mock.calls[0][1]
    expect(callArg.ownership_transfers).toEqual({ p1: 'u2' })
    expect(callArg.ownership_transfers).not.toHaveProperty('p2')
  })

  it('emits deleted with userId on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.emitted('deleted')).toBeTruthy()
    expect(wrapper.emitted('deleted')[0]).toEqual(['user_abc'])
  })

  it('hides modal on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
  })

  it('sets error_transfer_required on transfer_required response', async () => {
    Api.delete.mockRejectedValueOnce({ response: { data: { result: 'transfer_required', message: 'Project X needs a new owner.' } } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_transfer_required')
    expect(wrapper.emitted('deleted')).toBeFalsy()
  })

  it('sets error_invalid_transfer on invalid_transfer response', async () => {
    Api.delete.mockRejectedValueOnce({ response: { data: { result: 'invalid_transfer', message: 'bad owner' } } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_invalid_transfer')
  })

  it('sets error_self_action on forbidden response', async () => {
    Api.delete.mockRejectedValueOnce({ response: { data: { result: 'forbidden', message: 'Cannot delete your own account.' } } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_self_action')
  })

  it('sets generic delete_error on other failures', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.error).toBe('notifications.delete_error')
  })

  it('resets isDeleting to false after success', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isDeleting).toBe(false)
  })

  it('resets isDeleting to false after failure', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.isDeleting).toBe(false)
  })

  it('does not hide modal on failure', async () => {
    Api.delete.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    const wrapper = makeWrapper()
    await wrapper.vm.confirm()
    await flushPromises()
    expect(wrapper.vm.$refs.modal.hide).not.toHaveBeenCalled()
  })
})

// ─── sharedProjects computed ──────────────────────────────────────────────────

describe('DeleteUserModal.vue — sharedProjects (computed)', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns only projects with at least one collaborator in can_write or can_read', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Private', can_write: [], can_read: [] },
      { id: 'p2', name: 'Shared write', can_write: ['u2'], can_read: [] },
      { id: 'p3', name: 'Shared read', can_write: [], can_read: ['u3'] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.sharedProjects).toHaveLength(2)
    expect(wrapper.vm.sharedProjects.map(p => p.id)).toEqual(['p2', 'p3'])
  })

  it('isOkDisabled is true while any shared project has no transfer assigned', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Shared', can_write: ['u2'], can_read: [] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    expect(wrapper.vm.isOkDisabled).toBe(true)
  })

  it('isOkDisabled is false once all shared projects have a transfer', async () => {
    Api.get.mockResolvedValueOnce({ data: [
      { id: 'p1', name: 'Shared', can_write: ['u2'], can_read: [] }
    ] })
    const wrapper = makeWrapper()
    await wrapper.vm.loadProjects()
    await flushPromises()
    await wrapper.setData({ transfers: { p1: 'u2' } })
    expect(wrapper.vm.isOkDisabled).toBe(false)
  })
})
