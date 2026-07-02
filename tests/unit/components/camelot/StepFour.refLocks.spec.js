import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper (overrideProps = {}) {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true, ...overrideProps },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    }
  })
}

describe('StepFour.vue — isRefLocked()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retorna true cuando ref_id está en activeRefLocks', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    expect(wrapper.vm.isRefLocked('ref2')).toBe(false)
    wrapper.destroy()
  })

  it('fetchAndUpdateRefLocks actualiza activeRefLocks', async () => {
    LockService.fetchRefLocks.mockResolvedValue([{ ref_id: 'ref1', user_name: 'Ana' }])
    const wrapper = createWrapper()
    await wrapper.vm.fetchAndUpdateRefLocks()
    await flushPromises()
    expect(wrapper.vm.activeRefLocks).toEqual([{ ref_id: 'ref1', user_name: 'Ana' }])
    wrapper.destroy()
  })

  it('re-pollea al recibir el evento window ref-locks-changed', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    LockService.fetchRefLocks.mockClear()
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    await flushPromises()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })
})

describe('StepFour.vue — lock a nivel modal (una adquisición por estudio)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('openModal adquiere el lock del estudio una sola vez con projectId y ref_id', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })

  it('marca isRefReadOnly y notifica cuando el lock devuelve 409', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana López' })
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBe('Ana López')
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.ref_locked_by {"user":"Ana López"}')
    wrapper.destroy()
  })

  it('marca isRefReadOnly SIN nombre de usuario y notifica "permisos revocados" cuando el lock devuelve permissionDenied (403)', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBeNull()
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
    wrapper.destroy()
  })

  it('onAssessmentModalClosed libera el lock, resetea estado y re-pollea', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ isRefReadOnly: true, refLockedBy: 'Ana' })
    LockService.fetchRefLocks.mockClear()
    wrapper.vm.onAssessmentModalClosed()
    await flushPromises()
    expect(LockService.releaseRef).toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    expect(wrapper.vm.refLockedBy).toBeNull()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })
})

describe('StepFour.vue — canEdit gating (read-only user protection)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('acquireStudyLock no llama a LockService.acquireRef cuando canEdit es false', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBeNull()
    wrapper.destroy()
  })

  it('openModal deja el assessment en solo lectura cuando canEdit es false, sin tomar el lock', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    const showSpy = jest.spyOn(wrapper.vm.$bvModal, 'show')
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(showSpy).toHaveBeenCalledWith('modal-1')
    wrapper.destroy()
  })

  it('acquireStudyLock sigue adquiriendo el lock cuando canEdit es true (regresión)', async () => {
    const wrapper = createWrapper({ canEdit: true })
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })
})
