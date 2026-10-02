// El modal de CREACIÓN de columnas de no-CAMELOT (el que pide "número de columnas").
//
// Se entra ahí a crear, no a mirar, así que **toma el lock al abrir**: si alguien está
// creando las columnas, el otro no puede entrar. Es al revés que el modal de edición, donde
// el lock se toma al primer cambio para no bloquear a quien sólo mira.
//
// Y como el lock necesita un documento que bloquear, abrir el modal resuelve el documento
// primero (creándolo si no existe). Así el segundo que abra ya encuentra la tabla y queda
// bloqueado, en vez de que los dos creen documentos en paralelo.
//
// La UI no cambia: el campo de cantidad, los inputs y su botón Guardar siguen igual. Lo que
// cambia es que cada columna viaja por su endpoint, y que el guardado es reintentable: lo ya
// creado se renombra en vez de duplicarse.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'

const columnService = require('@/services/columnService')
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
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/columnService', () => {
  let n = 0
  return {
    addColumn: jest.fn(() => Promise.resolve({ key: `column_creada_${++n}`, response: { data: {} } })),
    renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
    deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
    reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
    ensureTableDocument: jest.fn(() => Promise.resolve('tabla-creada'))
  }
})

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve())
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const REFERENCIAS = [
  { id: 'R1', authors: ['Smith, J'], publication_year: '2020' },
  { id: 'R2', authors: ['Doe, A'], publication_year: '2021' }
]

function createWrapper (type = 'isoqf_characteristics') {
  const wrapper = shallowMount(crudTables, {
    localVue,
    propsData: {
      type,
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: REFERENCIAS,
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
  // Los refs de b-modal no existen con shallowMount; el modal se abre por su lado.
  wrapper.vm.$refs['open-dataTable-modal'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('crudTables — el modal de creación bloquea al abrirse', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('resuelve el documento y toma su lock al abrir', async () => {
    await wrapper.vm.openModalDataTable()

    expect(columnService.ensureTableDocument)
      .toHaveBeenCalledWith('isoqf_characteristics', 'org1', 'proj1', expect.any(Object))
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'tabla-creada::fields')
  })

  // En no-CAMELOT `<b-table>` lee las filas de la base, así que la tabla tiene que nacer con
  // una fila por referencia o no hay dónde escribir.
  it('siembra una fila por referencia al crear el documento', async () => {
    await wrapper.vm.openModalDataTable()

    const opciones = columnService.ensureTableDocument.mock.calls[0][3]
    expect(opciones.items).toHaveLength(2)
    expect(opciones.items.map(i => i.ref_id)).toEqual(['R1', 'R2'])
    expect(opciones.items[0].authors).toBeTruthy()
  })

  it('no abre el modal si otra persona está creando las columnas', async () => {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })

    await wrapper.vm.openModalDataTable()

    expect(wrapper.vm.$refs['open-dataTable-modal'].show).not.toHaveBeenCalled()
  })

  it('abre el modal cuando consigue el lock', async () => {
    await wrapper.vm.openModalDataTable()

    expect(wrapper.vm.$refs['open-dataTable-modal'].show).toHaveBeenCalled()
  })

  it('suelta el lock al cerrar', async () => {
    await wrapper.vm.openModalDataTable()

    await wrapper.vm.onColumnsCreateModalHidden()

    expect(LockService.releaseRef).toHaveBeenCalledWith('tabla-creada::fields')
  })
})

describe('crudTables — guardar las columnas nuevas', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.openModalDataTable()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('crea una columna por cada título escrito', async () => {
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto', 'Método'], touched: [false, false], nroColumns: 2, keys: [] }
    })

    await wrapper.vm.saveDataTableFields()

    expect(columnService.addColumn).toHaveBeenCalledTimes(2)
    expect(columnService.addColumn).toHaveBeenCalledWith('isoqf_characteristics', 'tabla-creada', 'Contexto')
    expect(columnService.addColumn).toHaveBeenCalledWith('isoqf_characteristics', 'tabla-creada', 'Método')
  })

  it('ignora los títulos vacíos', async () => {
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto', '  '], touched: [false, false], nroColumns: 2, keys: [] }
    })

    await wrapper.vm.saveDataTableFields()

    expect(columnService.addColumn).toHaveBeenCalledTimes(1)
  })

  it('nunca manda el documento completo por el PATCH genérico', async () => {
    const Api = require('@/utils/Api')
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto'], touched: [false], nroColumns: 1, keys: [] }
    })

    await wrapper.vm.saveDataTableFields()

    expect(Api.patch).not.toHaveBeenCalled()
  })

  // Si el guardado falla a mitad de camino, reintentarlo no puede duplicar lo que ya se creó.
  it('un segundo guardado renombra lo ya creado en vez de duplicarlo', async () => {
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto'], touched: [false], nroColumns: 1, keys: [] }
    })

    await wrapper.vm.saveDataTableFields()
    await flushPromises()
    await wrapper.vm.saveDataTableFields()

    expect(columnService.addColumn).toHaveBeenCalledTimes(1)
    // La clave la puso el alta; lo que importa es que el segundo guardado la reutilice.
    const claveCreada = columnService.addColumn.mock.results[0].value
    expect(columnService.renameColumn).toHaveBeenCalledWith(
      'isoqf_characteristics', 'tabla-creada', (await claveCreada).key, 'Contexto')
  })

  it('vale igual para isoqf_assessments', async () => {
    wrapper.destroy()
    wrapper = createWrapper('isoqf_assessments')
    await flushPromises()
    await wrapper.vm.openModalDataTable()
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto'], touched: [false], nroColumns: 1, keys: [] }
    })

    await wrapper.vm.saveDataTableFields()

    expect(columnService.addColumn)
      .toHaveBeenCalledWith('isoqf_assessments', 'tabla-creada', 'Contexto')
  })
})

// Acá vivía el bug que motivaba crudTables.columnKeys.spec.js (retirado con esta migración):
// el borrado reconstruía `fields` regenerando las claves como `column_${posición}`, así que
// borrar la primera o una del medio dejaba cada columna restante mostrando el texto de su
// vecina, porque las filas guardan el contenido bajo la clave original. Con el DELETE por
// clave el problema no se puede reproducir: no hay nada que renumerar.
describe('crudTables — borrar una columna desde el modal de creación', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.openModalDataTable()
    // BootstrapVue instala $bvModal como read-only: hay que espiarlo ya montado.
    wrapper.vm.$bvModal.msgBoxConfirm = jest.fn(() => Promise.resolve(true))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('pide confirmación y borra por clave', async () => {
    await wrapper.setData({
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método'],
        keys: ['column_a', 'column_b'],
        touched: [false, false],
        nroColumns: 2
      }
    })

    await wrapper.vm.confirmDeleteColumnCreate(1)

    expect(wrapper.vm.$bvModal.msgBoxConfirm).toHaveBeenCalled()
    expect(columnService.deleteColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'tabla-creada', 'column_b')
  })

  it('no borra si el usuario cancela', async () => {
    wrapper.vm.$bvModal.msgBoxConfirm = jest.fn(() => Promise.resolve(false))
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto'], keys: ['column_a'], touched: [false], nroColumns: 1 }
    })

    await wrapper.vm.confirmDeleteColumnCreate(0)

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.dataTableFieldsModal.fields).toHaveLength(1)
  })

  it('quita el título y su clave de la lista al borrar', async () => {
    await wrapper.setData({
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método'],
        keys: ['column_a', 'column_b'],
        touched: [false, false],
        nroColumns: 2
      }
    })

    await wrapper.vm.confirmDeleteColumnCreate(0)
    await flushPromises()

    expect(wrapper.vm.dataTableFieldsModal.fields).toEqual(['Método'])
    expect(wrapper.vm.dataTableFieldsModal.keys).toEqual(['column_b'])
    expect(wrapper.vm.dataTableFieldsModal.nroColumns).toBe(1)
  })

  // Un título escrito que todavía no se guardó no existe en el servidor.
  it('un título sin clave se descarta sin llamar al servidor', async () => {
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Sin guardar'], keys: [null], touched: [false], nroColumns: 1 }
    })

    await wrapper.vm.confirmDeleteColumnCreate(0)

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.dataTableFieldsModal.fields).toHaveLength(0)
  })

  it('nunca manda el documento completo por el PATCH genérico', async () => {
    const Api = require('@/utils/Api')
    await wrapper.setData({
      dataTableFieldsModal: { fields: ['Contexto'], keys: ['column_a'], touched: [false], nroColumns: 1 }
    })

    await wrapper.vm.confirmDeleteColumnCreate(0)

    expect(Api.patch).not.toHaveBeenCalled()
  })
})
