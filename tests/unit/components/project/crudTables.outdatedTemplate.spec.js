// #329 — importar una plantilla de referencias que ya no están (Megan, test y producción,
// 2026-11-11): borró 3 estudios, agregó 1 desde PubMed e importó la plantilla vieja. Entraba
// sin aviso, con los 3 borrados y sin el nuevo. Ahora el modal la rechaza, dice por qué y
// ofrece la plantilla nueva.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import { parseXLSXData } from '@/utils/xlsxImporter'
import { exportAOAToXLSX } from '@/utils/xlsxExporter'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@/utils/xlsxImporter', () => ({ parseXLSXData: jest.fn() }))
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  getHeaders: jest.fn(() => ({}))
}))
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  probeRefLocks: jest.fn(() => Promise.resolve({ locks: [], reachable: true, enabled: false })),
  refLocks: new Map()
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const parsed = (rows) => ({
  error: null,
  fields: [{ key: 'ref_id', label: 'ID' }, { key: 'authors', label: 'Author' }, { key: 'column_0', label: 'Contexto' }],
  fieldsObj: [{ key: 'column_0', label: 'Contexto' }],
  items: rows
})

function createWrapper () {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'ch',
      canEdit: true,
      project: { is_public: false },
      references: [
        { id: 'R1', authors: ['Armstrong, A'], publication_year: '2020' },
        { id: 'NUEVO', authors: ['Pubmed, P'], publication_year: '2024' }
      ],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: (key, params) => (params ? `${key} ${JSON.stringify(params)}` : key),
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      videoHelp: true,
      BackToTop: true,
      draggable: true,
      // BButton es funcional: su stub no tiene `vm` ni reenvía el clic.
      BButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' }
    }
  })
}

const pick = (wrapper, rows) => {
  parseXLSXData.mockResolvedValueOnce(parsed(rows))
  return wrapper.vm.loadTableImportData({ target: { files: [{ name: 'plantilla.xlsx' }] } })
}

describe('crudTables — plantilla de referencias que ya no están (#329)', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('no la deja guardar y nombra los estudios que sobran y los que faltan', async () => {
    await pick(wrapper, [
      { ref_id: 'R1', authors: 'Armstrong 2020', column_0: 'a' },
      { ref_id: 'BORRADO', authors: 'Viejo 2019', column_0: 'b' }
    ])
    await wrapper.vm.$nextTick()

    const alert = wrapper.find('[data-test="import-outdated-template"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Viejo 2019')
    expect(alert.text()).toContain('Pubmed')
    // Guardar (en el `modal-footer`, que shallowMount no renderiza) se deshabilita sin filas.
    expect(wrapper.vm.importDataTable.items).toHaveLength(0)
    expect(wrapper.find('b-table-stub').exists()).toBe(false)
  })

  it('ofrece descargar la plantilla nueva desde el aviso', async () => {
    await pick(wrapper, [{ ref_id: 'BORRADO', authors: 'Viejo 2019' }])
    await wrapper.vm.$nextTick()

    wrapper.find('[data-test="import-outdated-template"]').find('button').trigger('click')
    await flushPromises()

    // La plantilla nueva: una fila por cada referencia ACTUAL.
    const [rows] = exportAOAToXLSX.mock.calls[0]
    expect(rows.slice(1).map(row => row[0])).toEqual(['R1', 'NUEVO'])
  })

  it('una plantilla al día se previsualiza y se puede guardar', async () => {
    await pick(wrapper, [
      { ref_id: 'NUEVO', authors: 'Pubmed 2024', column_0: 'b' },
      { ref_id: 'R1', authors: 'Armstrong 2020', column_0: 'a' }
    ])
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="import-outdated-template"]').exists()).toBe(false)
    expect(wrapper.find('b-table-stub').exists()).toBe(true)
  })

  it('elegir otro archivo o rechazar borra el aviso', async () => {
    wrapper.vm.$refs['import-file'] = { reset: jest.fn() }
    await pick(wrapper, [{ ref_id: 'BORRADO', authors: 'Viejo 2019' }])
    wrapper.vm.cleanVars()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-test="import-outdated-template"]').exists()).toBe(false)
  })
})
