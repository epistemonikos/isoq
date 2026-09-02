import { shallowMount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import Commons from '@/utils/commons'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/utils/commons', () => ({
  getAuthorsFormat: jest.fn(() => 'Smith J'),
  parseReference: jest.fn(() => 'Smith J 2020'),
  getLastName: jest.fn(a => a.split(',')[0])
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// ─── localStorage mock ────────────────────────────────────────────────────────
let _lsStore = {}
const localStorageMock = {
  getItem: jest.fn(key => _lsStore[key] !== undefined ? _lsStore[key] : null),
  setItem: jest.fn((key, val) => { _lsStore[key] = val }),
  removeItem: jest.fn(key => { delete _lsStore[key] }),
  clear: jest.fn(() => { _lsStore = {} })
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true })

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

function createWrapper (propsOverrides = {}) {
  return shallowMount(UploadReferences, {
    localVue,
    propsData: { canEdit: true, references: [], lists: [], ...propsOverrides },
    mocks: {
      $t: (key, params) => params ? `${key}:${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
}

// ─── findRelatedFindings ───────────────────────────────────────────────────────

describe('UploadReferences.vue — findRelatedFindings()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
  })

  it('returns undefined when refId is null', () => {
    wrapper = createWrapper()
    expect(wrapper.vm.findRelatedFindings(null)).toBeUndefined()
    wrapper.destroy()
  })

  it('returns findings_affected message using displayNumber, not sort or isoqf_id', () => {
    // sort, isoqf_id and displayNumber are three different values on purpose: reading
    // the wrong one must fail this assertion (per the plan's fixture constraint).
    wrapper = createWrapper({
      lists: [{ sort: 7, isoqf_id: 41, displayNumber: 3, raw_ref: [{ id: 'r1' }, { id: 'r2' }] }]
    })

    const result = wrapper.vm.findRelatedFindings('r1')

    expect(result).toContain('references.findings_affected')
    expect(result).toContain('#3')
    wrapper.destroy()
  })

  it('returns no_findings_affected message when ref is not in any list', () => {
    wrapper = createWrapper({
      lists: [{ sort: 9, isoqf_id: 12, displayNumber: 1, raw_ref: [{ id: 'other' }] }]
    })

    const result = wrapper.vm.findRelatedFindings('r99')
    expect(result).toBe('references.no_findings_affected')
    wrapper.destroy()
  })

  it('collects findings from multiple lists, each keyed by its own displayNumber', () => {
    wrapper = createWrapper({
      lists: [
        { sort: 5, isoqf_id: 50, displayNumber: 1, raw_ref: [{ id: 'r1' }] },
        { sort: 6, isoqf_id: 60, displayNumber: 2, raw_ref: [{ id: 'r1' }] }
      ]
    })

    const result = wrapper.vm.findRelatedFindings('r1')
    expect(result).toContain('#1')
    expect(result).toContain('#2')
    wrapper.destroy()
  })
})

// ─── removeAllReferences ──────────────────────────────────────────────────────

describe('UploadReferences.vue — removeAllReferences()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('no escribe las tablas al borrar todas las referencias', async () => {
    Api.post.mockResolvedValue({})

    wrapper.vm.removeAllReferences()
    await flushPromises()

    // El servidor quita las filas con su `$pull` al borrar la referencia; hacerlo también
    // desde acá reescribía el documento entero y pisaba la edición ajena.
    const escrituras = Api.patch.mock.calls.filter(c =>
      /isoqf_(characteristics|assessments|extracted_data)\/[^/]+$/.test(c[0]))
    expect(escrituras).toEqual([])
    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })

  it('emits CallGetProject on success', async () => {
    Api.post.mockResolvedValue({})

    wrapper.vm.removeAllReferences()
    await flushPromises()

    expect(wrapper.emitted('CallGetProject')).toBeTruthy()
  })

  it('sets appearMsgRemoveReferences=false on success', async () => {
    await wrapper.setData({ appearMsgRemoveReferences: true })
    Api.post.mockResolvedValue({})

    wrapper.vm.removeAllReferences()
    await flushPromises()

    expect(wrapper.vm.appearMsgRemoveReferences).toBe(false)
  })

  it('restores disableBtnRemoveAllRefs=false on API error', async () => {
    await wrapper.setData({ disableBtnRemoveAllRefs: true })
    Api.post.mockRejectedValue(new Error('Network error'))

    wrapper.vm.removeAllReferences()
    await flushPromises()

    expect(wrapper.vm.disableBtnRemoveAllRefs).toBe(false)
  })

  it('POSTs to batch-delete with the correct confirmation string', async () => {
    Api.post.mockResolvedValue({})

    wrapper.vm.removeAllReferences()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_references/batch-delete',
      expect.objectContaining({
        delete_all: true,
        project_id: 'proj1',
        confirmation: 'DELETE_ALL_REFERENCES_proj1'
      })
    )
  })
})

// ─── confirmRemoveReferenceById ───────────────────────────────────────────────

describe('UploadReferences.vue — confirmRemoveReferenceById()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper({ references: [] })
  })

  afterEach(() => wrapper.destroy())

  it('returns early without API call when refId is falsy', async () => {
    wrapper.vm.confirmRemoveReferenceById(null)
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('POSTs to batch-delete with the correct refId', async () => {
    Api.post.mockResolvedValue({})

    wrapper.vm.confirmRemoveReferenceById('r1')
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_references/batch-delete',
      expect.objectContaining({ reference_ids: ['r1'] })
    )
  })

  it('no escribe las tablas al borrar una referencia', async () => {
    jest.spyOn(wrapper.vm, 'references', 'get').mockReturnValue([{ id: 'r1' }, { id: 'r2' }])
    Api.post.mockResolvedValue({})

    wrapper.vm.confirmRemoveReferenceById('r1')
    await flushPromises()

    const escrituras = Api.patch.mock.calls.filter(c =>
      /isoqf_(characteristics|assessments|extracted_data)\/[^/]+$/.test(c[0]))
    expect(escrituras).toEqual([])
  })

  it('emits CallGetReferences on success', async () => {
    Api.post.mockResolvedValue({})

    wrapper.vm.confirmRemoveReferenceById('r1')
    await flushPromises()

    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })
})

// ─── importReferences ─────────────────────────────────────────────────────────

describe('UploadReferences.vue — importReferences()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('returns early without API call when pubmed_selected is empty', async () => {
    await wrapper.setData({ pubmed_selected: [] })

    await wrapper.vm.importReferences()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('POSTs batch-import with selected references', async () => {
    const refs = [
      { title: 'Study A', uid: '111', disabled: false },
      { title: 'Study B', uid: '222', disabled: false }
    ]
    await wrapper.setData({ pubmed_requested: refs, pubmed_selected: [0, 1] })
    Api.post.mockResolvedValue({ data: { references: [] } })

    await wrapper.vm.importReferences()

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_references/batch-import',
      expect.objectContaining({
        references: expect.arrayContaining([
          expect.objectContaining({ title: 'Study A' })
        ])
      })
    )
  })

  it('strips "disabled" property from refs before import', async () => {
    const refs = [{ title: 'Study A', uid: '111', disabled: true }]
    await wrapper.setData({ pubmed_requested: refs, pubmed_selected: [0] })
    Api.post.mockResolvedValue({ data: { references: [] } })

    await wrapper.vm.importReferences()

    const sentRefs = Api.post.mock.calls[0][1].references
    expect(sentRefs[0].disabled).toBeUndefined()
  })

  it('clears pubmed_selected and emits CallGetReferences on success', async () => {
    await wrapper.setData({
      pubmed_requested: [{ title: 'Study A', uid: '111' }],
      pubmed_selected: [0]
    })
    Api.post.mockResolvedValue({ data: {} })

    await wrapper.vm.importReferences()

    expect(wrapper.vm.pubmed_selected).toHaveLength(0)
    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })

  it('no falla cuando la respuesta del import no trae `references`', async () => {
    await wrapper.setData({
      pubmed_requested: [{ title: 'Study A', uid: '111' }],
      pubmed_selected: [0]
    })
    Api.post.mockResolvedValue({ data: {} }) // no references key

    await wrapper.vm.importReferences()

    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })
})

// ─── saveReferences (client-parsed refs → batch-import) ────────────────────────

describe('UploadReferences.vue — saveReferences() batch import', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper({ references: [{ id: 'existing1', title: 'Existing' }] })
  })

  // A non-empty fileReferences enables the tooltip'd upload button, which trips a known
  // bootstrap-vue tooltip teardown bug under jsdom; guard destroy so it can't mask assertions.
  afterEach(() => { try { wrapper.destroy() } catch (e) { /* jsdom tooltip teardown */ } })

  it('POSTs once to batch-import with all parsed references (no per-ref POST)', async () => {
    await wrapper.setData({ fileReferences: [{ title: 'A' }, { title: 'B' }, { title: 'C' }] })
    Api.post.mockResolvedValue({ data: { references: [] } })

    await wrapper.vm.saveReferences()

    const importCalls = Api.post.mock.calls.filter(c => c[0] === '/isoqf_references/batch-import')
    const perRefCalls = Api.post.mock.calls.filter(c => c[0].startsWith('/isoqf_references?'))
    expect(importCalls).toHaveLength(1)
    expect(perRefCalls).toHaveLength(0)
    expect(importCalls[0][1]).toEqual(expect.objectContaining({
      references: expect.arrayContaining([
        expect.objectContaining({ title: 'A' }),
        expect.objectContaining({ title: 'C' })
      ]),
      organization: 'org1',
      project_id: 'proj1',
      operation_id: expect.any(String)
    }))
  })

  // Antes el import sembraba las filas de las tablas de los Pasos 3 y 4 con viejas + nuevas,
  // reescribiendo el documento completo. Ahora las filas se derivan al mostrar, así que
  // importar referencias no escribe esas tablas.
  it('no escribe las tablas al importar referencias', async () => {
    await wrapper.setData({ fileReferences: [{ title: 'A' }] })
    Api.post.mockResolvedValue({ data: { references: [{ id: 'new1', title: 'A' }] } })

    await wrapper.vm.saveReferences()

    const escrituras = Api.patch.mock.calls.filter(c =>
      /isoqf_(characteristics|assessments|extracted_data)\/[^/]+$/.test(c[0]))
    expect(escrituras).toEqual([])
    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })

  it('clears fileReferences and emits CallGetReferences on success', async () => {
    await wrapper.setData({ fileReferences: [{ title: 'A' }] })
    Api.post.mockResolvedValue({ data: { references: [{ id: 'new1', title: 'A' }] } })

    await wrapper.vm.saveReferences()

    expect(wrapper.vm.fileReferences).toEqual([])
    expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
  })
})

// ─── PubmedRequestClean ───────────────────────────────────────────────────────

describe('UploadReferences.vue — PubmedRequestClean()', () => {
  it('resets all PubMed state properties to their initial values', async () => {
    const wrapper = createWrapper()
    jest.clearAllMocks()
    _lsStore = {}
    await wrapper.setData({
      btnSearchPubMed: true,
      pubmed_request: 'some pmids',
      pubmed_requested: [{ title: 'Study' }],
      pubmed_selected: [0],
      pubmedErrorImported: ['bad-id'],
      pubmed_loading: true,
      pubmed_error: true
    })

    wrapper.vm.PubmedRequestClean()

    expect(wrapper.vm.btnSearchPubMed).toBe(false)
    expect(wrapper.vm.pubmed_request).toBe('')
    expect(wrapper.vm.pubmed_requested).toHaveLength(0)
    expect(wrapper.vm.pubmed_selected).toHaveLength(0)
    expect(wrapper.vm.pubmedErrorImported).toHaveLength(0)
    expect(wrapper.vm.pubmed_loading).toBe(false)
    expect(wrapper.vm.pubmed_error).toBe(false)
    wrapper.destroy()
  })
})

// ─── parseReference (component method) ───────────────────────────────────────

describe('UploadReferences.vue — parseReference() (component method)', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('returns formatted author + year string when authors are present', () => {
    Commons.getAuthorsFormat.mockReturnValue('Smith J')
    const ref = { authors: ['Smith, John'], publication_year: '2020', title: 'Some Title' }

    const result = wrapper.vm.parseReference(ref, true)

    expect(result).toContain('Smith J')
    expect(result).toContain('2020')
  })

  it('returns empty string when reference has no authors property', () => {
    const ref = { title: 'No Authors' }
    expect(wrapper.vm.parseReference(ref, true)).toBe('')
  })

  it('includes title when onlyAuthors=false', () => {
    Commons.getAuthorsFormat.mockReturnValue('Smith J')
    const ref = { authors: ['Smith'], publication_year: '2020', title: 'The Title' }

    const result = wrapper.vm.parseReference(ref, false)

    expect(result).toContain('The Title')
  })
})

// ─── getProject ───────────────────────────────────────────────────────────────

describe('UploadReferences.vue — getProject()', () => {
  it('emits CallGetProject event', () => {
    const wrapper = createWrapper()
    jest.clearAllMocks()
    wrapper.vm.getProject()
    expect(wrapper.emitted('CallGetProject')).toBeTruthy()
    wrapper.destroy()
  })
})

// ─── generateOperationId ──────────────────────────────────────────────────────

describe('UploadReferences.vue — generateOperationId()', () => {
  it('returns a non-empty string', () => {
    const wrapper = createWrapper()
    const id = wrapper.vm.generateOperationId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
    wrapper.destroy()
  })

  it('returns different IDs on successive calls', () => {
    const wrapper = createWrapper()
    const id1 = wrapper.vm.generateOperationId()
    const id2 = wrapper.vm.generateOperationId()
    expect(id1).not.toBe(id2)
    wrapper.destroy()
  })
})

// ─── storeProgress ────────────────────────────────────────────────────────────

describe('UploadReferences.vue — storeProgress()', () => {
  it('writes fileReferences to localStorage under the correct key', async () => {
    const wrapper = createWrapper()
    jest.clearAllMocks()
    _lsStore = {}
    await wrapper.setData({ fileReferences: [{ title: 'Study A' }] })

    wrapper.vm.storeProgress()

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'reference-upload-progress',
      expect.stringContaining('Study A')
    )
    wrapper.destroy()
  })
})

// ─── translatedReferencesTableFields (computed) ───────────────────────────────

describe('UploadReferences.vue — translatedReferencesTableFields (computed)', () => {
  it('returns an array with 5 field definitions including the correct keys', () => {
    const wrapper = createWrapper()
    const fields = wrapper.vm.translatedReferencesTableFields
    const keys = fields.map(f => f.key)

    expect(keys).toContain('authors')
    expect(keys).toContain('title')
    expect(keys).toContain('publication_year')
    expect(keys).toContain('id')
    expect(keys).toContain('action')
    expect(fields).toHaveLength(5)
    wrapper.destroy()
  })

  it('numbers the "related to findings" column using displayNumber, not sort/isoqf_id/cnt', () => {
    // sort, isoqf_id and displayNumber are three different values on purpose.
    const wrapper = createWrapper({
      lists: [
        { sort: 8, isoqf_id: 44, displayNumber: 2, raw_ref: [{ id: 'refA' }] }
      ]
    })
    const idField = wrapper.vm.translatedReferencesTableFields.find(f => f.key === 'id')

    const result = idField.formatter('refA')

    expect(result).toBe('#2')
    wrapper.destroy()
  })
})
