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
  parseReference: jest.fn((ref) => `Author-${ref.id || 'unknown'}`),
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
    methods: { getList: jest.fn() } // prevent mounted() complications
  })
}

// ─── helpers ────────────────────────────────────────────────────────────────

// 'actions' is NOT in excludedKeys, so it must NOT appear in the fields array or
// it would be counted as missing content for every item.
const fields3 = [
  { key: 'ref_id' }, { key: 'col_0' }, { key: 'col_1' }
]

// ─── non-Camelot ────────────────────────────────────────────────────────────

describe('editList.vue — filterItemsByReferences() · non-Camelot', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({ project: { use_camelot: false }, list: { fullreferences: [] } })
    jest.spyOn(wrapper.vm, 'parseReference').mockImplementation((ref) => `Author-${ref.id}`)
  })

  afterEach(() => wrapper.destroy())

  it('returns empty filteredItems and haveContent=0 when references is empty', () => {
    const { filteredItems, haveContent } = wrapper.vm.filterItemsByReferences([], [], fields3)
    expect(filteredItems).toHaveLength(0)
    expect(haveContent).toBe(0)
  })

  it('creates one item per reference even when no matching item exists', () => {
    const { filteredItems } = wrapper.vm.filterItemsByReferences([], ['ref1', 'ref2'], fields3)
    expect(filteredItems).toHaveLength(2)
    expect(filteredItems[0].ref_id).toBe('ref1')
    expect(filteredItems[1].ref_id).toBe('ref2')
  })

  it('does not increment haveContent when all field keys have content', () => {
    const items = [{ ref_id: 'r1', col_0: 'data', col_1: 'data' }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], fields3)
    expect(haveContent).toBe(0)
  })

  it('increments haveContent when a field key is empty string', () => {
    const items = [{ ref_id: 'r1', col_0: '', col_1: 'data' }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], fields3)
    expect(haveContent).toBe(1)
  })

  it('increments haveContent when a field key is undefined on the item', () => {
    const items = [{ ref_id: 'r1', col_1: 'data' }] // col_0 is missing
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], fields3)
    expect(haveContent).toBe(1)
  })

  it('counts haveContent for each field that is missing', () => {
    const items = [{ ref_id: 'r1', col_0: '', col_1: '' }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], fields3)
    expect(haveContent).toBe(2)
  })

  it('uses bibliographicRefs to set item.authors via parseReference', async () => {
    await wrapper.setData({
      list: {
        fullreferences: [{ id: 'r1', publication_year: '2020' }]
      }
    })
    const parseRef = jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Smith 2020')
    wrapper.vm.filterItemsByReferences([], ['r1'], fields3)
    expect(parseRef).toHaveBeenCalledWith(expect.objectContaining({ id: 'r1' }), true)
  })

  it('sets item.year from bibliographicRef.publication_year', async () => {
    await wrapper.setData({
      list: { fullreferences: [{ id: 'r1', publication_year: '2021' }] }
    })
    const { filteredItems } = wrapper.vm.filterItemsByReferences([], ['r1'], fields3)
    expect(filteredItems[0].year).toBe('2021')
  })

  it('applies parseReference fallback when bibRef not found but authors is an array', () => {
    const items = [{ ref_id: 'r1', authors: ['Smith', 'Jones'], col_0: 'x', col_1: 'x' }]
    const parseRef = jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Smith, Jones')
    const { filteredItems } = wrapper.vm.filterItemsByReferences(items, ['r1'], fields3)
    expect(parseRef).toHaveBeenCalled()
    expect(filteredItems[0].authors).toBe('Smith, Jones')
  })
})

// ─── Camelot ─────────────────────────────────────────────────────────────────

describe('editList.vue — filterItemsByReferences() · Camelot mode', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      project: { use_camelot: true },
      list: { fullreferences: [] },
      camelot: {
        categories: [{ key: 'research' }, { key: 'context' }],
        fields: [
          { key: 'research_extractedData' },
          { key: 'context_extractedData' },
          { key: 'custom_field' },
          { key: 'research_comments' }
        ]
      }
    })
    jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Author')
  })

  afterEach(() => wrapper.destroy())

  // camelotCharKeys = ['research_extractedData', 'context_extractedData']

  it('does not increment haveContent when all camelotCharKeys are present and non-empty', () => {
    const items = [{
      ref_id: 'r1',
      research_extractedData: 'val',
      context_extractedData: 'val'
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(0)
  })

  it('increments haveContent when a camelotCharKey is missing from the item', () => {
    const items = [{ ref_id: 'r1', research_extractedData: 'val' }] // context_extractedData missing
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(1)
  })

  it('increments haveContent when a camelotCharKey is empty string', () => {
    const items = [{
      ref_id: 'r1',
      research_extractedData: '',
      context_extractedData: 'val'
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(1)
  })

  it('increments haveContent when stages has a null option', () => {
    const items = [{
      ref_id: 'r1',
      stages: [{ options: [{ option: null }] }]
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBeGreaterThan(0)
  })

  it('increments haveContent when stages has an empty string option', () => {
    const items = [{
      ref_id: 'r1',
      stages: [{ options: [{ option: '' }] }]
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBeGreaterThan(0)
  })

  it('does not increment for stages when all options are filled', () => {
    const items = [{
      ref_id: 'r1',
      stages: [
        { options: [{ option: 'yes' }, { option: 'no' }] },
        { options: [{ option: 'maybe' }] }
      ]
    }]
    // stages present → does NOT check camelotCharKeys; only checks custom fields
    // item keys: ref_id (excluded), stages (excluded) → no custom empty fields
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(0)
  })

  it('increments haveContent for empty custom fields (not camelotCharKey, not _comments)', () => {
    const items = [{
      ref_id: 'r1',
      research_extractedData: 'val',
      context_extractedData: 'val',
      custom_field: ''  // empty custom field
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(1)
  })

  it('does not increment for fields ending in _comments', () => {
    const items = [{
      ref_id: 'r1',
      research_extractedData: 'val',
      context_extractedData: 'val',
      research_comments: ''  // _comments fields are ignored
    }]
    const { haveContent } = wrapper.vm.filterItemsByReferences(items, ['r1'], [])
    expect(haveContent).toBe(0)
  })
})
