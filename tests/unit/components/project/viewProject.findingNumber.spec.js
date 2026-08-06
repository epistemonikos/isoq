import { shallowMount } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

describe('viewProject — no se escribe más el espejo isoqf_id', () => {
  const L1 = '66b1ff0000000000000000a1'
  const L2 = '66b1ff0000000000000000a2'

  beforeEach(() => {
    jest.clearAllMocks()
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

    await wrapper.vm.saveSortedLists()

    const patchedUrls = Api.patch.mock.calls.map(c => c[0])
    expect(patchedUrls).toEqual([`/isoqf_lists/${L1}`, `/isoqf_lists/${L2}`])
    expect(patchedUrls.some(u => u.includes('isoqf_findings'))).toBe(false)

    wrapper.destroy()
  })
})
