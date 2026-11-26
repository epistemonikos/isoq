import { mount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/services/lockService')

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

// Api.get resolves with the whole response, never the body: this mocks the real contract.
const serve = ({ project, lists }) => Api.get.mockImplementation(path =>
  Promise.resolve({ data: path.startsWith('/isoqf_projects') ? project : lists }))

// Reads that stay pending until the test answers them, to order late results.
function deferredServer () {
  const calls = []
  Api.get.mockImplementation(path => new Promise(resolve => calls.push({ path, resolve })))
  return {
    calls,
    answer (from, { project, lists }) {
      calls.slice(from, from + 2).forEach(c =>
        c.resolve({ data: c.path.startsWith('/isoqf_projects') ? project : lists }))
    }
  }
}

const completeList = id => ({
  id, name: id, project_id: 'proj1', references: ['r1'], cerqual: { option: 1, explanation: 'Because' }
})
const publicProject = { public_type: 'fully', published_list_ids: [] }

const Modal = { template: '<div class="modal-stub"><slot /></div>', methods: { show () {}, hide () {} } }

const mountOpen = (...args) => {
  const w = mount(...args)
  // The editor is open and holds its lock: that is what lets a late read act.
  w.vm.modalOpen = true
  return w
}

const makeWrapper = (propsData = {}) => mountOpen(evidenceProfileForm, {
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
    serve({ project: publicProject, lists: [completeList('list1')] })
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
    expect(Api.get).toHaveBeenCalledWith('/isoqf_lists', { project_id: 'proj1' }, { networkOnly: true })
    expect(modalText(wrapper, 'modal-warning-changed-option')).toContain(REVERT)
    wrapper.destroy()
  })

  test('the revert warning is not shown when another member completed a finding meanwhile', async () => {
    serve({
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
    Api.get.mockRejectedValue(new Error('network down'))
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
    serve({
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
    // The conditions that used to trigger the POST: this list is the only publishable one,
    // the project is public, and the CERQual option has been cleared.
    const wrapper = makeWrapper({
      list: { ...completeList('list1'), project: { private: false }, publishable_lists: ['list1'] }
    })
    wrapper.vm.lockedSectionRefs = ['finding1::ep::cerqual']
    wrapper.vm.selectedOptions.cerqual.option = null
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    wrapper.vm.saveEvidenceProfile('cerqual', { preventDefault: jest.fn() })
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_findings/finding1/section/cerqual', expect.anything())
    expect(Api.post).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later saves straight away when the finding stays as it was', async () => {
    serve({
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
    expect(modalText(wrapper, 'modal-warning-save-incomplete')).toContain('worksheet.warnings.save_incomplete_revert')
    expect(modalText(wrapper, 'modal-warning-save-incomplete')).not.toContain('clear_cerqual')
    wrapper.vm.confirmIncompleteSave()
    expect(save).toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later stops when the re-read fails', async () => {
    Api.get.mockRejectedValue(new Error('network down'))
    const wrapper = makeWrapper()
    const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    await wrapper.vm.closeWarningModalDoItLater()
    expect(save).not.toHaveBeenCalled()
    expect(wrapper.vm.$notify.error).toHaveBeenCalled()
    wrapper.destroy()
  })

  test('do it later says the finding will be hidden when other findings stay visible', async () => {
    serve({ project: publicProject, lists: [completeList('list1'), completeList('list2')] })
    const wrapper = makeWrapper()
    jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
    wrapper.vm.selectedOptions.cerqual.explanation = ''
    await wrapper.vm.closeWarningModalDoItLater()
    await wrapper.vm.$nextTick()
    const text = modalText(wrapper, 'modal-warning-save-incomplete')
    expect(text).toContain('worksheet.warnings.save_incomplete_hidden')
    expect(text).not.toContain('clear_cerqual')
    wrapper.destroy()
  })

  test('clearing CERQual in a private project adds no publication sentence', async () => {
    serve({ project: { public_type: 'private' }, lists: [completeList('list1')] })
    const wrapper = makeWrapper()
    await wrapper.vm.clearMySelection('cerqual')
    await wrapper.vm.$nextTick()
    const text = modalText(wrapper, 'modal-warning-cleaning-cerqual')
    expect(text).not.toContain('clear_cerqual_simple')
    expect(text).not.toContain('clear_cerqual_revert')
    expect(text).toContain('common.continue_question')
    wrapper.destroy()
  })

  describe('offline', () => {
    const offline = () => Object.assign(new Error('offline'), { isOfflineError: true })

    test('changing an option offline says the check needs a connection and reverts', async () => {
      Api.get.mockRejectedValue(offline())
      const wrapper = makeWrapper({ modalData: makeModalData({ coherence: { option: '1', explanation: 'x', notes: '' } }) })
      await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '1', explanation: 'x', notes: '' } } })
      await changeCoherence(wrapper)
      expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('publish.check_needs_connection')
      expect(wrapper.vm.selectedOptions.coherence.option).toBe('1')
      wrapper.destroy()
    })

    test('clearing CERQual offline says the check needs a connection and restores it', async () => {
      Api.get.mockRejectedValue(offline())
      const wrapper = makeWrapper()
      await wrapper.vm.clearMySelection('cerqual')
      expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('publish.check_needs_connection')
      expect(wrapper.vm.selectedOptions.cerqual.option).toBe('1')
      wrapper.destroy()
    })

    test('do it later offline says the check needs a connection and does not save', async () => {
      Api.get.mockRejectedValue(offline())
      const wrapper = makeWrapper()
      const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
      wrapper.vm.selectedOptions.cerqual.explanation = ''
      await wrapper.vm.closeWarningModalDoItLater()
      expect(save).not.toHaveBeenCalled()
      expect(wrapper.vm.$notify.error).toHaveBeenCalledWith('publish.check_needs_connection')
      wrapper.destroy()
    })
  })

  describe('late results', () => {
    const changeDomain = (wrapper, domain) => wrapper.setData({
      selectedOptions: { ...wrapper.vm.selectedOptions, [domain]: { option: '2', explanation: '', notes: '' } }
    })
    const modalDataWith = domain => makeModalData({ [domain]: { option: '1', explanation: 'x', notes: '' } })

    async function twoDomainsOpen () {
      const wrapper = makeWrapper({
        modalData: makeModalData({
          coherence: { option: '1', explanation: 'x', notes: '' },
          adequacy: { option: '1', explanation: 'x', notes: '' }
        })
      })
      await wrapper.setData({ selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: '1', explanation: 'x', notes: '' }, adequacy: { option: '1', explanation: 'x', notes: '' } } })
      return wrapper
    }

    test('two quick changes: only the latest result opens the modal', async () => {
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      const show = jest.spyOn(wrapper.vm.$refs['modal-warning-changed-option'], 'show')
      await changeDomain(wrapper, 'coherence')
      await changeDomain(wrapper, 'adequacy')
      expect(server.calls).toHaveLength(4)
      // The newer read answers first (private), the older one late (hidden).
      server.answer(2, { project: publicProject, lists: [completeList('list1')] })
      await flushPromises()
      server.answer(0, { project: publicProject, lists: [completeList('list1'), completeList('list2')] })
      await flushPromises()
      expect(show).toHaveBeenCalledTimes(1)
      expect(wrapper.vm.changedOptionImpact).toBe('project_private')
      wrapper.destroy()
    })

    test('an editor closed during the read gets no modal and no lock', async () => {
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      const show = jest.spyOn(wrapper.vm.$refs['modal-warning-changed-option'], 'show')
      await changeDomain(wrapper, 'coherence')
      wrapper.vm.modalOpen = false
      server.answer(0, { project: publicProject, lists: [completeList('list1')] })
      await flushPromises()
      expect(show).not.toHaveBeenCalled()
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    test('an editor that lost its lock during the read gets no modal', async () => {
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      const show = jest.spyOn(wrapper.vm.$refs['modal-warning-changed-option'], 'show')
      await changeDomain(wrapper, 'coherence')
      wrapper.vm.isFindingReadOnly = true
      server.answer(0, { project: publicProject, lists: [completeList('list1')] })
      await flushPromises()
      expect(show).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    test('a clear that finishes after the editor closed opens nothing', async () => {
      const server = deferredServer()
      const wrapper = makeWrapper()
      const show = jest.spyOn(wrapper.vm.$refs['modal-warning-cleaning-cerqual'], 'show')
      const pending = wrapper.vm.clearMySelection('cerqual')
      wrapper.vm.modalOpen = false
      server.answer(0, { project: publicProject, lists: [completeList('list1')] })
      await pending
      expect(show).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    test('"do it later" that finishes after the editor closed does not save', async () => {
      const server = deferredServer()
      const wrapper = makeWrapper()
      const save = jest.spyOn(wrapper.vm, 'continueSavingDataModal').mockImplementation(() => {})
      wrapper.vm.selectedOptions.cerqual.explanation = ''
      const pending = wrapper.vm.closeWarningModalDoItLater()
      wrapper.vm.modalOpen = false
      server.answer(0, { project: { public_type: 'private' }, lists: [completeList('list1')] })
      await pending
      expect(save).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    test('a read started in a closed session does not act in the reopened one', async () => {
      LockService.acquireRef.mockResolvedValue({ success: true })
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      const show = jest.spyOn(wrapper.vm.$refs['modal-warning-changed-option'], 'show')
      await changeDomain(wrapper, 'coherence')
      wrapper.vm.onModalHidden()
      wrapper.vm.onModalShow()
      LockService.acquireRef.mockClear()
      server.answer(0, { project: publicProject, lists: [completeList('list1')] })
      await flushPromises()
      expect(show).not.toHaveBeenCalled()
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(wrapper.vm.changedOptionImpact).toBe('none')
      wrapper.destroy()
    })

    test('a hung read of the previous session does not disable Save in the new one', async () => {
      LockService.acquireRef.mockResolvedValue({ success: true })
      deferredServer() // never answered
      const wrapper = await twoDomainsOpen()
      const okDisabled = () => wrapper.find('#modal-evidence-profile-form').attributes('ok-disabled')
      await changeDomain(wrapper, 'coherence')
      expect(okDisabled()).toBe('true')
      wrapper.vm.onModalHidden()
      wrapper.vm.onModalShow()
      await wrapper.vm.$nextTick()
      expect(okDisabled()).toBeUndefined()
      wrapper.destroy()
    })

    test('a read of the previous session that settles late does not touch the new session pending count', async () => {
      LockService.acquireRef.mockResolvedValue({ success: true })
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      await changeDomain(wrapper, 'coherence')
      wrapper.vm.onModalHidden()
      wrapper.vm.onModalShow()
      await changeDomain(wrapper, 'adequacy') // a read of the new session, still pending
      server.answer(0, { project: publicProject, lists: [completeList('list1')] }) // the old one settles
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(wrapper.find('#modal-evidence-profile-form').attributes('ok-disabled')).toBe('true')
      wrapper.destroy()
    })

    test('Save is disabled while a read is pending', async () => {
      const server = deferredServer()
      const wrapper = await twoDomainsOpen()
      const okDisabled = () => wrapper.find('#modal-evidence-profile-form').attributes('ok-disabled')
      expect(okDisabled()).toBeUndefined()
      await changeDomain(wrapper, 'coherence')
      expect(okDisabled()).toBe('true')
      server.answer(0, { project: publicProject, lists: [completeList('list1')] })
      await flushPromises()
      await wrapper.vm.$nextTick()
      expect(okDisabled()).toBeUndefined()
      wrapper.destroy()
    })
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
