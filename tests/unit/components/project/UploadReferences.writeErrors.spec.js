import { shallowMount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

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

let _lsStore = {}
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(key => _lsStore[key] !== undefined ? _lsStore[key] : null),
    setItem: jest.fn((key, val) => { _lsStore[key] = val }),
    removeItem: jest.fn(key => { delete _lsStore[key] }),
    clear: jest.fn(() => { _lsStore = {} })
  },
  configurable: true
})

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/x' } })
const offline = () => Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } })

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(UploadReferences, {
    localVue,
    propsData: { canEdit: true, references: [], lists: [] },
    mocks: { $t: (key) => key, $route: { params: { id: 'proj1', org_id: 'org1' } }, $notify },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
  wrapper.vm.$refs['file-input'] = { reset: jest.fn(), $el: {} }
  return { wrapper, $notify }
}

const lastLoading = (wrapper) => {
  const calls = wrapper.emitted('statusLoadReferences') || []
  return calls.length ? calls[calls.length - 1][0] : undefined
}

// Los tres caminos por los que entran referencias terminaban en `console.error`: la carga
// se apagaba y la persona se quedaba sin referencias y sin saber por qué.
describe('UploadReferences — si no se importan, lo dice', () => {
  beforeEach(() => { jest.clearAllMocks(); _lsStore = {} })

  it('archivo RIS', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(error500())
    await wrapper.vm.uploadRisFile(new File(['TY  - JOUR'], 'refs.ris'))
    await flushPromises()
    expect(lastLoading(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.references_import_error')
  })

  it('archivo o Epistemonikos: además borra el «Procesando…», que ya no está pasando', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ fileReferences: [{ title: 'T', authors: ['A'] }] })
    Api.post.mockRejectedValueOnce(error500())
    await wrapper.vm.saveReferences('')
    await flushPromises()
    expect(lastLoading(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.references_import_error')
    expect(wrapper.vm.uploadProgress).toBe('')
    // Lo elegido se conserva para reintentar.
    expect(wrapper.vm.fileReferences).toHaveLength(1)
  })

  it('PubMed', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ pubmed_requested: [{ title: 'T' }], pubmed_selected: [0] })
    Api.post.mockRejectedValueOnce(error500())
    await wrapper.vm.importReferences()
    await flushPromises()
    expect(lastLoading(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.references_import_error')
    expect(wrapper.vm.pubmed_selected).toEqual([0])
  })

  it('sin conexión no suma aviso: ya lo dio OfflineIndicator', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(offline())
    await wrapper.vm.uploadRisFile(new File(['TY  - JOUR'], 'refs.ris'))
    await flushPromises()
    expect($notify.error).not.toHaveBeenCalled()
  })
})

// Borrar una referencia que fallaba terminaba en `console.error`: la referencia seguía ahí y
// nadie decía por qué.
describe('UploadReferences — borrar una referencia que falla', () => {
  beforeEach(() => { jest.clearAllMocks(); _lsStore = {} })

  it('lo dice', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(error500())
    wrapper.vm.confirmRemoveReferenceById('ref1')
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.delete_error')
    expect(wrapper.emitted('CallGetReferences')).toBeFalsy()
  })

  it('sin conexión no suma aviso: ya lo dio OfflineIndicator', async () => {
    const { wrapper, $notify } = createWrapper()
    Api.post.mockRejectedValueOnce(offline())
    wrapper.vm.confirmRemoveReferenceById('ref1')
    await flushPromises()
    expect($notify.error).not.toHaveBeenCalled()
  })
})

