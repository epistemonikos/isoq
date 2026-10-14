import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'

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

function createWrapper () {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics', prefix: 'chars', canEdit: true, project: { is_public: false },
      references: [{ id: 'R1', authors: ['Smith, J'] }, { id: 'R2', authors: ['Zeta, P'] }],
      refs: [], lists: [], useCamelot: false
    },
    mocks: { $t: (k) => k, $route: { params: { id: 'proj1', org_id: 'org1' } } },
    stubs: { 'font-awesome-icon': true, videoHelp: true, BackToTop: true, draggable: true }
  })
}

const row = (refId, authors) => ({ ref_id: refId, authors, column_0: '' })

describe('crudTables — otra persona borró el estudio de la fila', () => {
  // Medido en navegador: el modal de edición se renderiza aunque esté cerrado, y el
  // índice de la fila seleccionada quedaba más allá del final. El render tiraba y la
  // tabla entera dejaba de repintarse, con la fila borrada todavía en pantalla.
  it('la fila seleccionada desaparece sin romper el render', async () => {
    const errors = jest.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({
      dataTable: { id: 't1', fields: [{ key: 'authors', label: 'A' }, { key: 'column_0', label: 'c0' }], items: [row('R1', 'Smith'), row('R2', 'Zeta')] }
    })
    wrapper.vm.dataTableFieldsModal.items = [row('R1', 'Smith'), row('R2', 'Zeta')]
    wrapper.vm.dataTableFieldsModal.selected_item_index = 1
    await wrapper.vm.$nextTick()

    wrapper.vm.dataTableFieldsModal.items = [row('R1', 'Smith')]
    await wrapper.vm.$nextTick()

    const renderErrors = errors.mock.calls.filter(c => String(c[0]).includes('Error in render'))
    expect(renderErrors).toEqual([])
    errors.mockRestore()
    wrapper.destroy()
  })

  it('cierra el editor de esa fila y descarta el guardado pendiente', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const hide = jest.fn()
    wrapper.vm.$refs['edit-content-dataTable'] = { hide, show: jest.fn() }
    const cancel = jest.fn()
    wrapper.vm.autoSaveDebounced = Object.assign(jest.fn(), { cancel })
    wrapper.vm.rowEditorOpen = true
    wrapper.vm.dataTableFieldsModal.editingRefId = 'R2'

    window.dispatchEvent(new CustomEvent('reference-deleted', { detail: { refId: 'R2', deletedBy: 'Ana', source: 'lock' } }))

    expect(hide).toHaveBeenCalled()
    expect(cancel).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('no toca el editor abierto sobre otro estudio', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    const hide = jest.fn()
    wrapper.vm.$refs['edit-content-dataTable'] = { hide, show: jest.fn() }
    wrapper.vm.rowEditorOpen = true
    wrapper.vm.dataTableFieldsModal.editingRefId = 'R1'

    window.dispatchEvent(new CustomEvent('reference-deleted', { detail: { refId: 'R2', deletedBy: 'Ana', source: 'lock' } }))

    expect(hide).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
