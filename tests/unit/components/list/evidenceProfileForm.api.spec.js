import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} })
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

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
  wrapper.vm.$refs['modal-evidence-profile-form'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-same-txt'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-changed-option'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-cleaning-cerqual'] = { show: jest.fn(), hide: jest.fn() }
}

// ─── continueSavingDataModal ──────────────────────────────────────────────────

describe('evidenceProfileForm.vue — continueSavingDataModal()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('emits busyEvidenceProfileTable=true immediately', async () => {
    const wrapper = makeWrapper()
    setupRefs(wrapper)
    wrapper.vm.continueSavingDataModal()
    expect(wrapper.emitted('busyEvidenceProfileTable')).toBeTruthy()
    expect(wrapper.emitted('busyEvidenceProfileTable')[0]).toEqual([true])
    wrapper.destroy()
  })

  it('PATCHes only the changed section to /isoqf_findings/<id>/section/<name>', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: 2, explanation: 'x', notes: '' } }
    })
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/coherence',
      { option: 2, explanation: 'x', notes: '' }
    )
    // Untouched sections are NOT patched (no Last-Write-Wins)
    expect(Api.patch).not.toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/adequacy', expect.anything()
    )
    wrapper.destroy()
  })

  it('emits callGetStageOneData and hides modal on success (status=false)', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    await wrapper.vm.continueSavingDataModal(false)
    await flushPromises()
    expect(wrapper.emitted('callGetStageOneData')).toBeTruthy()
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('calls Api.post unpublish then emits and hides modal when status=true', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    await wrapper.vm.continueSavingDataModal(true)
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/unpublish/project/proj1')
    expect(wrapper.emitted('callGetStageOneData')).toBeTruthy()
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('calls Api.post on isoqf_findings when findings has no id', async () => {
    const wrapper = makeWrapper({ findings: {} })
    setupRefs(wrapper)
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_findings',
      expect.objectContaining({ organization: 'org1', list_id: 'list1' })
    )
    expect(wrapper.emitted('callGetStageOneData')).toBeTruthy()
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('calls printErrors on Api.patch failure', async () => {
    Api.patch.mockRejectedValueOnce({ message: 'network error' })
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    const printErrorsSpy = jest.spyOn(wrapper.vm, 'printErrors').mockImplementation(() => {})
    await wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: 2, explanation: 'x', notes: '' } }
    })
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(printErrorsSpy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('does not mutate selectedOptions (type property remains after call)', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, type: 'cerqual' } })
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(wrapper.vm.selectedOptions).toHaveProperty('type', 'cerqual')
    wrapper.destroy()
  })

  it('emits update-list-data (refetch to pull the backend-sealed mirror) on success', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    await wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: 2, explanation: 'x', notes: '' } }
    })
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(wrapper.emitted('callGetStageOneData')).toBeTruthy()
    expect(wrapper.emitted('update-list-data')).toBeTruthy()
    wrapper.destroy()
  })

  it('does not PATCH the list: a full 5-section save is N requests, not 2N+1', async () => {
    const wrapper = makeWrapper({ findings: { id: 'finding1' } })
    setupRefs(wrapper)
    // All 5 evidence_profile sections changed vs the loaded modalData.
    await wrapper.setData({
      selectedOptions: {
        ...wrapper.vm.selectedOptions,
        methodological_limitations: { option: 1, explanation: 'a', notes: '' },
        coherence: { option: 1, explanation: 'b', notes: '' },
        adequacy: { option: 1, explanation: 'c', notes: '' },
        relevance: { option: 1, explanation: 'd', notes: '' },
        cerqual: { option: 1, explanation: 'e', notes: '' }
      }
    })
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    // 5 changed sections → exactly 5 finding PATCHes and ZERO list PATCHes: the backend
    // now seals the list mirror + top-level cerqual on the finding write (was 2N+1 = 11).
    expect(Api.patch).toHaveBeenCalledTimes(5)
    expect(Api.patch).not.toHaveBeenCalledWith(
      expect.stringContaining('/isoqf_lists/'), expect.anything()
    )
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/methodological_limitations',
      expect.objectContaining({ option: 1, explanation: 'a', notes: '' })
    )
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/coherence',
      expect.objectContaining({ option: 1, explanation: 'b', notes: '' })
    )
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/adequacy',
      expect.objectContaining({ option: 1, explanation: 'c', notes: '' })
    )
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/relevance',
      expect.objectContaining({ option: 1, explanation: 'd', notes: '' })
    )
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_findings/finding1/section/cerqual',
      expect.objectContaining({ option: 1, explanation: 'e', notes: '' })
    )
    wrapper.destroy()
  })
})

// ─── updateContentExtractedDataItem ──────────────────────────────────────────

describe('evidenceProfileForm.vue — updateContentExtractedDataItem()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls Api.patch with updated items replacing the matching ref_id', async () => {
    const items = [
      { ref_id: 'ref1', column_0: 'old text', index: 0 },
      { ref_id: 'ref2', column_0: 'other', index: 1 }
    ]
    const updatedItem = { ref_id: 'ref1', column_0: 'new text', index: 0 }
    const wrapper = makeWrapper({
      extractedData: { id: 'ed1', items, fieldsObj: [] },
      showEditExtractedDataInPlace: { display: true, item: updatedItem },
      findings: { id: 'finding1' }
    })
    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()
    // Granular save: only the edited row goes to the /item/<ref_id> sub-resource
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_extracted_data/ed1/item/ref1',
      expect.objectContaining({ ref_id: 'ref1', column_0: 'new text' })
    )
    wrapper.destroy()
  })

  it('emits getExtractedData=true on success', async () => {
    const wrapper = makeWrapper({
      extractedData: { id: 'ed1', items: [{ ref_id: 'ref1', index: 0 }], fieldsObj: [] },
      showEditExtractedDataInPlace: { display: true, item: { ref_id: 'ref1', index: 0 } }
    })
    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()
    expect(wrapper.emitted('getExtractedData')).toBeTruthy()
    expect(wrapper.emitted('getExtractedData')[0]).toEqual([true])
    wrapper.destroy()
  })

  it('emits setShowEditExtractedDataInPlace with display=false on success', async () => {
    const wrapper = makeWrapper({
      extractedData: { id: 'ed1', items: [{ ref_id: 'ref1', index: 0 }], fieldsObj: [] },
      showEditExtractedDataInPlace: { display: true, item: { ref_id: 'ref1', index: 0 } }
    })
    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()
    const emitted = wrapper.emitted('setShowEditExtractedDataInPlace')
    expect(emitted).toBeTruthy()
    expect(emitted[emitted.length - 1][0]).toEqual({ display: false, item: {} })
    wrapper.destroy()
  })

  it('calls printErrors on Api.patch failure', async () => {
    Api.patch.mockRejectedValueOnce({ message: 'error' })
    const wrapper = makeWrapper({
      extractedData: { id: 'ed1', items: [{ ref_id: 'ref1', index: 0 }], fieldsObj: [] },
      showEditExtractedDataInPlace: { display: true, item: { ref_id: 'ref1', index: 0 } }
    })
    const printErrorsSpy = jest.spyOn(wrapper.vm, 'printErrors').mockImplementation(() => {})
    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()
    expect(printErrorsSpy).toHaveBeenCalled()
    wrapper.destroy()
  })
})
