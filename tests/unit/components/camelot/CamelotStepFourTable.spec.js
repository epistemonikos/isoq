import { shallowMount, createLocalVue } from '@vue/test-utils'
import CamelotStepFourTable from '@/components/camelot/CamelotStepFourTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const makeItem = ({ s0 = [null, null, null, null], s1 = [null, null, null, null], s2 = [null], s3 = [null] } = {}) => ({
  ref_id: 'ref1',
  authors: 'Author 2024',
  stages: [
    { options: s0.map(o => ({ option: o, text: '' })) },
    { options: s1.map(o => ({ option: o, text: '' })) },
    { options: s2.map(o => ({ option: o, text: '' })) },
    { options: s3.map(o => ({ option: o, text: '' })) }
  ]
})

describe('CamelotStepFourTable.vue', () => {
  let wrapper
  const propsData = {
    fields: [
      { key: 'authors', label: 'Fit assessments' },
      { key: 'fa1', label: 'FA 1' }
    ],
    items: [makeItem({ s0: ['A', null, null, null] })],
    responses: [
      { text: 'No concerns', value: 'A', color: '#1065AB' }
    ]
  }

  beforeEach(() => {
    wrapper = shallowMount(CamelotStepFourTable, {
      localVue,
      propsData,
      mocks: {
        $t: (msg) => msg
      },
      stubs: {
        'font-awesome-icon': true
      }
    })
  })

  it('renders b-table', () => {
    expect(wrapper.find('b-table-stub').exists()).toBe(true)
  })

  it('calculates circle class correctly', () => {
    const item = propsData.items[0]
    expect(wrapper.vm.getCircleClass(0, 0, item)).toBe('circle-filled')
    expect(wrapper.vm.getCircleClass(0, 1, item)).toBe('circle-not-completed')
  })

  it('calculates circle style correctly', () => {
    const item = propsData.items[0]
    expect(wrapper.vm.getCircleStyle(0, 0, item)).toEqual({
      backgroundColor: '#1065AB'
    })
  })

  it('emits open-modal event', () => {
    wrapper.vm.openModal(0, { index: 0, item: propsData.items[0] }, 1)
    expect(wrapper.emitted('open-modal')).toBeTruthy()
    expect(wrapper.emitted('open-modal')[0][0]).toEqual({
      stage: 0,
      data: { index: 0, item: propsData.items[0] },
      tab: 1,
      faLabel: null
    })
  })

  describe('isGroupComplete', () => {
    it('returns false when item has no stages', () => {
      expect(wrapper.vm.isGroupComplete(0, 4, {})).toBe(false)
    })

    it('returns false when group is partially complete (FA1-FA4)', () => {
      const item = makeItem({ s0: ['A', 'B', null, null] })
      expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(false)
    })

    it('returns true when all 4 options are set (FA1-FA4)', () => {
      const item = makeItem({ s0: ['A', 'B', 'C', 'D'] })
      expect(wrapper.vm.isGroupComplete(0, 4, item)).toBe(true)
    })

    it('returns false when group is partially complete (FA5-FA8)', () => {
      const item = makeItem({ s1: ['A', null, 'C', null] })
      expect(wrapper.vm.isGroupComplete(1, 4, item)).toBe(false)
    })

    it('returns true when all 4 options are set (FA5-FA8)', () => {
      const item = makeItem({ s1: ['A', 'B', 'C', 'E'] })
      expect(wrapper.vm.isGroupComplete(1, 4, item)).toBe(true)
    })

    it('returns false when FA9 is not set', () => {
      const item = makeItem({ s2: [null] })
      expect(wrapper.vm.isGroupComplete(2, 1, item)).toBe(false)
    })

    it('returns true when FA9 is set', () => {
      const item = makeItem({ s2: ['B'] })
      expect(wrapper.vm.isGroupComplete(2, 1, item)).toBe(true)
    })

    it('returns false when OA is not set', () => {
      const item = makeItem({ s3: [null] })
      expect(wrapper.vm.isGroupComplete(3, 1, item)).toBe(false)
    })

    it('returns true when OA is set', () => {
      const item = makeItem({ s3: ['A'] })
      expect(wrapper.vm.isGroupComplete(3, 1, item)).toBe(true)
    })
  })
})
