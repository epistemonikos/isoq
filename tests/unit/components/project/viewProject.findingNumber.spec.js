import { shallowMount } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import Api from '@/utils/Api'

// saveSortedLists() no retorna su Promise.all interno, así que un simple
// `await wrapper.vm.saveSortedLists()` no espera nada: la llamada resuelve
// de inmediato con undefined y el assert corre antes de que la cadena de
// promesas (patch → then → get → then → patch) tenga oportunidad de avanzar.
// Con este flush (mismo patrón que viewProject.lists.spec.js) se drenan los
// microtasks pendientes de verdad.
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const flushDeep = async () => { await flushPromises(); await flushPromises(); await flushPromises() }

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

describe('viewProject — no se escribe más el espejo isoqf_id', () => {
  const L1 = '66b1ff0000000000000000a1'
  const L2 = '66b1ff0000000000000000a2'
  // Findings reales que el viejo updateFindingSort() habría encontrado vía
  // GET /isoqf_findings?list_id=<L1|L2>. Sin esto, un mock plano {data: []}
  // hace que reponse.data[0].id reviente ANTES de llegar al PATCH que
  // queremos probar que ya no ocurre — ver nota en el reporte del task 7.
  const FINDING_1 = '66b1ff0000000000000000b1'
  const FINDING_2 = '66b1ff0000000000000000b2'

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation((url, params) => {
      if (String(url).includes('isoqf_findings')) {
        const listId = params && params.list_id
        const findingId = listId === L2 ? FINDING_2 : FINDING_1
        return Promise.resolve({ data: [{ id: findingId, list_id: listId }] })
      }
      return Promise.resolve({ data: [] })
    })
  })

  it('saveSortedLists hace N escrituras, no 2N, y ninguna a isoqf_findings', async () => {
    const wrapper = shallowMount(viewProject, {
      mocks: {
        $t: (k) => k,
        $route: { params: { id: '66b1ff000000000000000001', org_id: '66b1ff000000000000000002' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { id: 1, personal_organization: '66b1ff000000000000000002' } } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn() }
      },
      stubs: ['b-modal', 'b-table', 'b-button', 'b-tabs', 'b-tab', 'draggable', 'router-link']
    })

    wrapper.vm.sorted_lists = [{ id: L1 }, { id: L2 }]
    wrapper.vm.$refs['modal-sort-findings'] = { hide: jest.fn() }
    Api.patch.mockResolvedValue({ data: {} })

    wrapper.vm.saveSortedLists()
    await flushDeep()

    const patchedUrls = Api.patch.mock.calls.map(c => c[0])
    expect(patchedUrls).toEqual([`/isoqf_lists/${L1}`, `/isoqf_lists/${L2}`])
    expect(patchedUrls.some(u => u.includes('isoqf_findings'))).toBe(false)

    wrapper.destroy()
  })
})
