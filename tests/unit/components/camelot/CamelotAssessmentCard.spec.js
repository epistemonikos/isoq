import { mount, createLocalVue } from '@vue/test-utils'
import CamelotAssessmentCard from '@/components/camelot/CamelotAssessmentCard.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('CamelotAssessmentCard.vue', () => {
  let wrapper
  const propsData = {
    metaIndex: 1,
    itemIndex: 0,
    label: 'Strategy',
    extractedData: 'Existing data',
    concerns: 'Existing concerns',
    isExclamationActive: false,
    editingField: { metaIndex: null, itemIndex: null, type: null },
    isSaving: false
  }

  beforeEach(() => {
    wrapper = mount(CamelotAssessmentCard, {
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

  it('renders correctly in view mode', () => {
    expect(wrapper.find('.item-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Strategy')
    expect(wrapper.text()).toContain('Existing data')
    expect(wrapper.text()).toContain('Existing concerns')
  })

  it('emits start-editing when edit button is clicked', async () => {
    const editButtons = wrapper.findAll('.edit-btn-thin')
    await editButtons.at(0).trigger('click') // Extracted data edit
    
    expect(wrapper.emitted('start-editing')).toBeTruthy()
    expect(wrapper.emitted('start-editing')[0][0]).toEqual({
      metaIndex: 1,
      itemIndex: 0,
      type: 'extractedData'
    })
  })

  it('shows textarea when in editing mode', async () => {
    await wrapper.setProps({
      editingField: { metaIndex: 1, itemIndex: 0, type: 'extractedData' }
    })
    
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.vm.editValue).toBe('Existing data')
  })

  it('emits save-field with new value when save button is clicked', async () => {
    await wrapper.setProps({
      editingField: { metaIndex: 1, itemIndex: 0, type: 'extractedData' }
    })
    
    await wrapper.setData({ editValue: 'Updated data' })
    // Find the save button (primary variant)
    const saveButton = wrapper.findAll('button').filter(b => b.text().includes('common.save')).at(0)
    await saveButton.trigger('click')
    
    expect(wrapper.emitted('save-field')).toBeTruthy()
    expect(wrapper.emitted('save-field')[0][0]).toBe('Updated data')
  })
})
