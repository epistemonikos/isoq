// El modal de EDICIÓN de columnas de no-CAMELOT pasa a los endpoints granulares.
//
// Antes cada operación mandaba `PATCH /<coleccion>/<id>` con el array `fields` completo, que
// es Last-Write-Wins: con una copia obsoleta se perdía la columna que otra persona acababa
// de crear. La UI no cambia (los mismos inputs, el mismo arrastre, los mismos botones de
// borrar); lo que cambia es cuándo y por dónde viaja cada cambio.
//
// Mismo modelo que el Paso 3 CAMELOT: alta y renombrado al salir del campo, borrado con
// confirmación, y el reorden acumulado hasta el cierre porque es la única operación
// conmutativa del conjunto.
//
// El lock se toma al primer cambio y no al abrir: quien sólo fue a mirar las columnas no
// debe bloquear a nadie. (El modal de CREACIÓN es al revés — ahí se entra a crear, así que
// toma el lock al abrir; eso va en su propio spec.)
// Este spec reemplaza a crudTables.columnsPayload.spec.js, retirado con la migración: aquel
// verificaba que el guardado en bloque no mandara `items[]`, un cuidado que dejó de tener
// sentido cuando ninguna operación manda ya el documento completo.
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

jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
  renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
  deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-creada'))
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
  { key: 'column_0', label: 'Contexto' },
  { key: 'column_1', label: 'Método' }
]

const ITEMS = [
  { ref_id: 'R1', authors: 'Smith 2020', column_0: 'texto A', column_1: 'texto B' }
]

function createWrapper (type = 'isoqf_characteristics') {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type,
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
}

// BootstrapVue instala $bvModal como propiedad read-only, así que `mocks` no lo reemplaza:
// hay que espiarlo sobre la instancia ya montada.
function espiarToast (wrapper) {
  wrapper.vm.$bvToast.toast = jest.fn()
  return wrapper.vm.$bvToast.toast
}

function espiarConfirm (wrapper, respuesta = true) {
  wrapper.vm.$bvModal.msgBoxConfirm = jest.fn(() => Promise.resolve(respuesta))
  return wrapper.vm.$bvModal.msgBoxConfirm
}

async function conTablaYColumnas (wrapper) {
  // El `getData()` del mounted es asíncrono y reasigna `dataTable`: sin esperarlo, pisa
  // este setData y el modal se queda sin columnas.
  await flushPromises()
  await wrapper.setData({
    dataTable: { id: 'tabla-1', fields: FIELDS, items: ITEMS },
    dataTableFieldsModalEdit: {
      fields: [{ key: 'column_0', label: 'Contexto' }, { key: 'column_1', label: 'Método' }],
      touched: [false, false],
      nroColumns: 2
    },
    committedColumnLabels: { column_0: 'Contexto', column_1: 'Método' }
  })
}

describe('crudTables — alta y renombrado de columna al salir del campo', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await conTablaYColumnas(wrapper)
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('renombra la columna que ya tiene clave', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Contexto del estudio'

    await wrapper.vm.onEditFieldBlur(0)

    expect(columnService.renameColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'tabla-1', 'column_0', 'Contexto del estudio')
  })

  it('crea la columna que todavía no tiene clave', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields.push({ label: 'Nueva' })

    await wrapper.vm.onEditFieldBlur(2)

    expect(columnService.addColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'tabla-1', 'Nueva')
  })

  it('guarda la clave devuelta para no volver a crearla', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields.push({ label: 'Nueva' })

    await wrapper.vm.onEditFieldBlur(2)
    await flushPromises()

    expect(wrapper.vm.dataTableFieldsModalEdit.fields[2].key).toBe('column_nueva')
  })

  it('no manda nada si el título quedó vacío', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields.push({ label: '   ' })

    await wrapper.vm.onEditFieldBlur(2)

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  it('no reenvía un título que no cambió', async () => {
    await wrapper.vm.onEditFieldBlur(0)

    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  // Lo que hacía perder columnas ajenas.
  it('nunca manda el documento completo por el PATCH genérico', async () => {
    const Api = require('@/utils/Api')
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'

    await wrapper.vm.onEditFieldBlur(0)

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('vale igual para isoqf_assessments, que usa el mismo componente', async () => {
    wrapper.destroy()
    wrapper = createWrapper('isoqf_assessments')
    await conTablaYColumnas(wrapper)
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'

    await wrapper.vm.onEditFieldBlur(0)

    expect(columnService.renameColumn)
      .toHaveBeenCalledWith('isoqf_assessments', 'tabla-1', 'column_0', 'Otro')
  })
})

describe('crudTables — borrado de columna con confirmación', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await conTablaYColumnas(wrapper)
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // El DELETE limpia esa clave en todas las filas del servidor, y sin botón de guardar el
  // clic es destructivo en el momento.
  it('pide confirmación y borra por clave', async () => {
    const confirmar = espiarConfirm(wrapper)

    await wrapper.vm.confirmDeleteColumnEdit(1)

    expect(confirmar).toHaveBeenCalled()
    expect(columnService.deleteColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'tabla-1', 'column_1')
  })

  it('no borra si el usuario cancela', async () => {
    espiarConfirm(wrapper, false)

    await wrapper.vm.confirmDeleteColumnEdit(1)

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.dataTableFieldsModalEdit.fields).toHaveLength(2)
  })

  it('quita la columna de la lista recién después de borrarla', async () => {
    espiarConfirm(wrapper)

    await wrapper.vm.confirmDeleteColumnEdit(1)
    await flushPromises()

    expect(wrapper.vm.dataTableFieldsModalEdit.fields.map(f => f.key)).toEqual(['column_0'])
  })

  it('una columna sin clave se descarta sin llamar al servidor', async () => {
    espiarConfirm(wrapper)
    wrapper.vm.dataTableFieldsModalEdit.fields.push({ label: 'sin guardar' })

    await wrapper.vm.confirmDeleteColumnEdit(2)

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.dataTableFieldsModalEdit.fields).toHaveLength(2)
  })
})

describe('crudTables — el reorden se manda al cerrar', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await conTablaYColumnas(wrapper)
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('arrastrar no dispara ningún request', () => {
    wrapper.vm.onColumnsOrderChanged()

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  it('al cerrar manda un solo request con el orden final', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields.reverse()
    wrapper.vm.onColumnsOrderChanged()
    wrapper.vm.onColumnsOrderChanged()

    await wrapper.vm.onColumnsEditModalHidden()

    expect(columnService.reorderColumns).toHaveBeenCalledTimes(1)
    expect(columnService.reorderColumns)
      .toHaveBeenCalledWith('isoqf_characteristics', 'tabla-1', ['column_1', 'column_0'])
  })

  it('no manda nada al cerrar si no se arrastró', async () => {
    await wrapper.vm.onColumnsEditModalHidden()

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  // Los campos de sistema no viajan en `order`: el backend los conserva en su slot y
  // devuelve 400 si los recibe.
  it('el orden no incluye ref_id ni authors', async () => {
    wrapper.vm.onColumnsOrderChanged()

    await wrapper.vm.onColumnsEditModalHidden()

    const order = columnService.reorderColumns.mock.calls[0][2]
    expect(order).not.toContain('ref_id')
    expect(order).not.toContain('authors')
  })
})

describe('crudTables — lock del documento de la tabla', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await conTablaYColumnas(wrapper)
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('toma <doc_id>::fields antes de la primera operación', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'

    await wrapper.vm.onEditFieldBlur(0)

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'tabla-1::fields')
  })

  it('no lo pide de nuevo en la segunda operación', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'
    await wrapper.vm.onEditFieldBlur(0)
    wrapper.vm.dataTableFieldsModalEdit.fields[1].label = 'Y otro'
    await wrapper.vm.onEditFieldBlur(1)

    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })

  it('no escribe si el lock lo tiene otra persona', async () => {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'

    await wrapper.vm.onEditFieldBlur(0)

    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  it('avisa quién tiene el bloqueo', async () => {
    const toast = espiarToast(wrapper)
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana Pérez' })
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'

    await wrapper.vm.onEditFieldBlur(0)

    expect(toast.mock.calls[0][0]).toContain('Ana Pérez')
  })

  it('lo suelta al cerrar el modal', async () => {
    wrapper.vm.dataTableFieldsModalEdit.fields[0].label = 'Otro'
    await wrapper.vm.onEditFieldBlur(0)

    await wrapper.vm.onColumnsEditModalHidden()

    expect(LockService.releaseRef).toHaveBeenCalledWith('tabla-1::fields')
  })

  it('no suelta nada si nunca lo tomó', async () => {
    await wrapper.vm.onColumnsEditModalHidden()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})
