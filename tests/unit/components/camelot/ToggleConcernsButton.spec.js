import { shallowMount } from '@vue/test-utils'
import ToggleConcernsButton from '@/components/camelot/ToggleConcernsButton.vue'

const $t = (key) => key

describe('ToggleConcernsButton.vue', () => {
  let wrapper
  const mockCamelot = {
    categories: [
      {
        key: 'cat1',
        options: [
          { key: 'cat1_extractedData' },
          { key: 'cat1_concerns' }
        ]
      }
    ]
  }
  const mockVisibleKeys = ['cat1_extractedData']

  beforeEach(() => {
    wrapper = shallowMount(ToggleConcernsButton, {
      propsData: {
        value: false,
        hasVisibleCamelotFields: true,
        visibleColumnKeys: mockVisibleKeys,
        camelot: mockCamelot
      },
      mocks: {
        $t
      },
      stubs: {
        'b-button': true
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('emits input and update:visibleColumnKeys when toggled ON', async () => {
    wrapper.vm.toggleConcerns()
    
    expect(wrapper.emitted('input')).toBeTruthy()
    expect(wrapper.emitted('input')[0]).toEqual([true])
    
    expect(wrapper.emitted('update:visibleColumnKeys')).toBeTruthy()
    expect(wrapper.emitted('update:visibleColumnKeys')[0][0]).toContain('cat1_concerns')
  })

  it('removes concern keys when toggled OFF', async () => {
    await wrapper.setProps({
      value: true,
      visibleColumnKeys: ['cat1_extractedData', 'cat1_concerns']
    })
    
    wrapper.vm.toggleConcerns()
    
    expect(wrapper.emitted('input')[0]).toEqual([false])
    expect(wrapper.emitted('update:visibleColumnKeys')[0][0]).not.toContain('cat1_concerns')
  })
})
