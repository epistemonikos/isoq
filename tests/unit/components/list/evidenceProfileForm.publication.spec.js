import { mount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'
import { fetchPublicationState } from '@/utils/publicationState'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/utils/publicationState')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const makeModalData = (overrides = {}) => ({
  type: 'cerqual',
  title: 'Test finding',
  isoqf_id: null,
  methodological_limitations: { option: null, explanation: '', notes: '' },
  coherence: { option: null, explanation: '', notes: '' },
  adequacy: { option: null, explanation: '', notes: '' },
  relevance: { option: null, explanation: '', notes: '' },
  cerqual: { option: '1', explanation: 'Because', notes: '' },
  ...overrides
})

const completeList = id => ({
  id, name: id, project_id: 'proj1', references: ['r1'], cerqual: { option: 1, explanation: 'Because' }
})
const publicProject = { public_type: 'fully', published_list_ids: [] }

const Modal = { template: '<div class="modal-stub"><slot /></div>', methods: { show () {}, hide () {} } }

const makeWrapper = (propsData = {}) => mount(evidenceProfileForm, {
  localVue,
  propsData: {
    modalData: makeModalData(),
    // The props still say there is a single visible finding; the decision is the fresh read.
    list: { ...completeList('list1'), project: { private: false }, publishable_lists: ['list1'] },
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
    $store: { state: {} },
    $notify: { error: jest.fn(), warning: jest.fn() }
  },
  stubs: {
    'b-modal': Modal,
    'b-form-group': true, 'b-form-textarea': true, 'b-form-radio-group': true,
    'b-form-radio': true, 'b-form-invalid-feedback': true,
    'b-tabs': true, 'b-tab': true, 'b-button': { template: '<button><slot /></button>' }, 'b-link': true,
    'b-col': true, 'b-row': true, 'b-container': true, 'b-table': true,
    'video-help': true, 'edit-review-finding': true, 'assessment-table': true,
    'camelot-characteristics-table': true, 'table-extracted-data': true,
    'font-awesome-icon': true
  }
})

const modalText = (wrapper, id) => wrapper.find(`#${id}`).text()

const REVERT = 'worksheet.warnings.revert_private'

describe('evidenceProfileForm publication warnings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [completeList('list1')] })
  })

  async function changeCoherence (wrapper) {
    await wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '2', explanation: '', notes: '' } }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  test('changing an option shows the revert warning when this is the last visible finding', async () => {
    const wrapper = makeWrapper({ modalData: makeModalData({ coherence: { option: '1', explanation: 'x', notes: '' } }) })
    await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '1', explanation: 'x', notes: '' } } })
    await changeCoherence(wrapper)
    expect(fetchPublicationState).toHaveBeenCalledWith('proj1')
    expect(modalText(wrapper, 'modal-warning-changed-option')).toContain(REVERT)
    wrapper.destroy()
  })

  test('the revert warning is not shown when another member completed a finding meanwhile', async () => {
    fetchPublicationState.mockResolvedValue({
      project: publicProject,
      lists: [completeList('list1'), completeList('list2')]
    })
    const wrapper = makeWrapper({ modalData: makeModalData({ coherence: { option: '1', explanation: 'x', notes: '' } }) })
    await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '1', explanation: 'x', notes: '' } } })
    await changeCoherence(wrapper)
    const text = modalText(wrapper, 'modal-warning-changed-option')
    expect(text).not.toContain(REVERT)
    expect(text).toContain('worksheet.warnings.changed_option')
    wrapper.destroy()
  })

  test('a failed re-read notifies and reverts the option instead of staying silent', async () => {
    fetchPublicationState.mockRejectedValue(new Error('network down'))
    const wrapper = makeWrapper({ modalData: makeModalData({ coherence: { option: '1', explanation: 'x', notes: '' } }) })
    await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '1', explanation: 'x', notes: '' } } })
    await changeCoherence(wrapper)
    expect(wrapper.vm.$notify.error).toHaveBeenCalled()
    expect(wrapper.vm.selectedOptions.coherence.option).toBe('1')
    wrapper.destroy()
  })

  test('clearing CERQual shows the revert text when the project would go private', async () => {
    const wrapper = makeWrapper()
    await wrapper.vm.clearMySelection('cerqual')
    await wrapper.vm.$nextTick()
    const text = modalText(wrapper, 'modal-warning-cleaning-cerqual')
    expect(text).toContain('worksheet.warnings.clear_cerqual_revert')
    expect(text).not.toContain('worksheet.warnings.clear_cerqual_simple')
    wrapper.destroy()
  })

  test('clearing CERQual shows the simple text when another finding stays visible', async () => {
    fetchPublicationState.mockResolvedValue({
      project: publicProject,
      lists: [completeList('list1'), completeList('list2')]
    })
    const wrapper = makeWrapper()
    await wrapper.vm.clearMySelection('cerqual')
    await wrapper.vm.$nextTick()
    expect(modalText(wrapper, 'modal-warning-cleaning-cerqual')).toContain('worksheet.warnings.clear_cerqual_simple')
    wrapper.destroy()
  })

  test('clearing CERQual never posts /unpublish/project', async () => {
    const wrapper = makeWrapper()
    wrapper.vm.lockedSectionRefs = ['finding1::ep::cerqual']
    await wrapper.vm.clearMySelection('cerqual')
    await wrapper.vm.updateOptions('cerqual', true)
    await wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(Api.post).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later saves straight away when the finding stays as it was', async () => {
    fetchPublicationState.mockResolvedValue({
      project: { public_type: 'private' },
      lists: [completeList('list1')]
    })
    const wrapper = makeWrapper()
    const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    await wrapper.vm.closeWarningModalDoItLater()
    expect(save).toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later warns before saving a CERQual without explanation that would hide the project', async () => {
    const wrapper = makeWrapper()
    const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    await wrapper.vm.closeWarningModalDoItLater()
    await wrapper.vm.$nextTick()
    expect(save).not.toHaveBeenCalled()
    expect(modalText(wrapper, 'modal-warning-save-incomplete')).toContain('worksheet.warnings.clear_cerqual_revert')
    wrapper.vm.confirmIncompleteSave()
    expect(save).toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later stops when the re-read fails', async () => {
    fetchPublicationState.mockRejectedValue(new Error('network down'))
    const wrapper = makeWrapper()
    const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    await wrapper.vm.closeWarningModalDoItLater()
    expect(save).not.toHaveBeenCalled()
    expect(wrapper.vm.$notify.error).toHaveBeenCalled()
    wrapper.destroy()
  })

  test('high confidence without explanation is flagged in the overall CERQual', () => {
    const wrapper = makeWrapper()
    const highNoText = makeModalData({ cerqual: { option: '0', explanation: '', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('cerqual', highNoText)).toBe(true)
    wrapper.vm.selectedOptions.cerqual.option = '0'
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    expect(wrapper.vm.explanationStateFor('cerqual')).toBe(false)
    wrapper.destroy()
  })

  test('no concerns without explanation is still allowed in a component', () => {
    const wrapper = makeWrapper()
    const noConcerns = makeModalData({ coherence: { option: '0', explanation: '', notes: '' } })
    expect(wrapper.vm.checkValidationExplanationText('coherence', noConcerns)).toBe(false)
    wrapper.vm.selectedOptions.coherence.option = '0'
    expect(wrapper.vm.explanationStateFor('coherence')).toBeNull()
    wrapper.destroy()
  })
})
