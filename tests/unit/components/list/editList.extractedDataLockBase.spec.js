import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editList from '@/components/list/editList.vue'

jest.mock('@/services/presenceService', () => ({
  enter: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  fetch: jest.fn().mockResolvedValue([])
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
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

// Cuando otra persona suelta una fila de datos extraídos, la hoja tiene que recargar
// para mostrar lo que escribió. La fila cuelga de SU documento (`<doc>::ed::<ref>`), no
// de la referencia, así que ese documento tiene que estar entre las bases de la hoja.
describe('editList — la fila de datos extraídos pertenece a la hoja', () => {
  const fakeVm = (overrides = {}) => ({
    findings: { id: 'f1' },
    characteristics_studies: { id: 'cs1' },
    meth_assessments: { id: 'ma1' },
    extracted_data: { id: 'ed1' },
    list: { references: ['R1'] },
    ...overrides
  })

  it('el documento de datos extraídos es una base de la hoja', () => {
    const bases = editList.computed.worksheetLockBases.call(fakeVm())
    expect(bases).toContain('ed1')
  })

  it('soltar una fila de datos extraídos recarga la hoja', () => {
    const vm = fakeVm({ getList: jest.fn(), $_worksheetLockKeys: null })
    vm.worksheetLockBases = editList.computed.worksheetLockBases.call(vm)
    const refresh = editList.methods.refreshIfSomebodyReleased

    vm.foreignRefLocks = [{ ref_id: 'ed1::ed::R1', user_name: 'Ana' }]
    refresh.call(vm)
    vm.foreignRefLocks = []
    refresh.call(vm)

    expect(vm.getList).toHaveBeenCalledTimes(1)
  })

  it('una fila de OTRO hallazgo no recarga esta hoja', () => {
    const vm = fakeVm({ getList: jest.fn(), $_worksheetLockKeys: null })
    vm.worksheetLockBases = editList.computed.worksheetLockBases.call(vm)
    const refresh = editList.methods.refreshIfSomebodyReleased

    vm.foreignRefLocks = [{ ref_id: 'ed2::ed::R1', user_name: 'Ana' }]
    refresh.call(vm)
    vm.foreignRefLocks = []
    refresh.call(vm)

    expect(vm.getList).not.toHaveBeenCalled()
  })
})
