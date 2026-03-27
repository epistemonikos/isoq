
import { mount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock components
localVue.component('font-awesome-icon', { 
  name: 'font-awesome-icon',
  props: ['icon'],
  template: '<i :class="icon" :data-icon="icon"></i>' 
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
        'b-modal': { template: '<div class="modal-stub"><slot name="modal-title"></slot><slot></slot></div>' },
        'b-tabs': { template: '<div class="tabs-stub"><slot></slot></div>' },
        'b-tab': { 
            props: ['active', 'title'],
            template: '<div class="tab-stub"><div class="tab-title-slot">{{title}}<slot name="title"></slot></div><div class="tab-content-slot"><slot></slot></div></div>' 
        },
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
        },
        'font-awesome-icon': {
            props: ['icon'],
            template: '<i class="text-danger" :data-icon="icon"></i>'
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

  describe('Relevance Warning Display', () => {
    beforeEach(() => {
        propsData.modalData.type = 'relevance'
        propsData.project.review_question = 'Question'
        propsData.project.inclusion = 'Inclusion'
        propsData.project.exclusion = 'Exclusion'
    })

    it('DOES NOT show exclamation mark in "Question and criteria" tab title when chars_of_studies has warning but fields are filled', async () => {
        propsData.ui.relevance.chars_of_studies.display_warning = true
        const wrapper = await createWrapper()
        
        const tabs = wrapper.findAll('.tab-stub')
        const firstTab = tabs.at(0)
        
        expect(firstTab.find('.tab-title-slot').text()).toContain('worksheet.titles.question_criteria')
        expect(firstTab.find('.tab-title-slot').find('.text-danger').exists()).toBe(false)
    })

    it('shows exclamation mark in "Question and criteria" tab title if review_question is missing', async () => {
        propsData.project.review_question = ''
        const wrapper = await createWrapper()
        
        const tabs = wrapper.findAll('.tab-stub')
        const firstTab = tabs.at(0)
        
        expect(firstTab.find('.tab-title-slot').text()).toContain('worksheet.titles.question_criteria')
        expect(firstTab.find('.tab-title-slot').find('.text-danger').exists()).toBe(true)
    })

    it('correctly uses ui.relevance.chars_of_studies.display_warning in the title of the second tab of Relevance', async () => {
        propsData.ui.relevance.chars_of_studies.display_warning = true
        propsData.ui.adequacy.chars_of_studies.display_warning = false
        const wrapper = await createWrapper()
        
        const tabs = wrapper.findAll('.tab-stub')
        const secondTab = tabs.at(1)
        
        expect(secondTab.find('.tab-title-slot').text()).toContain('worksheet.characteristics_of_studies')
        // It should now have the icon in the title because it uses ui.relevance
        expect(secondTab.find('.tab-title-slot').find('.text-danger').exists()).toBe(true)
        
        // Now set relevance warning to false
        propsData.ui.relevance.chars_of_studies.display_warning = false
        propsData.ui.adequacy.chars_of_studies.display_warning = true
        const wrapper2 = await createWrapper()
        const secondTab2 = wrapper2.findAll('.tab-stub').at(1)
        expect(secondTab2.find('.tab-title-slot').find('.text-danger').exists()).toBe(false)
    })
  })
})
