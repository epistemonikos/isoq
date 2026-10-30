import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map()
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

/**
 * `hasOpenEditor()` acá sólo frena el sondeo de este componente. El de `viewProject`
 * recarga las referencias, y el watcher de `references` vuelve a pedir los assessments: el
 * documento entrante llegaba al formulario abierto y desmarcaba la opción recién elegida.
 * Este componente no puede saber quién lo contiene, así que reporta el hecho y el padre
 * aplica la regla — mismo reparto que `incomplete-change`.
 */
describe('StepFour — avisa al padre que hay un editor abierto', () => {
  let wrapper

  const study = { index: 0, item: { ref_id: 'ref1', authors: 'Autor 2024' } }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'proj1', org_id: 'org1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn() },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
        $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
      }
    })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('emite editor-open al abrir el modal de un estudio', () => {
    wrapper.vm.openModal(0, study, 0)

    expect(wrapper.emitted('editor-open')).toBeTruthy()
    expect(wrapper.emitted('editor-open')[0]).toEqual([true])
  })

  it('emite editor-open falso al cerrarlo', () => {
    wrapper.vm.openModal(0, study, 0)
    wrapper.vm.onAssessmentModalClosed()

    const emitido = wrapper.emitted('editor-open')
    expect(emitido[emitido.length - 1]).toEqual([false])
  })
})
