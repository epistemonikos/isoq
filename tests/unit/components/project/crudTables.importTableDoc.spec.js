// El import de tabla decide entre reemplazar el documento y crearlo con la misma regla que
// el resto de la app: `resolveTableDoc`.
//
// Antes decidía mirando si había FILAS cargadas (`dataTable.items.length`), no si había
// documento. Las dos cosas no coinciden: un documento puede existir sin filas visibles
// (nació sin referencias, o `handleResponseData` descartó las que no tienen `ref_id` o
// `authors`), y si el GET de carga falló el componente se queda sin id aunque el documento
// exista. En los dos casos el import hacía un POST sin DELETE y el proyecto quedaba con dos
// documentos de tabla, que las lecturas (`data[0]` sin orden garantizado) alternan.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

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
  addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
  renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
  deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-creada'))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  probeRefLocks: jest.fn(() => Promise.resolve({ locks: [], reachable: true, enabled: false })),
  refLocks: new Map()
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const FIELDS = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_0', label: 'Contexto' }
]

function createWrapper () {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: [{ id: 'R1', authors: ['Smith, J'], publication_year: '2020' }],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      videoHelp: true,
      BackToTop: true,
      draggable: true
    }
  })
}

// Deja el componente con el archivo ya cargado y el `dataTable` que se le pase. Los mocks
// de Api se limpian DESPUÉS de montar: lo que se afirma es lo que hace el import, no la
// carga inicial.
async function conArchivoCargado (wrapper, dataTable) {
  await flushPromises()
  wrapper.vm.$refs['import-table-isoqf_characteristics'] = { show: jest.fn(), hide: jest.fn() }
  await wrapper.setData({
    dataTable,
    importDataTable: {
      error: null,
      fields: ['ref_id', 'authors', 'column_0'],
      items: [{ ref_id: 'R1', authors: 'Smith 2020', column_0: 'importado' }],
      fieldsObj: [{ key: 'authors', label: 'Author(s), Year' }]
    }
  })
  Api.get.mockClear()
  Api.post.mockClear()
  Api.delete.mockClear()
}

describe('crudTables — el import no parte la tabla en dos documentos', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('con documento conocido pero sin filas visibles, lo reemplaza en vez de sumar otro', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/tabla-1', undefined, { noQueue: true })
    expect(Api.post).toHaveBeenCalledTimes(1)
    // El id ya era conocido: no hace falta preguntarle al servidor antes de escribir. (El
    // GET que viene DESPUÉS es la recarga de la tabla, no una verificación.)
    const borrado = Api.delete.mock.invocationCallOrder[0]
    expect(Api.get.mock.invocationCallOrder.filter(orden => orden < borrado)).toEqual([])
  })

  it('sin id pero con documento en el servidor, reemplaza ESE documento', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { fields: [], items: [] })
    Api.get.mockImplementation(() => Promise.resolve({ data: [{ id: 'tabla-servidor' }] }))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/tabla-servidor', undefined, { noQueue: true })
    expect(Api.post).toHaveBeenCalledTimes(1)
  })

  it('si no puede averiguar si hay documento, no escribe nada y avisa', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { fields: [], items: [] })
    Api.get.mockImplementation(() => Promise.reject(new Error('Network Error')))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).not.toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    expect(wrapper.emitted('print-errors')).toBeTruthy()
    // El archivo sigue cargado: la persona puede reintentar sin volver a elegirlo.
    expect(wrapper.vm.importDataTable.items).toHaveLength(1)
  })

  it('sin documento en ningún lado, sólo crea', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { fields: [], items: [] })

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).not.toHaveBeenCalled()
    expect(Api.post).toHaveBeenCalledTimes(1)
    expect(Api.post.mock.calls[0][0]).toBe('/isoqf_characteristics/')
  })

  // Reemplazar la tabla entera no se puede diferir: reproducido más tarde, el DELETE pisa
  // lo que otra persona escribió mientras tanto, o da 404 y el POST que sigue duplica.
  it('pide que sus escrituras no se encolen', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/tabla-1', undefined, { noQueue: true })
    expect(Api.post).toHaveBeenCalledWith('/isoqf_characteristics/', expect.any(Object), { noQueue: true })
  })

  it('si el documento ya no existe al borrarlo, sigue y crea: era el reemplazo que se pedía', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.delete.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('404'), { response: { status: 404 } })))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledTimes(1)
    expect(wrapper.html()).not.toMatch(/import_modal\.save_(offline|failed|check_failed)/)
  })

  it('si la escritura falla, el archivo sigue cargado para reintentar', async () => {
    // Antes se limpiaba sin esperar el resultado. Con el DELETE hecho y el POST caído, la
    // persona se quedaba sin la tabla y sin el archivo.
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.post.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('offline'), { isOfflineError: true })))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.emitted('print-errors')).toBeTruthy()
    expect(wrapper.vm.importDataTable.items).toHaveLength(1)
  })

  it('si la escritura sale bien, limpia el archivo', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.vm.importDataTable.items).toHaveLength(0)
  })
})

// El aviso se afirma sobre el HTML, no sobre el estado ni el evento. `print-errors` termina
// en `Commons.printErrors`, que no muestra nada: un test que miraba la emisión pasó verde
// con la persona sin enterarse de que no se había guardado.
describe('crudTables — si el import no se guarda, lo dice en el modal', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  const offline = () => Object.assign(new Error('offline'), {
    isOfflineError: true, response: { status: 0, data: { offline: true } }
  })

  it('sin poder verificar el documento', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { fields: [], items: [] })
    Api.get.mockImplementation(() => Promise.reject(new Error('500')))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.html()).toContain('import_modal.save_check_failed')
  })

  it('sin conexión, con su propio texto: reintentar ahora no sirve', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.delete.mockImplementationOnce(() => Promise.reject(offline()))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.html()).toContain('import_modal.save_offline')
    expect(wrapper.html()).not.toContain('import_modal.save_failed')
  })

  it('con otro error del servidor', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.post.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('500'), { response: { status: 500 } })))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.html()).toContain('import_modal.save_failed')
  })

  it('con un 409 no agrega nada: el interceptor ya avisó quién tiene el proyecto', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.delete.mockImplementationOnce(() => Promise.reject(Object.assign(new Error('409'), { response: { status: 409 } })))

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.html()).not.toMatch(/import_modal\.save_(offline|failed|check_failed)/)
  })

  it('el reintento que sale bien borra el aviso', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper, { id: 'tabla-1', fields: FIELDS, items: [] })
    Api.delete.mockImplementationOnce(() => Promise.reject(offline()))
    await wrapper.vm.saveImportedData()
    await flushPromises()
    expect(wrapper.html()).toContain('import_modal.save_offline')

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(wrapper.html()).not.toContain('import_modal.save_offline')
  })
})
