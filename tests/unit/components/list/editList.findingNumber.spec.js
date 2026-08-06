import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const LIST_B = '66b1ff0000000000000000a2'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn((ref) => `Author-${ref.id || ''}`),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  // La lista abierta es la #2. sort=30 e isoqf_id=88 son distintos a propósito:
  // si el código lee el atributo equivocado, el test lo caza.
  sortFindings: jest.fn(() => [
    { id: '66b1ff0000000000000000a2', sort: 30, isoqf_id: 88, displayNumber: 2 }
  ])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('editList — syncOrderWithProject usa displayNumber', () => {
  it('estampa displayNumber y no pisa el isoqf_id persistido', async () => {
    const wrapper = shallowMount(editList, {
      localVue,
      propsData: {},
      mocks: {
        $t: (k) => k,
        $route: { params: { id: LIST_B, org_id: '66b1ff000000000000000002' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { id: 1 } } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      }
    })

    // Se hace spread sobre el default de datos (no reemplazo total) para no perder
    // `cerqual: {}` u otras claves que el propio template de editList.vue lee
    // directamente (p.ej. `list.cerqual.option` en el header) — de lo contrario
    // el render explota con un TypeError ajeno al método bajo prueba.
    wrapper.vm.list = { ...wrapper.vm.list, id: LIST_B, project: { id: '66b1ff000000000000000001', organization: 'o1' } }
    wrapper.vm.findings = { id: '66b1ff0000000000000000f1', isoqf_id: 88 }
    wrapper.vm.evidence_profile = [{ isoqf_id: 88 }]

    wrapper.vm.syncOrderWithProject()
    await flushPromises()

    expect(wrapper.vm.findings.displayNumber).toBe(2)
    expect(wrapper.vm.evidence_profile[0].displayNumber).toBe(2)
    expect(wrapper.vm.list.displayNumber).toBe(2)
    // El espejo persistido queda como estaba: ya no se sincroniza a mano.
    expect(wrapper.vm.findings.isoqf_id).toBe(88)

    wrapper.destroy()
  })
})
