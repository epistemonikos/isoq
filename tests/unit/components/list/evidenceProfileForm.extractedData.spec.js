import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'

/**
 * One extracted data table for every panel (Megan: "Standardise the design of the extracted
 * data table to what is currently shown in Adequacy"). Adequacy had its own in-place editor
 * here; Methodological limitations and Coherence used the shared table, which opened a
 * modal. Now the shared table edits in place, and the three panels use it.
 */
const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const assessment = () => ({ option: null, explanation: '', notes: '' })
const modalData = type => ({
  type,
  title: 'Test finding',
  methodological_limitations: assessment(),
  coherence: assessment(),
  adequacy: assessment(),
  relevance: assessment(),
  cerqual: assessment()
})

// A stand-in for the shared table that keeps what the parent can call on it.
const TableStub = {
  name: 'editListExtractedData',
  props: ['extractedData', 'permission', 'mode', 'list', 'activeRefLocks', 'hideable'],
  methods: { cancelRowEdit: jest.fn() },
  template: '<div class="table-extracted-data-stub" />'
}

function createWrapper (type) {
  const wrapper = shallowMount(evidenceProfileForm, {
    localVue,
    propsData: {
      modalData: modalData(type),
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
      ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
      methAssessments: { items: [], fieldsObj: [] },
      findings: { id: 'finding1' },
      extractedData: { id: 'ed1', items: [{ ref_id: 'ref1', authors: 'Smith 2020', column_0: 'a' }], fieldsObj: [] },
      refsWithTitle: [],
      permission: true,
      evidenceProfile: [modalData(type)],
      selectOptions: [{ text: 'High' }, { text: 'Moderate' }, { text: 'Low' }, { text: 'Very Low' }],
      show: {},
      modePrintFieldObject: [],
      mode: 'edit',
      charsOfStudies: { items: [], fieldsObj: [] },
      project: { use_camelot: false, review_question: 'q', inclusion: 'i', exclusion: 'e' },
      activeRefLocks: [{ ref_id: 'ed1::ed::ref1', user_name: 'Ana' }]
    },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $store: { state: {} },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-modal': { template: '<div><slot /></div>' },
      'b-tabs': { template: '<div><slot /></div>' },
      'b-tab': { template: '<div><slot /></div>' },
      'table-extracted-data': TableStub
    }
  })
  wrapper.vm.$refs['modal-evidence-profile-form'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

let wrapper
afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
  TableStub.methods.cancelRowEdit.mockClear()
})

describe('evidenceProfileForm — the extracted data table of each panel', () => {
  it.each([
    ['methodological-limitations'],
    ['coherence'],
    ['adequacy']
  ])('%s uses the shared table, with the extracted data and the polled locks', async (type) => {
    wrapper = createWrapper(type)
    await flushPromises()

    const table = wrapper.findComponent(TableStub)
    expect(table.exists()).toBe(true)
    expect(table.props('extractedData').id).toBe('ed1')
    expect(table.props('activeRefLocks')).toEqual([{ ref_id: 'ed1::ed::ref1', user_name: 'Ana' }])
    // Hiding the section on the worksheet page does not empty the panel.
    expect(table.props('hideable')).toBe(false)
    // Adequacy's own copy of the table, and its editor, are gone.
    expect(wrapper.find('.extracted-data').exists()).toBe(false)
  })

  it('closing the panel closes an extracted data row left open, so its lock is given back', async () => {
    wrapper = createWrapper('adequacy')
    await flushPromises()

    wrapper.vm.onModalHidden()

    expect(TableStub.methods.cancelRowEdit).toHaveBeenCalled()
  })

  it('a panel without the table closes without complaint', async () => {
    wrapper = createWrapper('relevance')
    await flushPromises()

    expect(() => wrapper.vm.onModalHidden()).not.toThrow()
  })
})
