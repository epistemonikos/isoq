import { shallowMount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// ─── localStorage mock ────────────────────────────────────────────────────────
// jsdom's localStorage is not spyable directly — replace with a jest mock
let _lsStore = {}
const localStorageMock = {
  getItem: jest.fn(key => _lsStore[key] !== undefined ? _lsStore[key] : null),
  setItem: jest.fn((key, val) => { _lsStore[key] = val }),
  removeItem: jest.fn(key => { delete _lsStore[key] }),
  clear: jest.fn(() => { _lsStore = {} })
}
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true })

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRis (fields) {
  return fields.join('\n') + '\nER  -\n'
}

function createWrapper () {
  return shallowMount(UploadReferences, {
    localVue,
    propsData: { canEdit: true, references: [], lists: [] },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
}

// ─── pre_references watcher (RIS parser) ─────────────────────────────────────

describe('UploadReferences.vue — pre_references watcher (RIS parser)', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('parses title (TI), author (AU) and year (PY) from a minimal RIS entry', async () => {
    const ris = makeRis(['TY  - JOUR', 'TI  - My Study Title', 'AU  - Smith, John', 'PY  - 2021'])
    wrapper.vm.pre_references = ris
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences).toHaveLength(1)
    expect(wrapper.vm.fileReferences[0].title).toBe('My Study Title')
    expect(wrapper.vm.fileReferences[0].authors).toContain('Smith, John')
    expect(wrapper.vm.fileReferences[0].publication_year).toBe('2021')
  })

  it('parses two references separated by ER tags', async () => {
    const ris = makeRis(['TI  - Study One', 'AU  - A']) + makeRis(['TI  - Study Two', 'AU  - B'])
    wrapper.vm.pre_references = ris
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences).toHaveLength(2)
    expect(wrapper.vm.fileReferences[0].title).toBe('Study One')
    expect(wrapper.vm.fileReferences[1].title).toBe('Study Two')
  })

  it('uses T1 as fallback when TI is absent', async () => {
    wrapper.vm.pre_references = makeRis(['TY  - JOUR', 'T1  - Fallback Title', 'AU  - Jones'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].title).toBe('Fallback Title')
  })

  it('prefers TI over T1 when both are present', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - Primary Title', 'T1  - Secondary Title'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].title).toBe('Primary Title')
    expect(wrapper.vm.fileReferences[0].title_1).toBe('Secondary Title')
  })

  it('extracts only the year from PY with full date format (2020/01/15)', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - Year Test', 'PY  - 2020/01/15'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].publication_year).toBe('2020')
  })

  it('accumulates multiple AU tags into an authors array', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - Multi', 'AU  - A', 'AU  - B', 'AU  - C'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].authors).toHaveLength(3)
  })

  it('resets fileReferences between successive parses (does not accumulate)', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - First']) + makeRis(['TI  - Second'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.fileReferences).toHaveLength(2)

    // Second parse with only 1 reference should not accumulate to 3
    wrapper.vm.pre_references = makeRis(['TI  - Only One'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.fileReferences).toHaveLength(1)
  })

  it('sets uploadProgress to empty string and returns early when data is blank', async () => {
    wrapper.vm.pre_references = '   \n  \n '
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.uploadProgress).toBe('')
    expect(wrapper.vm.fileReferences).toHaveLength(0)
  })

  it('resets fileReferences to [] when set to blank after a previous parse', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - Study One'])
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.fileReferences).toHaveLength(1)

    wrapper.vm.pre_references = ''
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.fileReferences).toHaveLength(0)
  })

  it('parses abstract (AB) into the abstract field', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - With Abstract', 'AB  - This is the abstract.'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].abstract).toBe('This is the abstract.')
  })

  it('parses DOI (DO) and URL (UR) fields', async () => {
    wrapper.vm.pre_references = makeRis(['TI  - DOI Test', 'DO  - 10.1234/test', 'UR  - https://example.com'])
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.fileReferences[0].doi).toBe('10.1234/test')
    expect(wrapper.vm.fileReferences[0].url).toBe('https://example.com')
  })
})

// ─── checkIncompleteOperations (called in created()) ─────────────────────────

describe('UploadReferences.vue — checkIncompleteOperations()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
  })

  it('showRestorePrompt stays false when localStorage has no saved progress', () => {
    // getItem returns null (default mock behavior)
    const w = createWrapper()
    expect(w.vm.showRestorePrompt).toBe(false)
    w.destroy()
  })

  it('sets showRestorePrompt=true and savedProgress when data is recent (<24h)', () => {
    const progress = { fileReferences: [{ title: 'Test' }], timestamp: Date.now() }
    _lsStore['reference-upload-progress'] = JSON.stringify(progress)

    const w = createWrapper()

    expect(w.vm.showRestorePrompt).toBe(true)
    expect(w.vm.savedProgress).toEqual(expect.objectContaining({ fileReferences: expect.any(Array) }))
    w.destroy()
  })

  it('removes expired data (>24h old) and leaves showRestorePrompt=false', () => {
    const old = { fileReferences: [], timestamp: Date.now() - 25 * 60 * 60 * 1000 }
    _lsStore['reference-upload-progress'] = JSON.stringify(old)

    const w = createWrapper()

    expect(w.vm.showRestorePrompt).toBe(false)
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('reference-upload-progress')
    w.destroy()
  })

  it('removes item and does not throw on invalid JSON in localStorage', () => {
    _lsStore['reference-upload-progress'] = '{ invalid json }'

    expect(() => createWrapper().destroy()).not.toThrow()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('reference-upload-progress')
  })
})

// ─── restoreSavedProgress / clearSavedProgress ────────────────────────────────

describe('UploadReferences.vue — restoreSavedProgress() / clearSavedProgress()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    _lsStore = {}
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('restoreSavedProgress copies fileReferences from savedProgress and hides the prompt', async () => {
    const refs = [{ title: 'Saved Study' }]
    await wrapper.setData({ savedProgress: { fileReferences: refs }, showRestorePrompt: true })

    wrapper.vm.restoreSavedProgress()

    expect(wrapper.vm.fileReferences).toEqual(refs)
    expect(wrapper.vm.showRestorePrompt).toBe(false)
  })

  it('restoreSavedProgress does nothing when savedProgress is null', () => {
    wrapper.vm.restoreSavedProgress()
    expect(wrapper.vm.fileReferences).toHaveLength(0)
    expect(wrapper.vm.showRestorePrompt).toBe(false)
  })

  it('clearSavedProgress removes localStorage key and hides the prompt', () => {
    wrapper.vm.showRestorePrompt = true

    wrapper.vm.clearSavedProgress()

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('reference-upload-progress')
    expect(wrapper.vm.showRestorePrompt).toBe(false)
  })
})
