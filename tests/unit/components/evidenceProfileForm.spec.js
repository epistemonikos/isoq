
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

const basePropsData = {
  project: { use_camelot: true, review_question: 'Q?', inclusion: 'I', exclusion: 'E' },
  list: { organization: 'org1', project_id: 'p1' },
  modalData: {
    methodological_limitations: { option: null, explanation: '', notes: '' },
    coherence: { option: null, explanation: '', notes: '' },
    adequacy: { option: null, explanation: '', notes: '' },
    relevance: { option: null, explanation: '', notes: '' },
    cerqual: { option: null, explanation: '', notes: '' },
    type: 'adequacy',
    title: 'Test'
  },
  ui: {
    methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } },
    adequacy: { chars_of_studies: { display_warning: false }, extracted_data: { display_warning: false } },
    relevance: { chars_of_studies: { display_warning: false } }
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
  selectOptions: [
    { text: 'No or very minor concerns' },
    { text: 'Minor concerns' },
    { text: 'Moderate concerns' },
    { text: 'Serious concerns' }
  ],
  show: { selected: [] },
  modePrintFieldObject: []
}

const baseMocks = {
  $t: (key) => key,
  $route: { params: { id: '1' } }
}

const baseStubs = {
  'b-modal': { template: '<div class="modal-stub"><slot></slot></div>' },
  'b-tabs': { template: '<div><slot></slot></div>' },
  'b-tab': { props: ['active', 'title'], template: '<div><slot></slot></div>' },
  'b-container': { template: '<div><slot></slot></div>' },
  'b-row': { template: '<div><slot></slot></div>' },
  'b-col': { template: '<div><slot></slot></div>' },
  'videoHelp': true,
  'edit-review-finding': true,
  'assessment-table': true,
  'table-extracted-data': true,
  'camelot-characteristics-table': { template: '<div></div>' }
}

async function makeWrapper () {
  const wrapper = mount(evidenceProfileForm, {
    localVue,
    propsData: JSON.parse(JSON.stringify(basePropsData)),
    mocks: baseMocks,
    stubs: baseStubs
  })
  await wrapper.setData({ selectedOptions: JSON.parse(JSON.stringify(basePropsData.modalData)) })
  return wrapper
}

describe('evidenceProfileForm.vue - explanationStateFor', () => {
  let wrapper

  beforeEach(async () => { wrapper = await makeWrapper() })
  afterEach(() => { wrapper.destroy() })

  it('returns null when option is null', () => {
    wrapper.vm.selectedOptions.methodological_limitations.option = null
    expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBeNull()
  })

  it('returns null when option is "0" (No/Very minor concerns)', () => {
    wrapper.vm.selectedOptions.methodological_limitations.option = '0'
    expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBeNull()
  })

  it('returns false when option > 0 and explanation is empty', () => {
    wrapper.vm.selectedOptions.coherence.option = '1'
    wrapper.vm.selectedOptions.coherence.explanation = ''
    expect(wrapper.vm.explanationStateFor('coherence')).toBe(false)
  })

  it('returns false when option > 0 and explanation is only whitespace', () => {
    wrapper.vm.selectedOptions.adequacy.option = '2'
    wrapper.vm.selectedOptions.adequacy.explanation = '   '
    expect(wrapper.vm.explanationStateFor('adequacy')).toBe(false)
  })

  it('returns true when option > 0 and explanation has content', () => {
    wrapper.vm.selectedOptions.relevance.option = '3'
    wrapper.vm.selectedOptions.relevance.explanation = 'Some explanation'
    expect(wrapper.vm.explanationStateFor('relevance')).toBe(true)
  })

  it('applies the same logic to cerqual domain', () => {
    wrapper.vm.selectedOptions.cerqual.option = '0'
    expect(wrapper.vm.explanationStateFor('cerqual')).toBeNull()

    wrapper.vm.selectedOptions.cerqual.option = '1'
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    expect(wrapper.vm.explanationStateFor('cerqual')).toBe(false)

    wrapper.vm.selectedOptions.cerqual.explanation = 'Explanation'
    expect(wrapper.vm.explanationStateFor('cerqual')).toBe(true)
  })
})

describe('evidenceProfileForm.vue - checkValidationExplanationText', () => {
  let wrapper

  beforeEach(async () => { wrapper = await makeWrapper() })
  afterEach(() => { wrapper.destroy() })

  it('returns false when type is empty', () => {
    expect(wrapper.vm.checkValidationExplanationText('', wrapper.vm.selectedOptions)).toBe(false)
  })

  it('returns false when option is null', () => {
    wrapper.vm.selectedOptions.coherence.option = null
    expect(wrapper.vm.checkValidationExplanationText('coherence', wrapper.vm.selectedOptions)).toBe(false)
  })

  it('returns false when option is "0" (no explanation required)', () => {
    wrapper.vm.selectedOptions.methodological_limitations.option = '0'
    wrapper.vm.selectedOptions.methodological_limitations.explanation = ''
    expect(wrapper.vm.checkValidationExplanationText('methodological-limitations', wrapper.vm.selectedOptions)).toBe(false)
  })

  it('returns true when option > 0 and explanation is empty', () => {
    wrapper.vm.selectedOptions.adequacy.option = '2'
    wrapper.vm.selectedOptions.adequacy.explanation = ''
    expect(wrapper.vm.checkValidationExplanationText('adequacy', wrapper.vm.selectedOptions)).toBe(true)
  })

  it('returns true when option > 0 and explanation is only whitespace', () => {
    wrapper.vm.selectedOptions.relevance.option = '1'
    wrapper.vm.selectedOptions.relevance.explanation = '   '
    expect(wrapper.vm.checkValidationExplanationText('relevance', wrapper.vm.selectedOptions)).toBe(true)
  })

  it('returns false when option > 0 and explanation has content', () => {
    wrapper.vm.selectedOptions.cerqual.option = '3'
    wrapper.vm.selectedOptions.cerqual.explanation = 'Full explanation'
    expect(wrapper.vm.checkValidationExplanationText('cerqual', wrapper.vm.selectedOptions)).toBe(false)
  })

  it('converts hyphenated type to underscore domain name', () => {
    wrapper.vm.selectedOptions.methodological_limitations.option = '1'
    wrapper.vm.selectedOptions.methodological_limitations.explanation = ''
    expect(wrapper.vm.checkValidationExplanationText('methodological-limitations', wrapper.vm.selectedOptions)).toBe(true)
  })
})

describe('evidenceProfileForm.vue - warning modal focus flow', () => {
  let wrapper

  beforeEach(async () => {
    wrapper = await makeWrapper()
    wrapper.vm.$refs['modal-warning-same-txt'] = { hide: jest.fn() }
  })
  afterEach(() => { wrapper.destroy() })

  it.each([
    ['methodological-limitations', 'input-ml-explanation'],
    ['coherence', 'input-coherence-explanation'],
    ['adequacy', 'input-adequacy-explanation'],
    ['relevance', 'input-relevance-explanation'],
    ['cerqual', 'input-cerqual']
  ])('closeWarningModalDoItNow sets pendingExplanationFocusId to "%s" for type "%s"', (type, expectedId) => {
    wrapper.vm.closeWarningModalDoItNow(type)
    expect(wrapper.vm.pendingExplanationFocusId).toBe(expectedId)
    expect(wrapper.vm.$refs['modal-warning-same-txt'].hide).toHaveBeenCalled()
  })

  it('closeWarningModalDoItNow sets pendingExplanationFocusId to null for unknown type', () => {
    wrapper.vm.closeWarningModalDoItNow('unknown-type')
    expect(wrapper.vm.pendingExplanationFocusId).toBeNull()
    expect(wrapper.vm.$refs['modal-warning-same-txt'].hide).toHaveBeenCalled()
  })

  it('onWarningExplanationModalHidden calls focusExplanation with pending ID and clears it', () => {
    const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
    wrapper.vm.pendingExplanationFocusId = 'input-ml-explanation'
    wrapper.vm.onWarningExplanationModalHidden()
    expect(focusSpy).toHaveBeenCalledWith('input-ml-explanation')
    expect(wrapper.vm.pendingExplanationFocusId).toBeNull()
  })

  it('onWarningExplanationModalHidden does nothing when pendingExplanationFocusId is null', () => {
    const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
    wrapper.vm.pendingExplanationFocusId = null
    wrapper.vm.onWarningExplanationModalHidden()
    expect(focusSpy).not.toHaveBeenCalled()
  })
})
