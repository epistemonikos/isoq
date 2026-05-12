import { shallowMount, createLocalVue } from '@vue/test-utils'
import AdminUsersTab from '@/components/admin/tabs/AdminUsersTab.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: { users: [], total: 0, limit: 50, offset: 0 } }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const STUBS = {
  'activate-user-modal': true,
  'deactivate-user-modal': true,
  'edit-user-modal': true,
  'manage-flags-modal': true,
  'force-logout-modal': true,
  'delete-user-modal': true,
  'b-table': true,
  'b-form-input': true,
  'b-form-select': true,
  'b-pagination': true,
  'b-alert': true,
  'b-modal': true,
  'b-spinner': true,
  'b-badge': true,
  'b-dropdown': true,
  'b-dropdown-item': true,
  'b-dropdown-divider': true,
  'b-row': true,
  'b-col': true,
  'font-awesome-icon': true
}

const makeApiResponse = (users = [], total = 0) => ({
  data: { users, total, limit: 50, offset: 0 }
})

let storeMock
let routerPush
let bvModal

const makeWrapper = (userState = {}) => {
  storeMock = {
    state: { user: { id: 'admin_id', support: true, superadmin: false, ...userState } },
    dispatch: jest.fn().mockResolvedValue({ personal_organization: 'org_personal_1' })
  }
  routerPush = jest.fn()
  bvModal = { show: jest.fn(), hide: jest.fn() }

  return shallowMount(AdminUsersTab, {
    localVue,
    mocks: {
      $t: key => key,
      $store: storeMock,
      $bvModal: bvModal,
      $router: { push: routerPush }
    },
    stubs: STUBS
  })
}

// ─── loadUsers ───────────────────────────────────────────────────────────────

describe('AdminUsersTab.vue — loadUsers()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sends _limit and _offset on created (page 1)', async () => {
    makeWrapper()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users', { _limit: 50, _offset: 0 })
  })

  it('calculates correct _offset for page 2', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    await wrapper.vm.loadUsers(2)
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users', { _limit: 50, _offset: 50 })
  })

  it('calculates correct _offset when perPage is changed', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    await wrapper.setData({ perPage: 25 })
    await wrapper.vm.loadUsers(3)
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users', { _limit: 25, _offset: 50 })
  })

  it('populates users from response.data.users', async () => {
    const users = [{ id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B', active: true, orgs: [] }]
    Api.get.mockResolvedValueOnce(makeApiResponse(users, 1))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.users).toEqual(users)
  })

  it('stores total from response.data.total', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse([], 1842))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.total).toBe(1842)
  })

  it('updates currentPage to the requested page on success', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    await wrapper.vm.loadUsers(3)
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(3)
  })

  it('sets loadError on failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.loadError).toBe('admin.load_error')
  })

  it('resets isBusy to false after success', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.isBusy).toBe(false)
  })

  it('resets isBusy to false after failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.isBusy).toBe(false)
  })
})

// ─── goToPage / onPerPageChange ───────────────────────────────────────────────

describe('AdminUsersTab.vue — goToPage() / onPerPageChange()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('goToPage calls loadUsers with the requested page', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    wrapper.vm.goToPage(4)
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users', { _limit: 50, _offset: 150 })
  })

  it('onPerPageChange resets to page 1 with new perPage', async () => {
    const wrapper = makeWrapper()
    await flushPromises()
    await wrapper.setData({ currentPage: 5, perPage: 10 })
    jest.clearAllMocks()
    wrapper.vm.onPerPageChange()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users', { _limit: 10, _offset: 0 })
    expect(wrapper.vm.currentPage).toBe(1)
  })
})

// ─── doImpersonate ───────────────────────────────────────────────────────────

describe('AdminUsersTab.vue — doImpersonate()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('dispatches forcedLogin with the selectedUser.id', async () => {
    const wrapper = makeWrapper()
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(storeMock.dispatch).toHaveBeenCalledWith('forcedLogin', 'u1')
  })

  it('redirects to viewOrganization with personal_organization on success', async () => {
    const wrapper = makeWrapper()
    storeMock.dispatch.mockResolvedValueOnce({ personal_organization: 'org_xyz' })
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(routerPush).toHaveBeenCalledWith({ name: 'viewOrganization', params: { id: 'org_xyz' } })
  })

  it('hides the impersonate modal on success', async () => {
    const wrapper = makeWrapper()
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(bvModal.hide).toHaveBeenCalledWith('modal-impersonate')
  })

  it('sets impersonateError on 403', async () => {
    const wrapper = makeWrapper()
    storeMock.dispatch.mockRejectedValueOnce({ response: { status: 403 } })
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(wrapper.vm.impersonateError).toBe('admin.error_self_action')
  })

  it('sets generic impersonateError on other errors', async () => {
    const wrapper = makeWrapper()
    storeMock.dispatch.mockRejectedValueOnce({ response: { status: 500 } })
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(wrapper.vm.impersonateError).toBe('notifications.error')
  })

  it('resets isImpersonating to false after success', async () => {
    const wrapper = makeWrapper()
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(wrapper.vm.isImpersonating).toBe(false)
  })

  it('resets isImpersonating to false after failure', async () => {
    const wrapper = makeWrapper()
    storeMock.dispatch.mockRejectedValueOnce({ response: { status: 500 } })
    await wrapper.setData({ selectedUser: { id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B' } })
    await wrapper.vm.doImpersonate()
    await flushPromises()
    expect(wrapper.vm.isImpersonating).toBe(false)
  })
})

// ─── openDelete ($nextTick fix) ──────────────────────────────────────────────

describe('AdminUsersTab.vue — openDelete()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets selectedUser al usuario correcto antes de que show() sea invocado', async () => {
    const wrapper = makeWrapper()
    const userA = { id: 'uA', username: 'a@b.com', first_name: 'A', last_name: 'A', active: true, orgs: [] }
    const userB = { id: 'uB', username: 'b@b.com', first_name: 'B', last_name: 'B', active: true, orgs: [] }

    wrapper.vm.openDelete(userA)
    expect(wrapper.vm.selectedUser).toEqual(userA)

    wrapper.vm.openDelete(userB)
    expect(wrapper.vm.selectedUser).toEqual(userB)

    await wrapper.vm.$nextTick()
    expect(wrapper.vm.selectedUser).toEqual(userB)
  })

  it('calls show() only after $nextTick so the prop has propagated', async () => {
    const wrapper = makeWrapper()
    const deleteModalShow = jest.fn()
    wrapper.vm.$refs.deleteModal = { show: deleteModalShow }

    wrapper.vm.openDelete({ id: 'u1', username: 'a@b.com', first_name: 'A', last_name: 'B', active: true, orgs: [] })
    expect(deleteModalShow).not.toHaveBeenCalled()
    await wrapper.vm.$nextTick()
    expect(deleteModalShow).toHaveBeenCalledTimes(1)
  })
})

// ─── onActivated / onDeactivated / onUpdated / onFlagsUpdated / onDeleted ────

describe('AdminUsersTab.vue — state update handlers', () => {
  beforeEach(() => jest.clearAllMocks())

  it('onActivated sets active=true for the matching user', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', username: 'a@b.com', active: false, orgs: [] }], 1
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onActivated('u1')
    expect(wrapper.vm.users.find(u => u.id === 'u1').active).toBe(true)
  })

  it('onDeactivated sets active=false for the matching user', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', username: 'a@b.com', active: true, orgs: [] }], 1
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onDeactivated('u1')
    expect(wrapper.vm.users.find(u => u.id === 'u1').active).toBe(false)
  })

  it('onUpdated merges changes into the matching user', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', username: 'old@test.com', first_name: 'Juan', last_name: 'Pérez', active: true }], 1
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onUpdated('u1', { first_name: 'Pedro', username: 'new@test.com' })
    const user = wrapper.vm.users.find(u => u.id === 'u1')
    expect(user.first_name).toBe('Pedro')
    expect(user.username).toBe('new@test.com')
    expect(user.last_name).toBe('Pérez')
  })

  it('onFlagsUpdated merges new flags into the matching user', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', username: 'a@test.com', support: false, superadmin: false, active: true }], 1
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onFlagsUpdated('u1', { support: true, superadmin: false, business_manager: false })
    const user = wrapper.vm.users.find(u => u.id === 'u1')
    expect(user.support).toBe(true)
    expect(user.superadmin).toBe(false)
  })

  it('onDeleted removes the user from the list', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', active: true, orgs: [] }, { id: 'u2', active: true, orgs: [] }], 2
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onDeleted('u1')
    expect(wrapper.vm.users).toHaveLength(1)
    expect(wrapper.vm.users[0].id).toBe('u2')
  })

  it('onDeleted decrements total', async () => {
    Api.get.mockResolvedValueOnce(makeApiResponse(
      [{ id: 'u1', active: true, orgs: [] }], 100
    ))
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.onDeleted('u1')
    expect(wrapper.vm.total).toBe(99)
  })
})

// ─── currentUserId computed ───────────────────────────────────────────────────

describe('AdminUsersTab.vue — currentUserId computed', () => {
  it('returns user id from store', () => {
    const wrapper = makeWrapper({ id: 'my_id' })
    expect(wrapper.vm.currentUserId).toBe('my_id')
  })

  it('returns null when user id is undefined', () => {
    const wrapper = makeWrapper({ id: undefined })
    expect(wrapper.vm.currentUserId).toBeNull()
  })
})
