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
  const CAT_ALPHA = '66b1ff0000000000000000c1'
  const CAT_ZETA = '66b1ff0000000000000000c2'

  // LIST_B tiene el sort más alto (8) pero la categoría alfabéticamente
  // anterior ('Alpha'); LIST_A tiene sort más bajo (3) pero categoría
  // posterior ('Zeta'). sortFindings agrupa por (categoría, sort): si
  // resuelve bien las categorías, LIST_B queda #1 pese a su sort más alto.
  // Si la resolución de categorías está rota (p.ej. indexando data[0] de un
  // array plano), ambas caen en el mismo bucket y el orden degrada a
  // sort puro, dando LIST_B #2 — la fixture puede distinguir ambos casos.
  // Su isoqf_id persistido es 88, viejo tras un borrado. Tres valores
  // distintos a propósito — sort=8, isoqf_id=88, posición correcta=1.
  const LISTS = [
    { id: LIST_A, category: CAT_ZETA, sort: 3, isoqf_id: 87, findings: [] },
    { id: LIST_B, category: CAT_ALPHA, sort: 8, isoqf_id: 88, findings: [] }
  ]
  // Forma real que envía el backend: array plano de categorías, sin envolver
  // en { options: [...] } (ver editList.vue:561-567 y viewProject.vue:730-742).
  const CATEGORIES = [
    { id: CAT_ALPHA, text: 'Alpha' },
    { id: CAT_ZETA, text: 'Zeta' }
  ]

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

    expect(wrapper.vm.list.displayNumber).toBe(1)
    expect(wrapper.vm.list.displayNumber).not.toBe(88)
    expect(wrapper.vm.list.displayNumber).not.toBe(8)
    expect(wrapper.vm.list.displayNumber).not.toBe(2)
    wrapper.destroy()
  })
})
