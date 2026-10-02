import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/components/utils/commons', () => ({
  displayExplanation: jest.fn((type, option, explanation) => explanation),
  generateCerqualExplanation: jest.fn(() => 'generated explanation')
}))

import { generateCerqualExplanation } from '@/components/utils/commons'

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

const makeWrapper = (propsData = {}) => shallowMount(evidenceProfileForm, {
  localVue,
  propsData: {
    modalData: makeModalData(),
    list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
    ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
    methAssessments: { items: [], fieldsObj: [] },
    findings: { id: 'finding1' },
    extractedData: { id: 'ed1', items: [], fieldsObj: [] },
    refsWithTitle: [],
    permission: true,
    evidenceProfile: [makeModalData()],
    selectOptions: [
      { text: 'High confidence' },
      { text: 'Moderate confidence' },
      { text: 'Low confidence' },
      { text: 'Very low confidence' }
    ],
    show: {},
    modePrintFieldObject: [],
    mode: 'edit',
    showEditExtractedDataInPlace: { display: false, item: {} },
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

// ─── showMessage ──────────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — showMessage()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty string when option is null', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.showMessage(null, 'coherence')).toBe('')
    wrapper.destroy()
  })

  it('returns empty string for unknown domain type', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.showMessage('1', 'unknown_domain')).toBe('')
    wrapper.destroy()
  })

  it('returns concatenated translation keys for option 0 and methodological_limitations', () => {
    const wrapper = makeWrapper()
    const result = wrapper.vm.showMessage('0', 'methodological_limitations')
    expect(result).toBe('worksheet.generated_text.no_concerns worksheet.domains_lc.methodological_limitations common.because')
    wrapper.destroy()
  })

  it('returns correct string for option 1 and coherence', () => {
    const wrapper = makeWrapper()
    const result = wrapper.vm.showMessage('1', 'coherence')
    expect(result).toBe('worksheet.generated_text.minor_concerns worksheet.domains_lc.coherence common.because')
    wrapper.destroy()
  })

  it('returns correct string for option 2 and adequacy', () => {
    const wrapper = makeWrapper()
    const result = wrapper.vm.showMessage('2', 'adequacy')
    expect(result).toBe('worksheet.generated_text.moderate_concerns worksheet.domains_lc.adequacy common.because')
    wrapper.destroy()
  })

  it('returns correct string for option 3 and relevance', () => {
    const wrapper = makeWrapper()
    const result = wrapper.vm.showMessage('3', 'relevance')
    expect(result).toBe('worksheet.generated_text.serious_concerns worksheet.domains_lc.relevance common.because')
    wrapper.destroy()
  })
})

// ─── displaySelectedOption ────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — displaySelectedOption()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns empty string when option is null', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.displaySelectedOption(null)).toBe('')
    wrapper.destroy()
  })

  it('returns selectOptions text for option 0', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.displaySelectedOption(0)).toBe('High confidence')
    wrapper.destroy()
  })

  it('returns selectOptions text for option 1', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.displaySelectedOption(1)).toBe('Moderate confidence')
    wrapper.destroy()
  })

  it('returns selectOptions text for option 3', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.displaySelectedOption(3)).toBe('Very low confidence')
    wrapper.destroy()
  })

  it('returns empty string for negative option', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.displaySelectedOption(-1)).toBe('')
    wrapper.destroy()
  })
})

// ─── getReferenceInfo ─────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — getReferenceInfo()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns content of matching reference', () => {
    const wrapper = makeWrapper({
      refsWithTitle: [
        { id: 'ref1', content: 'Author et al. 2020' },
        { id: 'ref2', content: 'Smith et al. 2021' }
      ]
    })
    expect(wrapper.vm.getReferenceInfo('ref1')).toBe('Author et al. 2020')
    wrapper.destroy()
  })

  it('returns undefined when refId is not found', () => {
    const wrapper = makeWrapper({ refsWithTitle: [{ id: 'ref1', content: 'some content' }] })
    expect(wrapper.vm.getReferenceInfo('nonexistent')).toBeUndefined()
    wrapper.destroy()
  })

  it('returns undefined when refsWithTitle is empty', () => {
    const wrapper = makeWrapper({ refsWithTitle: [] })
    expect(wrapper.vm.getReferenceInfo('ref1')).toBeUndefined()
    wrapper.destroy()
  })
})

// ─── getList ──────────────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — getList()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits update-list-data with true when status is true', () => {
    const wrapper = makeWrapper()
    wrapper.vm.getList(true)
    expect(wrapper.emitted('update-list-data')).toBeTruthy()
    expect(wrapper.emitted('update-list-data')[0]).toEqual([true])
    wrapper.destroy()
  })

  it('does not emit when status is false', () => {
    const wrapper = makeWrapper()
    wrapper.vm.getList(false)
    expect(wrapper.emitted('update-list-data')).toBeFalsy()
    wrapper.destroy()
  })
})

// ─── getExtractedData ─────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — getExtractedData()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits getExtractedData with the received status', () => {
    const wrapper = makeWrapper()
    wrapper.vm.getExtractedData(true)
    expect(wrapper.emitted('getExtractedData')).toBeTruthy()
    expect(wrapper.emitted('getExtractedData')[0]).toEqual([true])
    wrapper.destroy()
  })

  it('emits getExtractedData with false', () => {
    const wrapper = makeWrapper()
    wrapper.vm.getExtractedData(false)
    expect(wrapper.emitted('getExtractedData')[0]).toEqual([false])
    wrapper.destroy()
  })
})

// ─── editExtractedDataInPlace ─────────────────────────────────────────────────

describe('evidenceProfileForm.vue — editExtractedDataInPlace()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits setShowEditExtractedDataInPlace with display=true and the item at given index', () => {
    const items = [
      { ref_id: 'ref1', column_0: 'text A', index: 0 },
      { ref_id: 'ref2', column_0: 'text B', index: 1 }
    ]
    const wrapper = makeWrapper({ extractedData: { id: 'ed1', items, fieldsObj: [] } })
    wrapper.vm.editExtractedDataInPlace(1)
    const emitted = wrapper.emitted('setShowEditExtractedDataInPlace')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ display: true, item: items[1] })
    wrapper.destroy()
  })

  it('emits a deep clone of the item (not the same reference)', () => {
    const items = [{ ref_id: 'ref1', column_0: 'original', index: 0 }]
    const wrapper = makeWrapper({ extractedData: { id: 'ed1', items, fieldsObj: [] } })
    wrapper.vm.editExtractedDataInPlace(0)
    const emittedItem = wrapper.emitted('setShowEditExtractedDataInPlace')[0][0].item
    emittedItem.column_0 = 'mutated'
    expect(items[0].column_0).toBe('original')
    wrapper.destroy()
  })
})

// ─── cancelExtractedDataInPlace ───────────────────────────────────────────────

describe('evidenceProfileForm.vue — cancelExtractedDataInPlace()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits setShowEditExtractedDataInPlace with display=false and empty item', () => {
    const wrapper = makeWrapper()
    wrapper.vm.cancelExtractedDataInPlace()
    const emitted = wrapper.emitted('setShowEditExtractedDataInPlace')
    expect(emitted).toBeTruthy()
    expect(emitted[0][0]).toEqual({ display: false, item: {} })
    wrapper.destroy()
  })
})

// ─── commonGenerateCerqualExplanation ─────────────────────────────────────────

describe('evidenceProfileForm.vue — commonGenerateCerqualExplanation()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls generateCerqualExplanation with selectedOptions and assigns result to cerqual.explanation', async () => {
    const wrapper = makeWrapper()
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        cerqual: { option: '1', explanation: '', notes: '' }
      }
    })
    wrapper.vm.commonGenerateCerqualExplanation()
    expect(generateCerqualExplanation).toHaveBeenCalledWith(wrapper.vm.selectedOptions)
    expect(wrapper.vm.selectedOptions.cerqual.explanation).toBe('generated explanation')
    wrapper.destroy()
  })

  it('calls focusExplanation with "input-cerqual"', () => {
    const wrapper = makeWrapper()
    const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
    wrapper.vm.commonGenerateCerqualExplanation()
    expect(focusSpy).toHaveBeenCalledWith('input-cerqual')
    wrapper.destroy()
  })
})
