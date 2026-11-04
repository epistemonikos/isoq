import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListEvidenceProfile from '@/components/list/editListEvidenceProfile.vue'
import { fetchPublicationState } from '@/utils/publicationState'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/utils/publicationState')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

const flush = () => new Promise(resolve => setTimeout(resolve, 0))
const warn = () => ({ display_warning: false })
const section = () => ({ ...warn(), chars_of_studies: warn(), extracted_data: warn() })
const UI_SHAPE = {
  methodological_limitations: section(),
  methodological_assessments: section(),
  coherence: section(),
  adequacy: section(),
  relevance: section(),
  cerqual: section()
}

const complete = id => ({ id, name: id, references: ['r1'], cerqual: { option: 1, explanation: 'x' } })
const publicProject = { id: 'proj1', public_type: 'fully' }

const Modal = {
  template: '<div class="modal-stub"><slot /></div>',
  methods: { show () {}, hide () {} }
}

function fullProfile () {
  const filled = { option: '1', explanation: 'texto', notes: '' }
  return [{
    displayNumber: 1,
    methodological_limitations: { ...filled },
    coherence: { ...filled },
    adequacy: { ...filled },
    relevance: { ...filled },
    cerqual: { ...filled },
    references: []
  }]
}

function createWrapper () {
  return mount(editListEvidenceProfile, {
    localVue,
    propsData: {
      evidenceProfile: fullProfile(),
      ui: UI_SHAPE,
      evidenceProfileTableSettings: { isBusy: false },
      references: [],
      mode: 'edit',
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: ['ref1'], cerqual: { option: null } },
      activeRefLocks: [],
      refsWithTitle: [],
      project: { id: 'proj1', organization: 'org1', is_public: true, review_question: 'q', inclusion: 'i', exclusion: 'e' },
      permission: true,
      selectOptions: [],
      levelConfidence: [],
      findings: { id: 'finding1' },
      methAssessments: { items: [] },
      extractedData: { id: 'ed1', fields: [], items: [] },
      modalData: {},
      charsOfStudies: { items: [] },
      show: { selected: ['ep'] },
      modePrintFieldObject: []
    },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $notify: { warning: jest.fn(), error: jest.fn(), success: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    },
    stubs: {
      videoHelp: true,
      'back-to-top': true,
      'b-modal': Modal,
      'evidence-profile-form': { name: 'evidence-profile-form', methods: { openModalEvidenceProfie () {} }, template: '<div />' },
      'font-awesome-icon': true
    }
  })
}

const text = (wrapper, id) => wrapper.find(`#${id}`).text()

async function removeAll (wrapper) {
  await wrapper.setData({ localReferences: [] })
  const event = { preventDefault: jest.fn() }
  wrapper.vm.checkReferencesBeforeSaving(event)
  await flush()
  await wrapper.vm.$nextTick()
  return event
}

describe('editListEvidenceProfile publication warnings when removing every reference', () => {
  beforeEach(() => jest.clearAllMocks())

  test('the revert warning shows when it is the last visible finding', async () => {
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1')] })
    const wrapper = createWrapper()
    const priv = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
    await removeAll(wrapper)
    expect(fetchPublicationState).toHaveBeenCalledWith('proj1')
    expect(priv).toHaveBeenCalled()
    expect(text(wrapper, 'modal-private-project-warning')).toContain('soqf_table.remove_all_revert')
    wrapper.destroy()
  })

  test('the finding-hidden warning shows when another finding stays visible, even if props say otherwise', async () => {
    fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1'), complete('list2')] })
    const wrapper = createWrapper()
    const priv = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
    const hidden = jest.spyOn(wrapper.vm.$refs['modal-no-references-warning'], 'show')
    await removeAll(wrapper)
    expect(hidden).toHaveBeenCalled()
    expect(priv).not.toHaveBeenCalled()
    expect(text(wrapper, 'modal-no-references-warning')).toContain('soqf_table.remove_all_unpublish')
    wrapper.destroy()
  })

  test('with nothing published it saves without warning', async () => {
    fetchPublicationState.mockResolvedValue({ project: { id: 'proj1', public_type: 'private' }, lists: [complete('list1')] })
    const wrapper = createWrapper()
    const save = jest.spyOn(wrapper.vm, 'saveReferencesList').mockImplementation(() => {})
    const priv = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
    const hidden = jest.spyOn(wrapper.vm.$refs['modal-no-references-warning'], 'show')
    await removeAll(wrapper)
    expect(save).toHaveBeenCalled()
    expect(priv).not.toHaveBeenCalled()
    expect(hidden).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
