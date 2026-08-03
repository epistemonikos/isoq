import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

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

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper (storeOverrides = {}) {
  const defaultStore = { state: { user: { personal_organization: 'other_org', id: 42 } } }
  return shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { ...defaultStore, ...storeOverrides },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
}

describe('viewProject.vue — checkPermissions()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns true when personal_organization matches org_id (owner)', async () => {
    const wrapper = createWrapper({ state: { user: { personal_organization: 'org1', id: 99 } } })
    await flushPromises()
    expect(wrapper.vm.checkPermissions('can_write')).toBe(true)
    wrapper.destroy()
  })

  it('returns true when user id is in array permission', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ project: { can_write: [42] } })
    expect(wrapper.vm.checkPermissions('can_write')).toBe(true)
    wrapper.destroy()
  })

  it('returns true when user id is in string permission (comma-separated)', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ project: { can_write: '10,42,55' } })
    expect(wrapper.vm.checkPermissions('can_write')).toBe(true)
    wrapper.destroy()
  })

  it('returns false when user id is NOT in permissions', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ project: { can_write: [1, 2, 3] } })
    expect(wrapper.vm.checkPermissions('can_write')).toBe(false)
    wrapper.destroy()
  })

  it('returns false when user.id is undefined (no matching permission)', async () => {
    const wrapper = createWrapper({ state: { user: { personal_organization: 'other_org', id: undefined } } })
    await flushPromises()
    await wrapper.setData({ project: { can_write: [1, 2, 3] } })
    expect(wrapper.vm.checkPermissions('can_write')).toBe(false)
    wrapper.destroy()
  })

  it('returns true with array of types if any permission matches', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ project: { can_read: [42], can_write: [99] } })
    expect(wrapper.vm.checkPermissions(['can_read', 'can_write'])).toBe(true)
    wrapper.destroy()
  })

  it('returns false when project lacks the permission property entirely', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ project: { name: 'test' } })
    expect(wrapper.vm.checkPermissions('can_write')).toBe(false)
    wrapper.destroy()
  })
})

describe('viewProject.vue — effectiveMode (computed)', () => {
  let wrapper

  beforeEach(async () => {
    // owner: personal_organization matches org_id
    wrapper = createWrapper({ state: { user: { personal_organization: 'org1', id: 1 } } })
    await flushPromises()
    jest.clearAllMocks()
  })

  afterEach(() => wrapper.destroy())

  it('returns "edit" when mode is explicitly "edit"', async () => {
    await wrapper.setData({ mode: 'edit' })
    expect(wrapper.vm.effectiveMode).toBe('edit')
  })

  it('returns "view" when mode is explicitly "view"', async () => {
    await wrapper.setData({ mode: 'view' })
    expect(wrapper.vm.effectiveMode).toBe('view')
  })

  it('returns "edit" when mode is empty and user has can_write', async () => {
    await wrapper.setData({ mode: '', project: { can_write: [1] } })
    expect(wrapper.vm.effectiveMode).toBe('edit')
  })

  it('returns "view" when mode is empty and user only has can_read', async () => {
    // use non-owner wrapper with only can_read
    wrapper.destroy()
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ mode: '', project: { can_read: [42] } })
    expect(wrapper.vm.effectiveMode).toBe('view')
  })

  it('returns "" when mode is empty and user has no permissions', async () => {
    wrapper.destroy()
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ mode: '', project: { name: 'test' } })
    expect(wrapper.vm.effectiveMode).toBe('')
  })
})

describe('viewProject.vue — isEditing, canWrite, isLockedByOther (computed)', () => {
  let wrapper

  beforeEach(async () => {
    wrapper = createWrapper({ state: { user: { personal_organization: 'org1', id: 1 } } })
    await flushPromises()
    jest.clearAllMocks()
  })

  afterEach(() => wrapper.destroy())

  it('isEditing is true when effectiveMode is "edit" and canWrite is true', async () => {
    await wrapper.setData({ mode: 'edit' })
    expect(wrapper.vm.isEditing).toBe(true)
  })

  it('isEditing is false when effectiveMode is "view"', async () => {
    await wrapper.setData({ mode: 'view' })
    expect(wrapper.vm.isEditing).toBe(false)
  })

  it('canWrite returns true when user has write permission', async () => {
    expect(wrapper.vm.canWrite).toBe(true) // owner
  })

  // isLockedByOther / lockInfo were removed: this view never acquired the project
  // lock, so nothing could ever set them. Guarded in viewProject.locks.spec.js.
})
