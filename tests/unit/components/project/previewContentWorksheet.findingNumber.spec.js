import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
// El repo no usa el paquete flush-promises: se declara local (ver viewProject.lists.spec.js:6)
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }))
jest.mock('@/services/wordExportService', () => ({
  exportToWord: jest.fn().mockResolvedValue(undefined)
}))

describe('previewContentWorksheet — el # se deriva, no se lee del isoqf_id persistido', () => {
  const PROJECT = '66b1ff000000000000000001'
  const LIST_A = '66b1ff0000000000000000a1'
  const LIST_B = '66b1ff0000000000000000a2'
  const CAT = '66b1ff0000000000000000c1'

  // LIST_B es el segundo por (categoría, sort), así que su # es 2. Su isoqf_id
  // persistido es 88: quedó viejo tras un borrado. Tres valores distintos a
  // propósito — sort=8, isoqf_id=88, posición=2.
  const LISTS = [
    { id: LIST_A, category: CAT, sort: 3, isoqf_id: 87, findings: [] },
    { id: LIST_B, category: CAT, sort: 8, isoqf_id: 88, findings: [] }
  ]
  const CATEGORIES = [{ id: PROJECT, options: [{ id: CAT, text: 'Cat' }] }]

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation((url) => {
      if (String(url).includes('isoqf_list_categories')) return Promise.resolve({ data: CATEGORIES })
      if (String(url).includes('isoqf_lists')) return Promise.resolve({ data: LISTS })
      return Promise.resolve({ data: [] })
    })
  })

  it('la lista abierta lleva displayNumber = su posición, no su isoqf_id', async () => {
    const wrapper = shallowMount(previewContentWorksheet, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: LIST_B, projectId: PROJECT, token: 'public' } },
        $router: { push: jest.fn() }
      }
    })
    wrapper.vm.project = { id: PROJECT }

    wrapper.vm.getList()
    await flushPromises()

    expect(wrapper.vm.list.displayNumber).toBe(2)
    expect(wrapper.vm.list.displayNumber).not.toBe(88)
    wrapper.destroy()
  })
})
