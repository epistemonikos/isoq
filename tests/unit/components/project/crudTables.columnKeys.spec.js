// Borrar una columna no debe RENUMERAR las claves de las que quedan.
//
// `deleteFieldFromCharsSudies` reconstruía `params.fields` como `column_${position}` a
// partir de la posición en el modal. Mientras se borra la ÚLTIMA columna eso coincide
// con las claves almacenadas y no se nota; al borrar una del medio (o la primera) cada
// columna restante queda apuntando a la clave de su vecina anterior, y como las filas
// guardan su contenido bajo la clave ORIGINAL, cada columna pasa a mostrar el texto de
// la de al lado.
//
// Las claves persistidas están en `dataTable.fields`, que es lo que hay que usar.
// `dataTableFieldsModal.fields` guarda sólo los LABELS (getData lo llena con `f.label`,
// crudTables.vue:453), así que el índice del modal se mapea contra
// filterDisplayFields(dataTable.fields), que excluye ref_id/authors/actions.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Tres columnas de usuario. Los labels no van en el mismo orden alfabético que las
// claves a propósito: si el código volviera a derivar la clave de la posición, el
// desajuste queda visible en el label.
const FIELDS = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_0', label: 'Contexto' },
  { key: 'column_1', label: 'Método' },
  { key: 'column_2', label: 'Resultados' }
]

const ITEMS = [
  { ref_id: 'R1', authors: 'Smith 2020', column_0: 'del contexto', column_1: 'del método', column_2: 'de resultados' }
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

function lastTablePatch () {
  const call = [...Api.patch.mock.calls].reverse()
    .find(c => !c[0].includes('/item/'))
  return call ? call[1] : null
}

describe('crudTables.vue — borrar una columna conserva las claves de las demás', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  // El caso que rompe: se borra la PRIMERA de tres.
  it('deleteFieldFromCharsSudies no renumera al borrar la primera columna', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método', 'Resultados'],
        touched: [false, false, false],
        nroColumns: 3
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(0)

    const params = lastTablePatch()
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_1', 'column_2'])
  })

  // La consecuencia visible del bug: cada columna mostraba el texto de su vecina, porque
  // la clave y el label quedaban desalineados.
  it('deleteFieldFromCharsSudies mantiene cada label con su clave original', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método', 'Resultados'],
        touched: [false, false, false],
        nroColumns: 3
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(0)

    const params = lastTablePatch()
    expect(params.fields.find(f => f.key === 'column_1').label).toBe('Método')
    expect(params.fields.find(f => f.key === 'column_2').label).toBe('Resultados')
  })

  it('deleteFieldFromCharsSudies no renumera al borrar una columna del medio', async () => {
    await wrapper.setData({
      dataTable: { id: 'table-1', fields: FIELDS, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método', 'Resultados'],
        touched: [false, false, false],
        nroColumns: 3
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(1)

    const params = lastTablePatch()
    expect(params.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0', 'column_2'])
    expect(params.fields.find(f => f.key === 'column_2').label).toBe('Resultados')
  })

  // Las claves almacenadas no siempre son `column_<n>`: el modal de CAMELOT genera
  // `column_<timestamp>_<random>` y la migración a los endpoints granulares va a generar
  // `column_<24 hex>`. Renumerar las destruía; ahora tienen que sobrevivir intactas.
  it('conserva claves que no son column_<n> secuencial', async () => {
    const mixed = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'column_1754170000000_42', label: 'Contexto' },
      { key: 'column_6a70ddb21596c69591a58d80', label: 'Método' }
    ]

    await wrapper.setData({
      dataTable: { id: 'table-1', fields: mixed, items: ITEMS },
      dataTableFieldsModal: {
        fields: ['Contexto', 'Método'],
        touched: [false, false],
        nroColumns: 2
      }
    })

    wrapper.vm.deleteFieldFromCharsSudies(0)

    const params = lastTablePatch()
    expect(params.fields.map(f => f.key))
      .toEqual(['ref_id', 'authors', 'column_6a70ddb21596c69591a58d80'])
  })
})
