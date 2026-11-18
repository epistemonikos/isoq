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

const deferred = () => { let resolve; const promise = new Promise(res => { resolve = res }); return { promise, resolve } }

// #393: closing "Add or Edit column headings" while a new column was being created
// released the fields lock under it; the create then got 409 lock_not_held and the
// column was lost. Closing now waits for it.
describe('crudTables — closing while a column is being created (#393)', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await conTablaYColumnas(wrapper)
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('releases the columns lock only after the column has been created', async () => {
    const add = deferred()
    columnService.addColumn.mockReturnValueOnce(add.promise)
    wrapper.vm.dataTableFieldsModalEdit.fields.unshift({ label: 'New' })
    wrapper.vm.dataTableFieldsModalEdit.touched.unshift(false)
    wrapper.vm.onEditFieldBlur(0)
    await flushPromises()

    const closing = wrapper.vm.onColumnsEditModalHidden()
    await flushPromises()
    expect(LockService.releaseRef).not.toHaveBeenCalled()

    add.resolve({ key: 'column_nueva', response: { data: {} } })
    await closing
    expect(LockService.releaseRef).toHaveBeenCalled()
    expect(columnService.addColumn.mock.invocationCallOrder[0])
      .toBeLessThan(LockService.releaseRef.mock.invocationCallOrder[0])
  })
})
