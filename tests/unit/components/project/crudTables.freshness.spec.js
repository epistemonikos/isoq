// Refresco entre usuarios en el flujo no-CAMELOT.
//
// Síntoma reportado: A edita columnas y cierra; B, que había quedado bloqueado, sigue
// editando y guarda. B ve los campos de A —cada guardado suyo recarga la tabla— pero A no
// ve los de B hasta refrescar la página o cambiar de pestaña.
//
// La causa era que `projectFreshnessMixin` estaba sólo en los componentes de CAMELOT
// (StepThree, StepFour) y `crudTables` no tenía ni el mixin ni ningún timer propio. El mixin
// ya resuelve esto: consulta `isoqf_projects.last_update` y recarga si cambió, postergando la
// recarga mientras haya un editor abierto para no descartar lo que se está escribiendo.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
const LockService = require('@/services/lockService')

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
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  getHeaders: jest.fn(() => ({}))
}))

jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
  renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
  deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-1'))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve())
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const FIELDS = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_0', label: 'Contexto' }
]

function createWrapper () {
  const wrapper = shallowMount(crudTables, {
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
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      'videoHelp': true,
      'BackToTop': true,
      'draggable': true
    }
  })
  wrapper.vm.$refs['open-dataTable-modal'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['open-dataTable-modal-edit'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('crudTables — las dos mitades que pide el mixin de frescura', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('recargar significa releer la tabla', () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})

    wrapper.vm.applyProjectRefresh()

    expect(getData).toHaveBeenCalled()
  })

  it('sin nada abierto, la recarga puede aplicarse', () => {
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })

  // Repintar la tabla debajo de alguien que está escribiendo le descarta el borrador.
  it('el editor de una fila cuenta como editor abierto', async () => {
    await wrapper.setData({ rowEditorOpen: true })

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })

  // `columnsLockHeld` no alcanza para esto: el modal puede estar abierto antes de haber
  // tomado el lock, y en esa ventana un refresco igual pisaría lo que se escribió.
  it('el modal de columnas cuenta como editor abierto, incluso sin lock tomado', async () => {
    await wrapper.setData({ columnsEditModalOpen: true, columnsLockHeld: false })

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })
})

describe('crudTables — el refresco espera a que se cierre el editor', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('cerrar el modal de edición aplica el refresco que quedó pendiente', async () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true, dataTable: { id: 'tabla-1', fields: FIELDS, items: [] } })

    await wrapper.vm.onColumnsEditModalHidden()

    expect(getData).toHaveBeenCalled()
    expect(wrapper.vm.pendingRefresh).toBe(false)
  })

  it('cerrar el modal de creación también lo aplica', async () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true })

    await wrapper.vm.onColumnsCreateModalHidden()

    expect(wrapper.vm.pendingRefresh).toBe(false)
    expect(getData).toHaveBeenCalled()
  })

  it('cerrar el editor de una fila también lo aplica', async () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true, rowEditorOpen: true })

    wrapper.vm.onEditModalHidden()
    await flushPromises()

    expect(wrapper.vm.pendingRefresh).toBe(false)
    expect(getData).toHaveBeenCalled()
  })

  it('marca el modal de columnas como cerrado al ocultarse', async () => {
    await wrapper.setData({ columnsEditModalOpen: true })

    await wrapper.vm.onColumnsEditModalHidden()

    expect(wrapper.vm.columnsEditModalOpen).toBe(false)
  })
})

describe('crudTables — abrir un modal trae primero el estado fresco', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // Sin esto, alguien puede abrir el modal con una copia vieja de `fields` y editar sobre
  // ella: el mismo problema que el refresco periódico resuelve entre ticks.
  it('el modal de edición refresca antes de copiar los campos', async () => {
    const orden = []
    jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => { orden.push('refresco') })
    await wrapper.setData({ dataTable: { id: 'tabla-1', fields: FIELDS, items: [] } })

    await wrapper.vm.openModalDataTableEdit()
    orden.push('modal-armado')

    expect(orden).toEqual(['refresco', 'modal-armado'])
    expect(wrapper.vm.columnsEditModalOpen).toBe(true)
  })

  it('el modal de creación refresca al abrirse', async () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})

    await wrapper.vm.openModalDataTable()

    expect(getData).toHaveBeenCalled()
    expect(wrapper.vm.columnsCreateModalOpen).toBe(true)
  })

  // El editor de una fila NO refresca al abrirse, a diferencia de los modales de columnas.
  // Se probó y se descartó: lo ataba a la red para poder abrirse, y obligaba a re-resolver la
  // fila porque el índice que recibe es posicional y la tabla se ordena por autores. El
  // guardado de una fila ya va por `/item/<ref_id>`, así que editar sobre una copia de unos
  // segundos atrás no puede pisar a nadie — lo que sí lo hacía era el array `fields` completo
  // de los modales de columnas, y ahí el refresco se quedó.
})

// Encontrado en el navegador: el modal se cerraba pero `columnsModalOpen` quedaba en true, y
// con él `hasOpenEditor()` devolvía true para siempre — el refresco periódico no volvía a
// aplicarse nunca, que es exactamente lo que vinimos a arreglar.
//
// La causa no era BootstrapVue: el evento llegaba. Era que el handler bajaba el flag al
// FINAL, después de dos `await` sin protección, así que un `releaseRef` que rechazara (lock
// ya expirado, error de red) abortaba el método y dejaba el estado mentido.
//
// Se arregla por los dos lados: el flag lo gobierna el v-model del modal (Vue lo sincroniza
// con la visibilidad real, sin depender de ningún handler), y el handler protege sus awaits.
describe('crudTables — el estado del modal no depende de que el handler termine bien', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('deja el modal marcado como cerrado aunque falle liberar el lock', async () => {
    LockService.releaseRef.mockRejectedValueOnce(new Error('el lock ya no existe'))
    await wrapper.setData({
      columnsEditModalOpen: true,
      columnsLockHeld: true,
      columnsLockRef: 'tabla-1::fields',
      dataTable: { id: 'tabla-1', fields: FIELDS, items: [] }
    })

    await wrapper.vm.onColumnsEditModalHidden()

    expect(wrapper.vm.columnsEditModalOpen).toBe(false)
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })

  it('tampoco deja el lock marcado como tomado si liberarlo falló', async () => {
    LockService.releaseRef.mockRejectedValueOnce(new Error('sin red'))
    await wrapper.setData({
      columnsEditModalOpen: true,
      columnsLockHeld: true,
      columnsLockRef: 'tabla-1::fields',
      dataTable: { id: 'tabla-1', fields: FIELDS, items: [] }
    })

    await wrapper.vm.onColumnsEditModalHidden()

    // El servidor lo expira por TTL; insistir con un lock que no se pudo soltar sólo
    // bloquearía las operaciones siguientes de este mismo usuario.
    expect(wrapper.vm.columnsLockHeld).toBe(false)
    expect(wrapper.vm.columnsLockRef).toBeNull()
  })

  it('el refresco pendiente se aplica igual si algo del cierre falló', async () => {
    const getData = jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})
    LockService.releaseRef.mockRejectedValueOnce(new Error('sin red'))
    await wrapper.setData({
      columnsEditModalOpen: true,
      columnsLockHeld: true,
      columnsLockRef: 'tabla-1::fields',
      pendingRefresh: true,
      dataTable: { id: 'tabla-1', fields: FIELDS, items: [] }
    })

    await wrapper.vm.onColumnsEditModalHidden()

    expect(getData).toHaveBeenCalled()
    expect(wrapper.vm.pendingRefresh).toBe(false)
  })

  it('lo mismo vale para el modal de creación', async () => {
    LockService.releaseRef.mockRejectedValueOnce(new Error('sin red'))
    await wrapper.setData({
      columnsCreateModalOpen: true,
      columnsLockHeld: true,
      columnsLockRef: 'tabla-1::fields'
    })

    await wrapper.vm.onColumnsCreateModalHidden()

    expect(wrapper.vm.columnsCreateModalOpen).toBe(false)
    expect(wrapper.vm.columnsLockHeld).toBe(false)
  })
})

// El `v-model` que ata el flag a la visibilidad se puso primero compartido entre los dos
// modales, y eso los abría SUPERPUESTOS: al ponerse en true, ambos se mostraban. Se vio en el
// navegador — los dos títulos encimados y los campos mezclados. De ahí un flag por modal.
describe('crudTables — los dos modales de columnas son independientes', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('abrir el de edición no abre el de creación', async () => {
    jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})
    await wrapper.setData({ dataTable: { id: 'tabla-1', fields: FIELDS, items: [] } })

    await wrapper.vm.openModalDataTableEdit()

    expect(wrapper.vm.columnsEditModalOpen).toBe(true)
    expect(wrapper.vm.columnsCreateModalOpen).toBe(false)
  })

  it('abrir el de creación no abre el de edición', async () => {
    jest.spyOn(wrapper.vm, 'getData').mockImplementation(() => {})

    await wrapper.vm.openModalDataTable()

    expect(wrapper.vm.columnsCreateModalOpen).toBe(true)
    expect(wrapper.vm.columnsEditModalOpen).toBe(false)
  })

  // Cualquiera de los dos abierto tiene que frenar el refresco.
  it('cada uno por su cuenta cuenta como editor abierto', async () => {
    await wrapper.setData({ columnsCreateModalOpen: true, columnsEditModalOpen: false })
    expect(wrapper.vm.hasOpenEditor()).toBe(true)

    await wrapper.setData({ columnsCreateModalOpen: false, columnsEditModalOpen: true })
    expect(wrapper.vm.hasOpenEditor()).toBe(true)

    await wrapper.setData({ columnsCreateModalOpen: false, columnsEditModalOpen: false })
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })
})
