import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn((ref) => `Author-${ref.id || ''}`),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

function createWrapper () {
  return shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
}

// ─── processExtractedData ────────────────────────────────────────────────────

describe('editList.vue — processExtractedData()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({ list: { references: ['r1', 'r2'], fullreferences: [] } })
  })

  afterEach(() => wrapper.destroy())

  it('does not change extracted_data when array is empty', () => {
    const before = wrapper.vm.extracted_data
    wrapper.vm.processExtractedData([])
    expect(wrapper.vm.extracted_data).toBe(before)
  })

  it('filters items to only those whose ref_id is in list.references', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'Smith', column_0: 'data' },
        { ref_id: 'r3', authors: 'Jones', column_0: 'data' }  // r3 not in references
      ]
    }])
    const ids = wrapper.vm.extracted_data.items.map(i => i.ref_id)
    expect(ids).toContain('r1')
    expect(ids).not.toContain('r3')
  })

  it('sets all display_warning to false when all column_0 are filled', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'A', column_0: 'filled' },
        { ref_id: 'r2', authors: 'B', column_0: 'filled' }
      ]
    }])
    expect(wrapper.vm.ui.coherence.display_warning).toBe(false)
    expect(wrapper.vm.ui.methodological_assessments.extracted_data.display_warning).toBe(false)
    expect(wrapper.vm.ui.adequacy.extracted_data.display_warning).toBe(false)
  })

  it('sets all display_warning to true when some column_0 are empty', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'A', column_0: '' },
        { ref_id: 'r2', authors: 'B', column_0: 'filled' }
      ]
    }])
    expect(wrapper.vm.ui.coherence.display_warning).toBe(true)
    expect(wrapper.vm.ui.methodological_assessments.extracted_data.display_warning).toBe(true)
    expect(wrapper.vm.ui.adequacy.extracted_data.display_warning).toBe(true)
  })

  it('builds fieldsObj excluding ref_id', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }, { key: 'actions' }],
      items: []
    }])
    const keys = wrapper.vm.extracted_data.fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).toContain('column_0')
  })

  it('builds mode_print_fieldsObj excluding ref_id and actions', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }, { key: 'actions' }],
      items: []
    }])
    const keys = wrapper.vm.mode_print_fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).not.toContain('actions')
    expect(keys).toContain('column_0')
  })
})

// ─── getStatus ───────────────────────────────────────────────────────────────

describe('editList.vue — getStatus()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('value=0 and variant="danger" when all options are null', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: null },
        coherence: { option: null },
        adequacy: { option: null },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(0)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('danger')
  })

  it('value=40 and variant="danger" when 2 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 1 },
        coherence: { option: 2 },
        adequacy: { option: null },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(40)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('danger')
  })

  it('value=60 and variant="warning" when 3 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 1 },
        coherence: { option: 2 },
        adequacy: { option: 0 },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(60)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('warning')
  })

  it('value=100 and variant="success" when all 5 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 0 },
        coherence: { option: 1 },
        adequacy: { option: 2 },
        relevance: { option: 3 },
        cerqual: { option: 0 }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(100)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('success')
  })

  it('each domain contributes exactly 20 to the value', async () => {
    for (let count = 1; count <= 5; count++) {
      const domains = ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']
      const ep = {}
      domains.forEach((d, i) => { ep[d] = { option: i < count ? 0 : null } })
      await wrapper.setData({ evidence_profile: [ep] })
      wrapper.vm.getStatus()
      expect(wrapper.vm.status_evidence_profile.value).toBe(count * 20)
    }
  })
})

// ─── getFinding ──────────────────────────────────────────────────────────────

describe('editList.vue — getFinding()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    jest.spyOn(wrapper.vm, 'updateMyData').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getStatus').mockImplementation(() => {})
  })

  afterEach(() => wrapper.destroy())

  it('does not modify findings when list.findings is empty', async () => {
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings).toBeNull()
  })

  it('sets findings from the first item in list.findings', async () => {
    const finding = {
      id: 'f1',
      evidence_profile: {
        methodological_limitations: { option: null, explanation: '' },
        coherence: { option: null, explanation: '' },
        adequacy: { option: null, explanation: '' },
        relevance: { option: null, explanation: '' },
        cerqual: { option: null, explanation: '' },
        references: []
      }
    }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 3, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings.id).toBe('f1')
  })

  it('sets findings.isoqf_id to list.sort', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 7, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings.isoqf_id).toBe(7)
  })

  it('sets evidence_profile[0].isoqf_id to list.sort', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 4, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.evidence_profile[0].isoqf_id).toBe(4)
  })

  it('syncs evidence_profile[0].references from list.references', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 1, references: ['r1', 'r2'] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.evidence_profile[0].references).toEqual(['r1', 'r2'])
  })

  it('restores buffer_modal_stage_two title and type when fromModal=true', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({
      list: { ...wrapper.vm.list, findings: [finding], sort: 1, references: [] },
      buffer_modal_stage_two: { ...wrapper.vm.buffer_modal_stage_two, title: 'My Title', type: 'adequacy' }
    })
    wrapper.vm.getFinding(true)
    expect(wrapper.vm.buffer_modal_stage_two.title).toBe('My Title')
    expect(wrapper.vm.buffer_modal_stage_two.type).toBe('adequacy')
  })

  it('always calls getStatus', async () => {
    const getStatusSpy = jest.spyOn(wrapper.vm, 'getStatus').mockImplementation(() => {})
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [], sort: 1, references: [] } })
    wrapper.vm.getFinding()
    expect(getStatusSpy).toHaveBeenCalled()
  })
})

// ─── getProject ──────────────────────────────────────────────────────────────

describe('editList.vue — getProject()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('copies list.project into this.project', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'proj1', name: 'My Project', use_camelot: true } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.id).toBe('proj1')
    expect(wrapper.vm.project.use_camelot).toBe(true)
  })

  it('adds inclusion="" when project does not have it', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', exclusion: 'E' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.inclusion).toBe('')
  })

  it('adds exclusion="" when project does not have it', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', inclusion: 'I' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.exclusion).toBe('')
  })

  it('preserves existing inclusion and exclusion values', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', inclusion: 'Adults', exclusion: 'Children' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.inclusion).toBe('Adults')
    expect(wrapper.vm.project.exclusion).toBe('Children')
  })
})

// ─── getCharsOfStudies ───────────────────────────────────────────────────────

describe('editList.vue — getCharsOfStudies()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      project: { use_camelot: false },
      list: { ...wrapper.vm.list, references: [], characteristics: [] }
    })
  })

  afterEach(() => wrapper.destroy())

  it('uses empty data when list.characteristics is empty', () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.characteristics_studies.items).toEqual([])
    expect(wrapper.vm.characteristics_studies.fields).toEqual([])
  })

  it('sets display_warning=true when fields.length < 3 (non-Camelot)', () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies() // characteristics is [], so fields=[] (length 0 < 3)
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    expect(wrapper.vm.ui.relevance.chars_of_studies.display_warning).toBe(true)
  })

  it('sets display_warning=false when fields >= 3 and haveContent=0', async () => {
    await wrapper.setData({
      list: {
        ...wrapper.vm.list,
        references: [],
        characteristics: [{
          fields: [{ key: 'ref_id' }, { key: 'col_0' }, { key: 'col_1' }, { key: 'actions' }],
          items: []
        }]
      }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
  })

  it('sets display_warning=true when haveContent > 0 regardless of fields count', async () => {
    await wrapper.setData({
      list: {
        ...wrapper.vm.list,
        references: [],
        characteristics: [{
          fields: [{ key: 'ref_id' }, { key: 'col_0' }, { key: 'col_1' }, { key: 'actions' }],
          items: []
        }]
      }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 2 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
  })

  it('sets the same warning value on both adequacy and relevance', async () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], characteristics: [{ fields: [{ key: 'ref_id' }, { key: 'c0' }, { key: 'c1' }, { key: 'c2' }], items: [] }] }
    })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning)
      .toBe(wrapper.vm.ui.relevance.chars_of_studies.display_warning)
  })
})

// ─── getMethAssessments ──────────────────────────────────────────────────────

describe('editList.vue — getMethAssessments()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      project: { use_camelot: false },
      list: { ...wrapper.vm.list, references: [], assessments: [] }
    })
  })

  afterEach(() => wrapper.destroy())

  it('sets display_warning=false when haveContent=0 and fields>=3', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'q0' }, { key: 'q1' }, { key: 'actions' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getMethAssessments()
    expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(false)
  })

  it('sets display_warning=true when haveContent > 0', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'q0' }, { key: 'q1' }, { key: 'actions' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 1 })
    wrapper.vm.getMethAssessments()
    expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(true)
  })

  it('builds fieldsObj excluding ref_id', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'question_1' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getMethAssessments()
    const keys = wrapper.vm.meth_assessments.fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).toContain('question_1')
  })
})
