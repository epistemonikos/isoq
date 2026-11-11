import { shallowMount } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))
jest.mock('@/utils/xlsxExporter', () => ({ exportTableToXLSX: jest.fn() }))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    fetchRefLocks: jest.fn().mockResolvedValue([]),
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn(),
    refLocks: new Map()
  }
}))

/**
 * Mismo reparto que en StepFour: la guarda local sólo frena el sondeo propio, y el de
 * `viewProject` recarga las referencias por encima. El componente reporta que hay un
 * editor abierto y el padre decide.
 */
describe('StepThree — avisa al padre que hay un editor abierto', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(StepThree, {
      propsData: {
        references: [{ id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'T' }],
        type: 'isoqf_characteristics',
        canEdit: true
      },
      mocks: {
        $t: (key) => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs: {
        'b-alert': true, 'b-button': true, 'b-table': true, 'b-modal': true,
        'font-awesome-icon': true, 'TableColumnFilter': true, 'ExportCSVButton': true,
        'ManageColumnsButton': true, 'ToggleConcernsButton': true,
        'EditReferenceModal': true, 'ColumnsModal': true
      }
    })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('emite editor-open al abrirse y al cerrarse el editor de un estudio', async () => {
    await wrapper.setData({ currentItem: { ref_id: 'ref1' } })
    expect(wrapper.emitted('editor-open').pop()).toEqual([true])

    wrapper.vm.onReferenceModalClosed()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('editor-open').pop()).toEqual([false])
  })

  it('el modal de columnas también cuenta', async () => {
    await wrapper.setData({ columnsModalOpen: true })

    expect(wrapper.emitted('editor-open').pop()).toEqual([true])
  })
})
