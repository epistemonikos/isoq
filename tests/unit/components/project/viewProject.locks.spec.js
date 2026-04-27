import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

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

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify
    },
    stubs
  })
  // BootstrapVue installs $bvModal and $bvToast via beforeCreate, overwriting mocks.
  // Spy on the real instances after mount instead.
  const bvModalShow = jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  const bvToastToast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, $notify, bvModalShow, bvToastToast }
}

describe('viewProject.vue — attemptLock()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets lockInfo.locked=true and lockedBy=null on success', async () => {
    LockService.acquire.mockResolvedValue({ success: true })
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' } })
    await wrapper.vm.attemptLock()
    expect(wrapper.vm.lockInfo.locked).toBe(true)
    expect(wrapper.vm.lockInfo.lockedBy).toBeNull()
    wrapper.destroy()
  })

  it('sets locked=false, lockedBy, mode=view and shows toast when project is locked by another user', async () => {
    LockService.acquire.mockResolvedValue({ success: false, lockedBy: 'otro@example.com' })
    const { wrapper, bvToastToast } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' } })
    await wrapper.vm.attemptLock()
    expect(wrapper.vm.lockInfo.locked).toBe(false)
    expect(wrapper.vm.lockInfo.lockedBy).toBe('otro@example.com')
    expect(wrapper.vm.mode).toBe('view')
    expect(bvToastToast).toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('viewProject.vue — handleLockLost()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets mode=view and shows modal-lock-lost when projectId matches', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ detail: { projectId: 'proj1' } })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-lost')
    wrapper.destroy()
  })

  it('does nothing when projectId does not match', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ detail: { projectId: 'other-proj' } })
    expect(wrapper.vm.mode).toBe('edit')
    expect(bvModalShow).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('sets mode=view when event.type is "axios-refresh-lock" regardless of projectId', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleLockLost({ type: 'axios-refresh-lock', detail: null })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-lost')
    wrapper.destroy()
  })
})

describe('viewProject.vue — handleIdle()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets mode=view and shows modal-lock-idle when projectId matches', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleIdle({ detail: { projectId: 'proj1' } })
    expect(wrapper.vm.mode).toBe('view')
    expect(bvModalShow).toHaveBeenCalledWith('modal-lock-idle')
    wrapper.destroy()
  })

  it('does nothing when projectId does not match', async () => {
    const { wrapper, bvModalShow } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1' }, mode: 'edit' })
    wrapper.vm.handleIdle({ detail: { projectId: 'other-proj' } })
    expect(wrapper.vm.mode).toBe('edit')
    expect(bvModalShow).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('viewProject.vue — beforeDestroy', () => {
  beforeEach(() => jest.clearAllMocks())

  it('releases the lock and removes all three window event listeners', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.destroy()
    expect(LockService.release).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('lock-lost', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('lock-idle', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('axios-refresh-lock', expect.any(Function))
    removeSpy.mockRestore()
  })
})
