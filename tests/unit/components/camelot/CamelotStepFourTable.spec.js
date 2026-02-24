import { shallowMount, createLocalVue } from '@vue/test-utils'
import CamelotStepFourTable from '@/components/camelot/CamelotStepFourTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('CamelotStepFourTable.vue', () => {
  let wrapper
  const propsData = {
    fields: [
      { key: 'authors', label: 'Fit assessments' },
      { key: 'fa1', label: 'FA 1' }
    ],
    items: [
      {
        ref_id: 'ref1',
        authors: 'Author 2024',
        stages: [
          {
            options: [{ option: 'A', text: 'Text A' }]
          }
        ]
      }
    ],
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
      tab: 1
    })
  })
})
