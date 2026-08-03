import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
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

// ─── el lock de proyecto ya no se adquiere acá ───────────────────────────────
//
// Step 2 writes through the granular endpoints A and C, which are guarded by
// @verify_ref_lock — a decorator that never looks at `project_locks`. Holding the
// project lock did not authorise a single one of those writes, and meanwhile it
// blocked every other collaborator on every generic PATCH of the project ("worst of
// both worlds", docs/respuesta-backend-lock-granular.md). The residual top-level
// fields (name/references/isoqf_id, the list's top-level cerqual) accept LWW.

describe('editList.vue — no adquiere el lock de proyecto', () => {
  beforeEach(() => jest.clearAllMocks())

  it('no llama LockService.acquire al cargar la hoja teniendo permisos de escritura', async () => {
    // getList() ends with a scroll into an element that does not exist in jsdom.
    const originalGetElementsByName = document.getElementsByName
    document.getElementsByName = () => [{ offsetParent: { offsetTop: 0 } }]
    window.scrollTo = jest.fn()
    Api.get.mockResolvedValue({
      data: [{
        id: 'list1', organization: 'org1', project_id: 'proj1',
        // The template reads list.cerqual.option while rendering the progress bar.
        cerqual: { option: null, explanation: '' }
      }]
    })

    const wrapper = shallowMount(editList, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'list1' } },
        $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
      },
      stubs,
      // Downstream loaders are out of scope here; the assertion is about the lock.
      methods: {
        getProject: jest.fn(), syncOrderWithProject: jest.fn(), getAllReferences: jest.fn(),
        getFinding: jest.fn(), getCharsOfStudies: jest.fn(), getMethAssessments: jest.fn(),
        getExtractedData: jest.fn()
      }
    })
    await flushPromises()

    expect(wrapper.vm.checkPermissions('org1')).toBe(true)
    expect(LockService.acquire).not.toHaveBeenCalled()
    wrapper.destroy()
    document.getElementsByName = originalGetElementsByName
  })

  it('no expone attemptLock ni lockInfo', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.vm.attemptLock).toBeUndefined()
    expect(wrapper.vm.lockInfo).toBeUndefined()
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

  it('libera los ref-locks que quedaran abiertos al navegar fuera de la hoja', () => {
    // SPA navigation destroys the view without a pagehide event, so a modal left
    // open (evidence profile, extracted_data row) would leak its ref lock until the
    // server TTL expires it.
    const { wrapper } = createWrapper()
    wrapper.destroy()
    expect(LockService.releaseRef).toHaveBeenCalledWith()
  })

  it('calls LockService.release and removes all window event listeners', () => {
    const { wrapper } = createWrapper()
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.destroy()
    expect(LockService.release).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('lock-lost', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('lock-idle', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('axios-refresh-lock', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('permission-denied', expect.any(Function))
    removeSpy.mockRestore()
  })
})

// ─── refreshPermissions ──────────────────────────────────────────────────────

describe('editList.vue — refreshPermissions()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('registers itself as the permission-denied listener on mount', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const { wrapper } = createWrapper()
    expect(addSpy).toHaveBeenCalledWith('permission-denied', wrapper.vm.refreshPermissions)
    addSpy.mockRestore()
    wrapper.destroy()
  })

  it('does nothing when project.id is not set yet', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: {} })
    await wrapper.vm.refreshPermissions()
    expect(Api.get).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('downgrade: drops mode to view and shows a toast when the user loses can_write while editing', async () => {
    const { wrapper, bvToastToast } = createWrapper()
    await wrapper.setData({
      project: { id: 'proj1', organization: 'org1', can_write: [42], can_read: [] },
      list: { organization: 'other_org' },
      mode: 'edit'
    })
    Api.get.mockResolvedValueOnce({ data: { can_write: [], can_read: [42] } })

    await wrapper.vm.refreshPermissions()

    expect(wrapper.vm.project.can_write).toEqual([])
    expect(wrapper.vm.mode).toBe('view')
    expect(bvToastToast).toHaveBeenCalledWith('lock.permissions_revoked', expect.objectContaining({
      title: 'notifications.error'
    }))
    wrapper.destroy()
  })

  it('upgrade: switches mode to edit and shows a toast when the user gains can_write', async () => {
    const { wrapper, bvToastToast } = createWrapper()
    await wrapper.setData({
      project: { id: 'proj1', organization: 'org1', can_write: [], can_read: [42] },
      list: { organization: 'other_org' },
      mode: 'view'
    })
    Api.get.mockResolvedValueOnce({ data: { can_write: [42], can_read: [42] } })

    await wrapper.vm.refreshPermissions()

    expect(wrapper.vm.mode).toBe('edit')
    expect(bvToastToast).toHaveBeenCalledWith('lock.permissions_granted', expect.objectContaining({
      title: 'notifications.success'
    }))
    wrapper.destroy()
  })

  it('no change: does not touch mode or show a toast', async () => {
    const { wrapper, bvToastToast } = createWrapper()
    await wrapper.setData({
      project: { id: 'proj1', organization: 'org1', can_write: [42], can_read: [] },
      list: { organization: 'other_org' },
      mode: 'edit'
    })
    Api.get.mockResolvedValueOnce({ data: { can_write: [42], can_read: [] } })

    await wrapper.vm.refreshPermissions()

    expect(wrapper.vm.mode).toBe('edit')
    expect(bvToastToast).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('re-fetches permissions when the permission-denied window event fires', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    await wrapper.setData({
      list: { organization: 'other_org' },
      project: { id: 'proj1', organization: 'org1', can_write: [42], can_read: [] }
    })
    Api.get.mockClear()
    Api.get.mockResolvedValueOnce({ data: { can_write: [42], can_read: [] } })

    window.dispatchEvent(new CustomEvent('permission-denied', { detail: { url: '/isoqf_findings/f1', method: 'patch' } }))
    await flushPromises()

    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/proj1', expect.any(Object))
    wrapper.destroy()
  })

  it('fails silently when the request errors', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1', organization: 'org1', can_write: [42], can_read: [] }, mode: 'edit' })
    Api.get.mockRejectedValueOnce(new Error('network error'))

    await expect(wrapper.vm.refreshPermissions()).resolves.not.toThrow()
    expect(wrapper.vm.mode).toBe('edit')
    wrapper.destroy()
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
