import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))
jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn(), renameColumn: jest.fn(), deleteColumn: jest.fn(), reorderColumns: jest.fn(),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-1'))
}))
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  probeRefLocks: jest.fn(() => Promise.resolve({ locks: [], reachable: true, enabled: false })),
  refLocks: new Map()
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } }, config: { method: 'get' } })

function createWrapper () {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics', prefix: 'chars', canEdit: true, project: { is_public: false },
      references: [{ id: 'R1', authors: ['Smith, J'], publication_year: '2020' }], refs: [], lists: [], useCamelot: false
    },
    mocks: { $t: (k) => k, $route: { params: { id: 'proj1', org_id: 'org1' } } },
    stubs: { 'font-awesome-icon': true, videoHelp: true, BackToTop: true, draggable: true }
  })
}

// La tabla del Paso 3/4 que no se pudo cargar se veía igual que una tabla sin columnas:
// invitaba a crearlas. Ahora dice que falló, con Reintentar, y no suma además el toast.
describe('crudTables — no se pudo cargar no es una tabla vacía', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  it('al montar, si falla: aviso con Reintentar, sin toast encima', async () => {
    Api.get.mockImplementation(() => Promise.reject(error500()))
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="table-load-error"]').exists()).toBe(true)
    expect(wrapper.emitted('print-errors')).toBeFalsy()
    wrapper.destroy()
  })

  it('Reintentar vuelve a cargar y, si sale bien, el aviso se va', async () => {
    Api.get.mockImplementation(() => Promise.reject(error500()))
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
    wrapper.find('[data-test="table-load-retry"]').trigger('click')
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="table-load-error"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('sin error no hay aviso', async () => {
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="table-load-error"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
