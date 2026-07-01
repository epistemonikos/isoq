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
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [] },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
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
})
