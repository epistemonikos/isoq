import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
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
  fetchRefLocks: jest.fn().mockResolvedValue([]),
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

// Granular ref-level locking (Step 3/4) replaced the project-wide lock here: this
// view never acquires one, so attemptLock() and everything downstream of it
// (lockInfo -> isLockedByOther -> the :isLocked prop actionButtons never declared)
// was wiring that could not fire. The project lock itself was later retired
// everywhere (2026-10-01): see lockService.noProjectLock.spec.js.
describe('viewProject.vue — el cableado muerto del lock de proyecto no vuelve', () => {
  beforeEach(() => jest.clearAllMocks())

  it('no expone attemptLock(): esta vista no adquiere el lock de proyecto', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.vm.attemptLock).toBeUndefined()
    wrapper.destroy()
  })

  it('no expone lockInfo ni isLockedByOther (nadie podía escribirlos)', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.vm.lockInfo).toBeUndefined()
    expect(wrapper.vm.isLockedByOther).toBeUndefined()
    expect(wrapper.vm.lockDataRecovery).toBeUndefined()
    wrapper.destroy()
  })
})

describe('viewProject.vue — beforeDestroy', () => {
  beforeEach(() => jest.clearAllMocks())

  // Verified live: a lock taken in the Step 3/4 table survived navigating out of the
  // project and stayed held under the user's name until the server TTV expired it.
  // editList.vue already had this net; this view (which hosts crudTables) did not.
  it('libera los ref-locks que queden abiertos al salir del proyecto', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    wrapper.destroy()
    expect(LockService.releaseRef).toHaveBeenCalledWith()
  })

  it('quita el listener de permission-denied y ya no escucha los eventos del lock de proyecto (retirado)', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    wrapper.destroy()
    expect(removeSpy).toHaveBeenCalledWith('permission-denied', expect.any(Function))
    const removed = removeSpy.mock.calls.map(c => c[0])
    expect(removed).not.toContain('lock-lost')
    expect(removed).not.toContain('lock-idle')
    expect(removed).not.toContain('axios-refresh-lock')
    removeSpy.mockRestore()
  })
})

describe('viewProject.vue — permission-denied event', () => {
  beforeEach(() => jest.clearAllMocks())

  it('registers refreshPermissions as the permission-denied listener on mount', async () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const { wrapper } = createWrapper()
    await flushPromises()

    expect(addSpy).toHaveBeenCalledWith('permission-denied', wrapper.vm.refreshPermissions)
    addSpy.mockRestore()
    wrapper.destroy()
  })

  it('re-fetches permissions when the event fires (Api.get is called)', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    Api.get.mockClear()

    window.dispatchEvent(new CustomEvent('permission-denied', { detail: { url: '/isoqf_findings/f1', method: 'patch' } }))
    await flushPromises()

    expect(Api.get).toHaveBeenCalledWith(`/isoqf_projects/${wrapper.vm.$route.params.id}`, expect.any(Object))
    wrapper.destroy()
  })
})
