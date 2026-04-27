import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

function createWrapper () {
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
  const bvModalShow = jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  const bvToastToast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, bvModalShow, bvToastToast }
}

// ─── checkPermissions ────────────────────────────────────────────────────────

describe('editList.vue — checkPermissions()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true when personal_organization matches organizationId', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.vm.checkPermissions('org1')).toBe(true)
    wrapper.destroy()
  })

  it('returns true when user.id is in project[type] array', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { can_write: [42] } })
    expect(wrapper.vm.checkPermissions('other_org')).toBe(true)
    wrapper.destroy()
  })

  it('returns false when user.id is NOT in project[type] array', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { can_write: [1, 2, 3] } })
    expect(wrapper.vm.checkPermissions('other_org')).toBe(false)
    wrapper.destroy()
  })

  it('returns false when project does not have the type property', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { name: 'Test' } })
    expect(wrapper.vm.checkPermissions('other_org')).toBe(false)
    wrapper.destroy()
  })

  it('uses "can_write" as the default type', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { can_write: [42], can_read: [99] } })
    expect(wrapper.vm.checkPermissions('other_org')).toBe(true)
    expect(wrapper.vm.checkPermissions('other_org', 'can_read')).toBe(false)
    wrapper.destroy()
  })
})

// ─── attemptLock ─────────────────────────────────────────────────────────────

describe('editList.vue — attemptLock()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets lockInfo.locked=true when acquire succeeds', async () => {
    LockService.acquire.mockResolvedValue({ success: true })
    const { wrapper } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' } })
    await wrapper.vm.attemptLock()
    expect(wrapper.vm.lockInfo.locked).toBe(true)
    expect(wrapper.vm.lockInfo.lockedBy).toBeNull()
    wrapper.destroy()
  })

  it('sets locked=false, lockedBy and mode=view when project is locked by another user', async () => {
    LockService.acquire.mockResolvedValue({ success: false, lockedBy: 'otro@example.com' })
    const { wrapper, bvToastToast } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' } })
    await wrapper.vm.attemptLock()
    expect(wrapper.vm.lockInfo.locked).toBe(false)
    expect(wrapper.vm.lockInfo.lockedBy).toBe('otro@example.com')
    expect(wrapper.vm.mode).toBe('view')
    expect(bvToastToast).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('does nothing when list.project_id is falsy', async () => {
    LockService.acquire.mockResolvedValue({ success: true })
    const { wrapper } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: null } })
    await wrapper.vm.attemptLock()
    expect(LockService.acquire).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

// ─── handleLockLost ──────────────────────────────────────────────────────────

describe('editList.vue — handleLockLost()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets mode=view and shows modal-lock-lost-sheet when projectId matches', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ detail: { projectId: 'proj1' } })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-lost-sheet')
    wrapper.destroy()
  })

  it('does nothing when projectId does not match', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ detail: { projectId: 'other-proj' } })
    expect(wrapper.vm.mode).toBe('edit')
    expect(bvModalShow).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('sets mode=view when event.type is "axios-refresh-lock"', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ type: 'axios-refresh-lock', detail: null })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-lost-sheet')
    wrapper.destroy()
  })
})

// ─── handleIdle ──────────────────────────────────────────────────────────────

describe('editList.vue — handleIdle()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets mode=view and shows modal-lock-idle-sheet when projectId matches', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleIdle({ detail: { projectId: 'proj1' } })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-idle-sheet')
    wrapper.destroy()
  })

  it('does nothing when projectId does not match', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ list: { ...wrapper.vm.list, project_id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleIdle({ detail: { projectId: 'other-proj' } })
    expect(wrapper.vm.mode).toBe('edit')
    expect(bvModalShow).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

// ─── beforeDestroy ───────────────────────────────────────────────────────────

describe('editList.vue — beforeDestroy', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls LockService.release and removes all window event listeners', () => {
    const { wrapper } = createWrapper()
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.destroy()
    expect(LockService.release).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('lock-lost', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('lock-idle', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('axios-refresh-lock', expect.any(Function))
    removeSpy.mockRestore()
  })
})

// ─── changeMode ──────────────────────────────────────────────────────────────

describe('editList.vue — changeMode()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('switches from "edit" to "view"', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ mode: 'edit' })
    wrapper.vm.changeMode()
    expect(wrapper.vm.mode).toBe('view')
    wrapper.destroy()
  })

  it('switches from "view" to "edit"', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ mode: 'view' })
    wrapper.vm.changeMode()
    expect(wrapper.vm.mode).toBe('edit')
    wrapper.destroy()
  })
})
