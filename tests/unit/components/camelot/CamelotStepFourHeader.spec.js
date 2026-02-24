import { mount, createLocalVue } from '@vue/test-utils'
import CamelotStepFourHeader from '@/components/camelot/CamelotStepFourHeader.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('CamelotStepFourHeader.vue', () => {
  let wrapper
  const propsData = {
    responses: [
      { text: 'No concerns', value: 'A', color: '#1065AB' }
    ]
  }

  beforeEach(() => {
    wrapper = mount(CamelotStepFourHeader, {
      localVue,
      propsData,
      mocks: {
        $t: (msg) => msg
      },
      stubs: {
        'font-awesome-icon': true,
        'b-sidebar': true
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('.help-link').exists()).toBe(true)
    expect(wrapper.find('.legend-dropdown').exists()).toBe(true)
  })

  it('toggles showLegend when dropdown events occur', async () => {
    expect(wrapper.vm.showLegend).toBe(false)
    // Find the dropdown component and emit events
    const dropdown = wrapper.findComponent({ name: 'BDropdown' })
    await dropdown.vm.$emit('show')
    expect(wrapper.vm.showLegend).toBe(true)
    await dropdown.vm.$emit('hide')
    expect(wrapper.vm.showLegend).toBe(false)
  })
})
