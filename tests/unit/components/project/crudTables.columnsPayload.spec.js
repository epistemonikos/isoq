// Las operaciones de COLUMNA no deben mandar `items[]`.
//
// Antes, cada guardado de columnas mandaba el documento entero. Como el frontend
// descarta de cada fila las claves `column_*` que no estén en su copia de `fields`
// (customFieldsHelper.js:52), una copia obsoleta borraba el contenido de la columna
// que otra persona acababa de crear, en TODAS las filas.
//
// El backend confirmó que `PATCH /api/<coleccion>/<id>` es un `$set` parcial de claves
// top-level: mandar sólo `{fields}` deja `items` intacto en la base
// (docs/respuesta-backend-columnas-paso3.md §1, con test del lado servidor). Así que la
// forma de no pisar filas ajenas es no mandarlas: si no viajan, no se pueden perder.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  filterDisplayFields: jest.fn(fields => fields)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const FIELDS = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_0', label: 'Contexto' },
  { key: 'column_1', label: 'Método' }
]

// Lo que se perdía: contenido real escrito por otra persona.
const ITEMS = [
  { ref_id: 'R1', authors: 'Smith 2020', column_0: 'texto de A', column_1: 'texto de B' },
  { ref_id: 'R2', authors: 'Doe 2021', column_0: 'más texto', column_1: 'y más' }
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
      $t: msg => msg,
      $route: { params: { id: 'project-123', org_id: 'org-456' } },
      $bvModal: { msgBoxConfirm: jest.fn(() => Promise.resolve(true)) }
    },
    stubs: {
      'font-awesome-icon': true,
      'videoHelp': true,
      'BackToTop': true,
      'draggable': true
    }
  })
}

/** Params del último PATCH a la colección de la tabla (no a una fila). */
function lastTablePatch () {
  const call = [...Api.patch.mock.calls].reverse()
    .find(c => !c[0].includes('/item/'))
  return call ? call[1] : null
}

describe('crudTables.vue — las operaciones de columna no mandan items[]', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  it('updateDataTableFields manda fields sin items', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModalEdit: {
        fields: [{ key: 'column_0', label: 'Contexto' }],
        touched: [false]
      }
    })

    await wrapper.vm.updateDataTableFields()

    const params = lastTablePatch()
    expect(params).not.toBeNull()
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(params).not.toHaveProperty('items')
  })

  it('deleteFieldFromCharsSudiesEdit manda fields sin items', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModalEdit: {
        fields: [{ key: 'column_0', label: 'Contexto' }, { key: 'column_1', label: 'Método' }],
        touched: [false, false]
      }
    })

    wrapper.vm.deleteFieldFromCharsSudiesEdit(1)

    const params = lastTablePatch()
    expect(params).not.toBeNull()
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(params).not.toHaveProperty('items')
  })

  // Este era el peor de los tres: reconstruía `items` desde las referencias con TODAS
  // las celdas vacías, así que no dependía de una carrera — vaciaba la tabla sin más.
  it('deleteFieldFromCharsSudies manda fields sin items', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método'],
        touched: [false, false],
        nroColumns: 2
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(1)

    const params = lastTablePatch()
    expect(params).not.toBeNull()
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(params).not.toHaveProperty('items')
  })

  // `dataTableFieldsModal.fields` guarda LABELS, no objetos: getData lo llena con
  // `f.label` (crudTables.vue:453) y el input del modal escribe strings por v-model
  // (:119). Sin este caso, un payload con `label: undefined` pasa igual — JSON.stringify
  // descarta la clave y las columnas llegan al servidor sin título.
  it('deleteFieldFromCharsSudies conserva el título de las columnas que quedan', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método'],
        touched: [false, false],
        nroColumns: 2
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(1)

    const params = lastTablePatch()
    expect(params.fields.find(f => f.key === 'column_0').label).toBe('Contexto')
  })

  it('vale igual para isoqf_assessments (Paso 4 no-CAMELOT usa el mismo componente)', async () => {
    wrapper.destroy()
    wrapper = createWrapper('isoqf_assessments')
    await wrapper.setData({
      dataTable: { id: 'table-9', fields: FIELDS, items: ITEMS },
      dataTableFieldsModalEdit: {
        fields: [{ key: 'column_0', label: 'Contexto' }],
        touched: [false]
      }
    })

    await wrapper.vm.updateDataTableFields()

    const params = lastTablePatch()
    expect(params).not.toBeNull()
    expect(params).not.toHaveProperty('items')
  })
})

describe('crudTables.vue — la creación del documento sí siembra las filas', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  // El POST crea el documento de la tabla: sin `items` la tabla nace sin filas y no
  // hay dónde escribir, porque acá b-table lee `dataTable.items` de la base (a
  // diferencia de CAMELOT, que hace left-join contra las referencias).
  it('saveDataTableFields manda items cuando el documento no existe todavía', async () => {
    await wrapper.setData({
      dataTable: {},
      dataTableFieldsModal: { fields: ['Contexto'], touched: [false], nroColumns: 1 }
    })

    await wrapper.vm.saveDataTableFields()

    expect(Api.post).toHaveBeenCalled()
    const params = Api.post.mock.calls[0][1]
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(params.items).toHaveLength(1)
    expect(params.items[0].ref_id).toBe('R1')
  })
})
