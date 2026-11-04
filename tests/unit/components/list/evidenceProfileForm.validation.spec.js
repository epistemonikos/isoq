import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'

const localVue = createLocalVue()

jest.mock('@/utils/Api')

const makeModalData = (overrides = {}) => ({
  type: 'cerqual',
  title: 'Test finding',
  isoqf_id: null,
  methodological_limitations: { option: null, explanation: '', notes: '' },
  coherence: { option: null, explanation: '', notes: '' },
  adequacy: { option: null, explanation: '', notes: '' },
  relevance: { option: null, explanation: '', notes: '' },
  cerqual: { option: null, explanation: '', notes: '' },
  ...overrides
})

const makeList = (overrides = {}) => ({
  id: 'list1',
  organization: 'org1',
  project_id: 'proj1',
  references: [],
  project: { private: false },
  publishable_lists: [],
  ...overrides
})

const makeWrapper = (propsData = {}) => shallowMount(evidenceProfileForm, {
  localVue,
  propsData: {
    modalData: makeModalData(),
    list: makeList(),
    ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
    methAssessments: { items: [], fieldsObj: [] },
    findings: { id: 'finding1' },
    extractedData: { id: 'ed1', items: [], fieldsObj: [] },
    refsWithTitle: [],
    permission: true,
    evidenceProfile: [makeModalData()],
    selectOptions: [{ text: 'High' }, { text: 'Moderate' }, { text: 'Low' }, { text: 'Very Low' }],
    show: {},
    modePrintFieldObject: [],
    mode: 'edit',
    charsOfStudies: { items: [], fieldsObj: [] },
    project: { use_camelot: false, review_question: 'q', inclusion: 'i', exclusion: 'e' },
    ...propsData
  },
  mocks: {
    $t: key => key,
    $route: { params: { org_id: 'org1', id: 'list1' } },
    $bvModal: { show: jest.fn(), hide: jest.fn() },
    $store: { state: {} }
  },
  stubs: {
    'b-form-group': true, 'b-form-textarea': true, 'b-form-radio-group': true,
    'b-form-radio': true, 'b-form-invalid-feedback': true, 'b-modal': true,
    'b-tabs': true, 'b-tab': true, 'b-button': true, 'b-link': true,
    'b-col': true, 'b-row': true, 'b-container': true, 'b-table': true,
    'video-help': true, 'edit-review-finding': true, 'assessment-table': true,
    'camelot-characteristics-table': true, 'table-extracted-data': true,
    'font-awesome-icon': true
  }
})

// ─── checkValidationExplanationText ──────────────────────────────────────────

describe('evidenceProfileForm.vue — checkValidationExplanationText()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns false when type is falsy', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.checkValidationExplanationText('', wrapper.vm.selectedOptions)).toBe(false)
    wrapper.destroy()
  })

  it('returns false when option is null', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData()
    expect(wrapper.vm.checkValidationExplanationText('cerqual', prop)).toBe(false)
    wrapper.destroy()
  })

  it('returns false when a component option is "0" (no concerns — explanation not required)', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData({ coherence: { option: '0', explanation: '', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('coherence', prop)).toBe(false)
    wrapper.destroy()
  })

  it('returns true when option > 0 and explanation is empty', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData({ cerqual: { option: '1', explanation: '', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('cerqual', prop)).toBe(true)
    wrapper.destroy()
  })

  it('returns false when option > 0 and explanation is present', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData({ cerqual: { option: '1', explanation: 'some text', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('cerqual', prop)).toBe(false)
    wrapper.destroy()
  })

  it('converts dashes in type name: "methodological-limitations" → "methodological_limitations"', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData({ methodological_limitations: { option: '2', explanation: '', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('methodological-limitations', prop)).toBe(true)
    wrapper.destroy()
  })

  it('returns false when whitespace explanation with option "0"', () => {
    const wrapper = makeWrapper()
    const prop = makeModalData({ coherence: { option: '0', explanation: '   ', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('coherence', prop)).toBe(false)
    wrapper.destroy()
  })
})

// ─── saveEvidenceProfile ──────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — saveEvidenceProfile()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('always calls event.preventDefault()', () => {
    const wrapper = makeWrapper()
    jest.spyOn(wrapper.vm, 'openWarningModalForExplanationText').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    const event = { preventDefault: jest.fn() }
    wrapper.vm.saveEvidenceProfile('cerqual', event)
    expect(event.preventDefault).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('opens warning modal when explanation is missing for selected option', () => {
    const wrapper = makeWrapper()
    const openWarningSpy = jest.spyOn(wrapper.vm, 'openWarningModalForExplanationText').mockImplementation(() => {})
    const continueSpy = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.option = '1'
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    wrapper.vm.saveEvidenceProfile('cerqual', { preventDefault: jest.fn() })
    expect(openWarningSpy).toHaveBeenCalled()
    expect(continueSpy).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('calls continueSavingDataModal() when validation passes', () => {
    const wrapper = makeWrapper()
    const continueSpy = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.option = '1'
    wrapper.vm.selectedOptions.cerqual.explanation = 'Moderate confidence because...'
    wrapper.vm.saveEvidenceProfile('cerqual', { preventDefault: jest.fn() })
    expect(continueSpy).toHaveBeenCalledWith()
    wrapper.destroy()
  })
})
