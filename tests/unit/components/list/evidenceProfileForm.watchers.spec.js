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
    selectOptions: [{ text: 'High' }, { text: 'Moderate' }, { text: 'Low' }, { text: 'Very Low' }],
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

function setupRefs (wrapper) {
  wrapper.vm.$refs['modal-warning-changed-option'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-cleaning-cerqual'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-same-txt'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-evidence-profile-form'] = { show: jest.fn(), hide: jest.fn() }
}

// ─── modalData watcher ────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — watcher: modalData', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updates selectedOptions when modalData changes', async () => {
    const wrapper = makeWrapper()
    const newData = makeModalData({ cerqual: { option: '2', explanation: 'updated', notes: '' } })
    await wrapper.setProps({ modalData: newData })
    expect(wrapper.vm.selectedOptions.cerqual.option).toBe('2')
    expect(wrapper.vm.selectedOptions.cerqual.explanation).toBe('updated')
    wrapper.destroy()
  })

  it('creates a deep clone so changes to selectedOptions do not affect modalData', async () => {
    const wrapper = makeWrapper()
    const newData = makeModalData({ cerqual: { option: '1', explanation: 'original', notes: '' } })
    await wrapper.setProps({ modalData: newData })
    wrapper.vm.selectedOptions.cerqual.explanation = 'mutated'
    expect(newData.cerqual.explanation).toBe('original')
    wrapper.destroy()
  })
})

// ─── option watchers (methodological_limitations, coherence, adequacy, relevance) ─

const domainCases = [
  { domain: 'methodological_limitations', focusId: 'input-ml-explanation' },
  { domain: 'coherence', focusId: 'input-coherence-explanation' },
  { domain: 'adequacy', focusId: 'input-adequacy-explanation' },
  { domain: 'relevance', focusId: 'input-relevance-explanation' }
]

domainCases.forEach(({ domain, focusId }) => {
  describe(`evidenceProfileForm.vue — watcher: selectedOptions.${domain}.option`, () => {
    beforeEach(() => jest.clearAllMocks())

    it(`shows modal-warning-changed-option when cerqual is already set and option changes`, async () => {
      const wrapper = makeWrapper({
        modalData: makeModalData({ cerqual: { option: '1', explanation: 'existing', notes: '' } })
      })
      setupRefs(wrapper)
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          cerqual: { option: '1', explanation: 'existing', notes: '' },
          [domain]: { option: null, explanation: '', notes: '' }
        }
      })
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          [domain]: { option: '2', explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.$refs['modal-warning-changed-option'].show).toHaveBeenCalled()
      wrapper.destroy()
    })

    it(`calls focusExplanation with "${focusId}" when cerqual is null and option > 0`, async () => {
      const wrapper = makeWrapper()
      setupRefs(wrapper)
      const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          cerqual: { option: null, explanation: '', notes: '' },
          [domain]: { option: '2', explanation: '', notes: '' }
        }
      })
      expect(focusSpy).toHaveBeenCalledWith(focusId)
      wrapper.destroy()
    })

    it('does not call focusExplanation when option is "0" (no concerns)', async () => {
      const wrapper = makeWrapper()
      setupRefs(wrapper)
      const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          [domain]: { option: '0', explanation: '', notes: '' }
        }
      })
      expect(focusSpy).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })
})

// ─── updateOptions ────────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — updateOptions()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('resets cerqual option and explanation when status=true', async () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        cerqual: { option: '1', explanation: 'some explanation', notes: '' }
      }
    })
    wrapper.vm.updateOptions('coherence', true)
    expect(wrapper.vm.selectedOptions.cerqual.option).toBeNull()
    expect(wrapper.vm.selectedOptions.cerqual.explanation).toBe('')
    wrapper.destroy()
  })

  it('hides modal-warning-changed-option when status=true and option is not cerqual', () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.updateOptions('coherence', true)
    expect(wrapper.vm.$refs['modal-warning-changed-option'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('hides modal-warning-cleaning-cerqual when status=true and option is cerqual', () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.updateOptions('cerqual', true)
    expect(wrapper.vm.$refs['modal-warning-cleaning-cerqual'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('reverts domain option to modalData value when status=false', async () => {
    const wrapper = makeWrapper({
      modalData: makeModalData({ coherence: { option: '1', explanation: 'original', notes: '' } })
    })
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        coherence: { option: '3', explanation: 'changed', notes: '' }
      }
    })
    wrapper.vm.updateOptions('coherence', false)
    expect(wrapper.vm.selectedOptions.coherence.option).toBe('1')
    wrapper.destroy()
  })

  it('converts "methodological-limitations" to "methodological_limitations"', async () => {
    const wrapper = makeWrapper({
      modalData: makeModalData({ methodological_limitations: { option: '2', explanation: 'orig', notes: '' } })
    })
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        methodological_limitations: { option: '3', explanation: 'changed', notes: '' }
      }
    })
    wrapper.vm.updateOptions('methodological-limitations', false)
    expect(wrapper.vm.selectedOptions.methodological_limitations.option).toBe('2')
    wrapper.destroy()
  })

  ;[
    ['coherence', 'input-coherence-explanation'],
    ['adequacy', 'input-adequacy-explanation'],
    ['relevance', 'input-relevance-explanation'],
    ['methodological_limitations', 'input-ml-explanation']
  ].forEach(([domain, focusId]) => {
    it(`sets pendingChangedOptionFocusId="${focusId}" when accepting ${domain} change with option > 0`, async () => {
      const wrapper = makeWrapper()
      setupRefs(wrapper)
      await wrapper.setData({
        selectedOptions: { ...wrapper.vm.selectedOptions, [domain]: { option: '2', explanation: 'old text', notes: '' } }
      })
      wrapper.vm.updateOptions(domain, true)
      expect(wrapper.vm.pendingChangedOptionFocusId).toBe(focusId)
      wrapper.destroy()
    })
  })

  it('does not set pendingChangedOptionFocusId when new option is "0" (No concerns)', async () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '0', explanation: '', notes: '' } }
    })
    wrapper.vm.updateOptions('coherence', true)
    expect(wrapper.vm.pendingChangedOptionFocusId).toBeNull()
    wrapper.destroy()
  })

  it('does not set pendingChangedOptionFocusId when accepting cerqual option change', () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.updateOptions('cerqual', true)
    expect(wrapper.vm.pendingChangedOptionFocusId).toBeNull()
    wrapper.destroy()
  })
})

// ─── onWarningChangedOptionModalHidden ────────────────────────────────────────

describe('evidenceProfileForm.vue — onWarningChangedOptionModalHidden()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls focusExplanation with the pending ID and clears it', async () => {
    const wrapper = makeWrapper()
    const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
    await wrapper.setData({ pendingChangedOptionFocusId: 'input-coherence-explanation' })
    wrapper.vm.onWarningChangedOptionModalHidden()
    expect(focusSpy).toHaveBeenCalledWith('input-coherence-explanation')
    expect(wrapper.vm.pendingChangedOptionFocusId).toBeNull()
    wrapper.destroy()
  })

  it('does nothing when pendingChangedOptionFocusId is null', () => {
    const wrapper = makeWrapper()
    const focusSpy = jest.spyOn(wrapper.vm, 'focusExplanation').mockImplementation(() => {})
    wrapper.vm.onWarningChangedOptionModalHidden()
    expect(focusSpy).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

// ─── clearMySelection ─────────────────────────────────────────────────────────

describe('evidenceProfileForm.vue — clearMySelection()', () => {
  beforeEach(() => jest.clearAllMocks())

  ;['methodological_limitations', 'coherence', 'adequacy', 'relevance'].forEach(domain => {
    it(`resets option and explanation for ${domain}`, async () => {
      const wrapper = makeWrapper()
      setupRefs(wrapper)
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          [domain]: { option: '2', explanation: 'some text', notes: '' }
        }
      })
      wrapper.vm.clearMySelection(domain)
      expect(wrapper.vm.selectedOptions[domain].option).toBeNull()
      expect(wrapper.vm.selectedOptions[domain].explanation).toBe('')
      wrapper.destroy()
    })
  })

  it('resets cerqual option and explanation', async () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        cerqual: { option: '1', explanation: 'text', notes: '' }
      }
    })
    wrapper.vm.clearMySelection('cerqual')
    expect(wrapper.vm.selectedOptions.cerqual.option).toBeNull()
    expect(wrapper.vm.selectedOptions.cerqual.explanation).toBe('')
    wrapper.destroy()
  })

  it('shows modal-warning-cleaning-cerqual when clearing cerqual', () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.clearMySelection('cerqual')
    expect(wrapper.vm.$refs['modal-warning-cleaning-cerqual'].show).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('does not show any modal when clearing non-cerqual domain', () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.clearMySelection('coherence')
    expect(wrapper.vm.$refs['modal-warning-cleaning-cerqual'].show).not.toHaveBeenCalled()
    expect(wrapper.vm.$refs['modal-warning-changed-option'].show).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
