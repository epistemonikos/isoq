
import { mount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock components
localVue.component('font-awesome-icon', { 
  name: 'font-awesome-icon',
  props: ['icon'],
  template: '<i :class="icon"></i>' 
})

describe('evidenceProfileForm.vue - Camelot Warning Display', () => {
  let propsData
  let mocks

  beforeEach(() => {
    propsData = {
      project: { use_camelot: true, review_question: 'Q?', inclusion: 'I', exclusion: 'E' },
      list: { organization: 'org1', project_id: 'p1' },
      modalData: {
        methodological_limitations: { option: null, explanation: '', notes: '' },
        coherence: { option: null, explanation: '', notes: '' },
        adequacy: { option: null, explanation: '', notes: '' },
        relevance: { option: null, explanation: '', notes: '' },
        cerqual: { option: null, explanation: '', notes: '' },
        type: 'adequacy',
        title: 'Adequacy'
      },
      ui: {
        methodological_assessments: {
          display_warning: false,
          extracted_data: { display_warning: false }
        },
        adequacy: {
          chars_of_studies: { display_warning: false },
          extracted_data: { display_warning: false }
        },
        relevance: {
          chars_of_studies: { display_warning: false }
        }
      },
      methAssessments: { fieldsObj: [], items: [] },
      charsOfStudies: { fieldsObj: [], items: [] },
      extractedData: { items: [], fieldsObj: [] },
      findings: {},
      evidenceProfile: [{
        methodological_limitations: { option: '0' },
        coherence: { option: '0' },
        adequacy: { option: '0' },
        relevance: { option: '0' }
      }],
      refsWithTitle: [],
      permission: true,
      selectOptions: [],
      show: { selected: [] },
      modePrintFieldObject: []
    }
    mocks = {
      $t: (key) => key,
      $route: { params: { id: '1' } }
    }
  })

  const createWrapper = async () => {
    const wrapper = mount(evidenceProfileForm, {
      localVue,
      propsData,
      mocks,
      stubs: {
        'b-modal': { template: '<div><slot name="modal-title"></slot><slot></slot></div>' },
        'b-tabs': { template: '<div><slot></slot></div>' },
        'b-tab': { template: '<div><slot name="title"></slot><slot></slot></div>' },
        'b-container': { template: '<div><slot></slot></div>' },
        'b-row': { template: '<div><slot></slot></div>' },
        'b-col': { template: '<div><slot></slot></div>' },
        'videoHelp': true,
        'edit-review-finding': true,
        'assessment-table': true,
        'table-extracted-data': true,
        'camelot-characteristics-table': { 
          name: 'camelot-characteristics-table',
          template: '<div class="camelot-table-mock"></div>' 
        }
      }
    })
    await wrapper.setData({
      selectedOptions: JSON.parse(JSON.stringify(propsData.modalData))
    })
    return wrapper
  }

  it('should render camelot-characteristics-table in Adequacy tab when use_camelot is true', async () => {
    propsData.project.use_camelot = true
    propsData.modalData.type = 'adequacy'
    const wrapper = await createWrapper()
    expect(wrapper.find('.camelot-table-mock').exists()).toBe(true)
  })

  it('should render camelot-characteristics-table in Relevance tab when use_camelot is true', async () => {
    propsData.project.use_camelot = true
    propsData.modalData.type = 'relevance'
    const wrapper = await createWrapper()
    expect(wrapper.find('.camelot-table-mock').exists()).toBe(true)
  })
})
