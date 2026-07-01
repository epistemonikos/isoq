import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
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
jest.mock('@/mixins/camelotMixin', () => ({ camelotMixin: { computed: {}, methods: {}, data: () => ({}) } }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper (references = []) {
  return shallowMount(StepThree, {
    localVue,
    propsData: {
      references,
      type: 'isoqf_characteristics'
    },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    }
  })
}

describe('StepThree.vue — isRefLocked()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retorna true cuando ref_id está en activeRefLocks', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    expect(wrapper.vm.isRefLocked('ref2')).toBe(false)
    wrapper.destroy()
  })

  it('refLockedByName retorna el nombre del usuario que tiene el lock', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana López' }] })
    expect(wrapper.vm.refLockedByName('ref1')).toContain('Ana López')
    wrapper.destroy()
  })

  it('fetchAndUpdateRefLocks llama LockService.fetchRefLocks con el projectId', async () => {
    LockService.fetchRefLocks.mockResolvedValue([{ ref_id: 'ref1', user_name: 'Ana' }])
    const wrapper = createWrapper()
    await wrapper.vm.fetchAndUpdateRefLocks()
    await flushPromises()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    expect(wrapper.vm.activeRefLocks).toEqual([{ ref_id: 'ref1', user_name: 'Ana' }])
    wrapper.destroy()
  })
})
