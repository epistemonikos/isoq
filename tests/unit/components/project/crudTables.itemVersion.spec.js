import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@/utils/csvImporter', () => ({ parseTableRows: jest.fn(), parseCSVData: jest.fn() }))
jest.mock('@/utils/xlsxImporter', () => ({ parseXLSXData: jest.fn() }))
jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  filterDisplayFields: jest.fn(fields =>
    fields.filter(f => !['ref_id', 'authors', 'actions'].includes(f.key)))
}))
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * El contador de versión por ítem (`_v`) lo pone el servidor DENTRO de cada fila. Nunca
 * está en `fields`, que es el array de columnas: su siembra sólo pone `ref_id` y
 * `authors`, y las columnas entran de a una.
 *
 * Por eso todo camino que reconstruya la fila a partir de `fields` lo borra, y el
 * servidor —que acepta la escritura sin versión por compatibilidad— deja de comprobar la
 * frescura sin que nadie se entere. Estos tests fijan que no lo borremos.
 */
describe('crudTables.vue — el contador de versión por ítem', () => {
  let wrapper

  const mount = (props = {}) => shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: [],
      refs: [],
      lists: [],
      useCamelot: false,
      ...props
    },
    mocks: {
      $t: msg => msg,
      $route: { params: { id: 'project-123', org_id: 'org-456' } },
      $bvModal: { msgBoxConfirm: jest.fn(() => Promise.resolve(true)) }
    },
    stubs: {
      'font-awesome-icon': true,
      videoHelp: true,
      BackToTop: true,
      draggable: true
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = mount()
  })

  afterEach(() => wrapper && wrapper.destroy())

  const fields = [{ key: 'ref_id' }, { key: 'authors' }, { key: 'column_0' }]

  it('getCleanedItems conserva el `_v` que trae la fila del servidor', () => {
    const items = [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 3 }]

    const cleaned = wrapper.vm.getCleanedItems(items, fields)

    expect(cleaned[0]._v).toBe(3)
  })

  // `fields` describe las COLUMNAS, no la fila. Reconstruir la fila a partir de él borra
  // toda clave estructural que no sea columna: el contador de versión fue el primer
  // síntoma y `stages` —el árbol de las 10 evaluaciones de ajuste— es el segundo. Y este
  // resultado va a un PATCH del documento completo, así que la pérdida es de todas las
  // filas a la vez.
  it('getCleanedItems conserva el árbol de evaluaciones, que no es una columna', () => {
    const stages = [
      { key: 0, options: [{ option: 2, text: 'lo que evaluó alguien' }] },
      { key: 1, options: [{ option: null, text: '' }] }
    ]
    const items = [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', stages }]

    const cleaned = wrapper.vm.getCleanedItems(items, fields)

    expect(cleaned[0].stages).toEqual(stages)
  })

  it('getCleanedItems sigue descartando las columnas que ya no existen', () => {
    // Para lo que la función existe: una columna borrada deja su clave huérfana en las
    // filas, y eso es lo único que debe limpiar.
    const items = [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', column_9: 'huérfana' }]

    const cleaned = wrapper.vm.getCleanedItems(items, fields)

    expect('column_9' in cleaned[0]).toBe(false)
    expect(cleaned[0].column_0).toBe('x')
  })

  it('no reescribe el documento cuando las filas traen el árbol de evaluaciones', async () => {
    // La misma comparación que ya no se rompe con `_v` sí se rompía con `stages`: los
    // ítems limpiados perdían el árbol, así que difería siempre y el PATCH del documento
    // completo salía en cada montaje de la vista.
    Api.get.mockResolvedValueOnce({
      data: [{
        id: 'doc1',
        fields,
        items: [{
          ref_id: 'r1',
          authors: 'A 2020',
          column_0: 'x',
          stages: [{ key: 0, options: [{ option: null, text: '' }] }]
        }]
      }]
    })
    wrapper.setProps({ references: [{ id: 'r1', content: 'A 2020' }] })

    wrapper.vm.updateMyDataTables()
    await flush()

    expect(Api.patch).not.toHaveBeenCalled()
  })

  // La ruta genérica de documento completo NO comprueba versión: persiste los ítems tal
  // como llegan. Mandarle el contador que teníamos en memoria lo haría RETROCEDER en todas
  // las filas, y quien estuviera editando con la versión siguiente pasaría a chocar 409 en
  // cada tecleo sin más salida que recargar. El contador sólo tiene sentido en los PATCH
  // por fila, que son los que lo comprueban.
  it('no manda el contador de versión en el PATCH del documento completo', async () => {
    // Una columna declarada que la fila no trae fuerza la escritura: el relleno con vacío
    // cambia la huella, que es exactamente para lo que esa comparación existe.
    Api.get.mockResolvedValueOnce({
      data: [{
        id: 'doc1',
        fields: [...fields, { key: 'column_1' }],
        items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 7 }]
      }]
    })
    wrapper.setProps({ references: [{ id: 'r1', content: 'A 2020' }] })

    wrapper.vm.updateMyDataTables()
    await flush()

    expect(Api.patch).toHaveBeenCalled()
    const sent = Api.patch.mock.calls[0][1].items
    sent.forEach(item => expect('_v' in item).toBe(false))
  })

  // La siembra automática al montar tiene su `getData()` dentro del `.then`, así que si el
  // PATCH falla la tabla nunca se puebla: pantalla vacía y un rechazo sin manejar en la
  // consola. Importa ahora porque el backend va a cerrar esa ruta con un 405, y esta
  // colección es la primera de su lista.
  it('muestra la tabla aunque la siembra automática falle', async () => {
    Api.get.mockResolvedValueOnce({
      data: [{
        id: 'doc1',
        fields: [...fields, { key: 'column_1' }],
        items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x' }]
      }]
    })
    Api.patch.mockRejectedValueOnce({ response: { status: 405, data: {} } })
    wrapper.setProps({ references: [{ id: 'r1', content: 'A 2020' }] })

    wrapper.vm.updateMyDataTables()
    await flush()

    expect(Api.patch).toHaveBeenCalled()
    expect(wrapper.vm.dataTable.id).toBe('doc1')
    expect(wrapper.vm.dataTableSettings.isBusy).toBe(false)
  })

  it('no inventa un `_v` vacío en la fila que no lo tiene', () => {
    // Un `_v` no entero se rechaza con `400 invalid_version`: el servidor lo trata como
    // una expectativa mal formada, no como un dato ausente. Mandar `''` rompe el
    // guardado; omitir la clave es el camino tolerado.
    const items = [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x' }]

    const cleaned = wrapper.vm.getCleanedItems(items, fields)

    expect('_v' in cleaned[0]).toBe(false)
  })

  it('el auto-guardado se queda con la versión nueva que devuelve el servidor', async () => {
    // La fila que se envía es la misma que sigue en el modal, así que si el `_v` local no
    // avanza, el próximo guardado va con la versión anterior y recibe 409. Y el
    // auto-guardado es un debounce por tecleo: el segundo tecleo pausado ya choca.
    wrapper.setData({
      dataTable: { id: 'doc1', fields, items: [] },
      dataTableFieldsModal: {
        items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 3 }],
        selected_item_index: 0
      },
      isRowReadOnly: false
    })
    Api.patch.mockResolvedValueOnce({
      data: {
        id: 'doc1',
        fields,
        items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 4 }]
      }
    })

    await wrapper.vm.performAutoSave()

    expect(wrapper.vm.dataTableFieldsModal.items[0]._v).toBe(4)
  })

  it('no toca la fila local si el servidor no devuelve esa fila', async () => {
    wrapper.setData({
      dataTable: { id: 'doc1', fields, items: [] },
      dataTableFieldsModal: {
        items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 3 }],
        selected_item_index: 0
      },
      isRowReadOnly: false
    })
    Api.patch.mockResolvedValueOnce({ data: { id: 'doc1', fields, items: [] } })

    await wrapper.vm.performAutoSave()

    expect(wrapper.vm.dataTableFieldsModal.items[0]._v).toBe(3)
    expect(wrapper.vm.autoSaveStatus).toBe('saved')
  })

  describe('cuando el servidor rechaza el guardado por versión', () => {
    const openEditorOn = (refId) => wrapper.setData({
      dataTable: { id: 'doc1', fields, items: [] },
      dataTableFieldsModal: {
        items: [{ ref_id: refId, authors: 'A 2020', column_0: 'lo mío', _v: 2 }],
        selected_item_index: 0,
        editingRefId: refId
      },
      isRowReadOnly: false
    })

    const conflictOn = (refId) => window.dispatchEvent(new CustomEvent('item-version-conflict', {
      detail: {
        refId,
        expectedVersion: 2,
        currentVersion: 5,
        item: { ref_id: refId, authors: 'A 2020', column_0: 'lo del otro', _v: 5 },
        failedData: { ref_id: refId, column_0: 'lo mío', _v: 2 },
        source: 'live'
      }
    }))

    // Sin esto la persona sigue tecleando contra un guardado que ya no puede completarse:
    // el `_v` local quedó viejo, así que cada tecleo vuelve a chocar. El bucle no se corta
    // solo, y el único indicador es un ícono de error.
    it('deja de aceptar escritura en esa fila', async () => {
      await openEditorOn('r1')

      conflictOn('r1')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
    })

    // Encontrado en la puerta de navegador, no por los tests: el `.catch` del auto-guardado
    // corre DESPUÉS del handler del conflicto y volvía a poner el ícono de error. Quedaban
    // dos indicadores del mismo evento, y el genérico —«no se pudo guardar»— es el que menos
    // dice y el que sugiere reintentar, que acá no sirve.
    it('no deja el ícono de error del auto-guardado encima del cartel', async () => {
      await openEditorOn('r1')
      // El orden importa y es el del interceptor: el evento sale mientras la promesa se
      // rechaza, o sea ANTES de que el `.catch` del componente corra. Al revés el test pasa
      // sin probar nada.
      Api.patch.mockImplementation(() => {
        conflictOn('r1')
        return Promise.reject({
          config: { url: '/isoqf_characteristics/doc1/item/r1', method: 'patch' },
          response: {
            status: 409,
            data: { reason: 'version_conflict', current_version: 5, item: { ref_id: 'r1' } }
          }
        })
      })

      await wrapper.vm.performAutoSave()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.versionConflict).not.toBe(null)
      expect(wrapper.vm.autoSaveStatus).toBe(null)
    })

    it('guarda el valor ajeno para poder mostrarlo al lado del propio', async () => {
      await openEditorOn('r1')

      conflictOn('r1')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.versionConflict.item.column_0).toBe('lo del otro')
      expect(wrapper.vm.versionConflict.failedData.column_0).toBe('lo mío')
    })

    it('ignora el conflicto de una fila que no es la que se está editando', async () => {
      await openEditorOn('r1')

      conflictOn('otra-fila')
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.versionConflict).toBe(null)
    })

    it('vuelve a permitir la escritura cuando se recarga la fila', async () => {
      await openEditorOn('r1')
      conflictOn('r1')
      await wrapper.vm.$nextTick()

      wrapper.vm.reloadAfterVersionConflict()
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.versionConflict).toBe(null)
      expect(wrapper.vm.isRowReadOnly).toBe(false)
    })
  })

  it('el guardado explícito cancela el auto-guardado que quedó pendiente', async () => {
    // Dos PATCH por edición ya eran deuda conocida —el explícito no cancelaba el debounce—
    // pero eran idénticos y el segundo era inocuo. Con el contador de versión deja de
    // serlo: el primero avanza `_v` en el servidor y el segundo llega con la versión
    // anterior, así que cada guardado con click termina en 409.
    jest.useFakeTimers()
    try {
      wrapper.setData({
        dataTable: { id: 'doc1', fields, items: [] },
        dataTableFieldsModal: {
          items: [{ ref_id: 'r1', authors: 'A 2020', column_0: 'x', _v: 3 }],
          selected_item_index: 0
        },
        isRowReadOnly: false
      })

      wrapper.vm.onFieldInput()
      wrapper.vm.saveContentDataTable()
      jest.advanceTimersByTime(3000)

      expect(Api.patch).toHaveBeenCalledTimes(1)
    } finally {
      jest.useRealTimers()
    }
  })

  it('cambiar de fila descarta el auto-guardado pendiente de la anterior', async () => {
    // El auto-guardado lee la fila seleccionada cuando le toca correr, no cuando se
    // programó: si el índice ya cambió, escribe una fila que la persona no editó y cuyo
    // lock puede no estar adquirido todavía.
    jest.useFakeTimers()
    try {
      await wrapper.setData({
        dataTable: {
          id: 'doc1',
          fields,
          items: [
            { ref_id: 'r1', authors: 'A 2020', column_0: 'x' },
            { ref_id: 'r2', authors: 'B 2021', column_0: 'y' }
          ]
        },
        dataTableFieldsModal: { items: [], selected_item_index: 0, editingRefId: 'r1' },
        isRowReadOnly: false
      })
      wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn() }

      wrapper.vm.onFieldInput()
      wrapper.vm.addContentDataTable(1)
      jest.advanceTimersByTime(3000)

      expect(Api.patch).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it('no reescribe el documento cuando lo único que trae el servidor de más es el `_v`', async () => {
    // El PATCH de `updateMyDataTables` es de documento completo, por la ruta genérica:
    // sin lock y sin versión. Dispararlo en cada montaje —porque la comparación con las
    // filas limpiadas siempre difiere— pisa a quien esté editando, sin que nadie haya
    // tocado nada.
    // El `_v` va PRIMERO a propósito: nada garantiza en qué posición del documento lo
    // deja Mongo, y una comparación por `JSON.stringify` es sensible al orden de las
    // claves. Con el contador al final el test pasaría sin probar nada.
    Api.get.mockResolvedValueOnce({
      data: [{
        id: 'doc1',
        fields,
        items: [{ _v: 3, ref_id: 'r1', authors: 'A 2020', column_0: 'x' }]
      }]
    })
    wrapper.setProps({ references: [{ id: 'r1', content: 'A 2020' }] })

    wrapper.vm.updateMyDataTables()
    await flush()

    expect(Api.patch).not.toHaveBeenCalled()
  })
})
