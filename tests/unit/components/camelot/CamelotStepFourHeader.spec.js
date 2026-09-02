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
    ],
    exportFields: [{ key: 'authors', label: 'Authors' }],
    exportItems: [{ authors: 'Author 2024' }]
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
        'b-sidebar': true,
        'ExportCSVButton': true
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.find('.help-link').exists()).toBe(true)
    expect(wrapper.find('.legend-dropdown').exists()).toBe(true)
    expect(wrapper.find('exportcsvbutton-stub').exists() || wrapper.find('export-c-s-v-button-stub').exists()).toBe(true)
  })

  it('aligns all buttons to the right with justify-content-end', () => {
    const container = wrapper.find('.d-flex')
    expect(container.classes()).toContain('justify-content-end')
    expect(container.classes()).toContain('align-items-end')
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
