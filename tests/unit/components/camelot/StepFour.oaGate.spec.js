import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import { ASSESSMENT_CELLS, emptyAssessmentItem, OVERALL_ASSESSMENT } from '@/utils/camelotAssessmentKeys'

/**
 * El pie del modal es la TERCERA puerta a la overall assessment, además del botón y del
 * círculo de la grilla: parado en FA 9 se llega en un click, sin volver a pasar por la
 * tabla. Si sólo se gateara la grilla, esta quedaría abierta y la regla no se cumpliría.
 *
 * Lo que se fija acá es eso y el orden de las dos guardas: el gate contesta ANTES que el
 * aviso de explicación, porque una navegación encolada en `pendingNavigation` la ejecuta
 * el botón «más tarde», y el gate se saltearía por la puerta de al lado.
 */
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/editorPresence', () => ({
  announcePresence: jest.fn(),
  clearPresence: jest.fn(),
  otherTabActiveOn: jest.fn().mockReturnValue(false)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      isEnabled: true,
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map(),
      get refLocked () { return this.refLocks.size > 0 }
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const ITEM = { index: 0, item: { ref_id: 'R1', authors: 'Autor 2020' } }
const GATE = 'camelot.step_four.oa_gate.blocked'
const isFa = cell => cell.key !== 'oa'

/** Un estudio con las celdas que diga `only` juzgadas Y explicadas. */
function study (only = () => false) {
  const item = emptyAssessmentItem('R1', 'Autor 2020')
  ASSESSMENT_CELLS.filter(only).forEach(({ stage, option }) => {
    item.stages[stage].options[option] = { option: 'B', text: 'porque X', notes: '' }
  })
  return { id: 'assess1', items: [item] }
}

const mocks = {
  $t: key => key,
  $route: { params: { id: 'proj1', org_id: 'org1' } },
  $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
  $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
}

let wrapper

beforeEach(() => {
  jest.clearAllMocks()
  LockService.isEnabled = true
  LockService.refLocks.clear()
  LockService.fetchRefLocks.mockResolvedValue([])
  LockService.acquireRef.mockResolvedValue({ success: true })
})

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
  document.body.innerHTML = ''
})

describe('StepFour — el pie del modal no salta a la OA con los FA a medias', () => {
  /** Abre el modal en la etapa pedida y espía el `$bvModal` REAL (BSV pisa el de mocks). */
  async function opened (assessments, stage = 2) {
    wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks
    })
    await flushPromises()
    wrapper.setData({ assessments })
    wrapper.vm.openModal(stage, ITEM, 0)
    await flushPromises()
    jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
    jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
    return wrapper
  }

  it('se queda en FA 9 cuando falta completar algún fit assessment', async () => {
    await opened(study(cell => isFa(cell) && cell.key !== 'fa4'))

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)

    expect(wrapper.vm.modal.stage).toBe(2)
  })

  // El gate contesta primero, así que el aviso de explicación ni se asoma: dos carteles
  // por un mismo click son uno que no se lee.
  it('no muestra además el aviso de explicación', async () => {
    await opened(study())

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)

    expect(wrapper.vm.$bvModal.show).not.toHaveBeenCalledWith('explanation-guard-modal')
  })

  it('pasa a la OA con los nueve FA completos', async () => {
    await opened(study(isFa))

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)

    expect(wrapper.vm.modal.stage).toBe(OVERALL_ASSESSMENT.stage)
  })

  it('pasa a una OA ya emitida aunque falten FA', async () => {
    const assessments = study()
    assessments.items[0].stages[OVERALL_ASSESSMENT.stage].options[0].option = 'C'
    await opened(assessments)

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)

    expect(wrapper.vm.modal.stage).toBe(OVERALL_ASSESSMENT.stage)
  })

  it('no estorba el paso entre las etapas de fit assessment', async () => {
    await opened(study(), 0)

    wrapper.vm.goToStage(1)

    expect(wrapper.vm.modal.stage).toBe(1)
  })

  it('deja volver hacia atrás desde FA 9', async () => {
    await opened(study())

    wrapper.vm.goToStage(1)

    expect(wrapper.vm.modal.stage).toBe(1)
  })

  /**
   * El orden de las dos guardas. Si el gate se evaluara dentro de `guardExplanation`, la
   * navegación quedaría encolada en `pendingNavigation` y «más tarde» la ejecutaría —
   * llegando a la OA por el aviso de la puerta de al lado.
   */
  it('«más tarde» no cuela la navegación que el gate frenó', async () => {
    await opened(study())
    wrapper.vm.onCellIncompleteChange({ stage: 2, meta: 0, incomplete: true })

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)
    wrapper.vm.explanationGuardDoItLater()

    expect(wrapper.vm.modal.stage).toBe(2)
  })

  it('el lector (canEdit=false) sigue llegando a la etapa 3', async () => {
    wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: false },
      mocks
    })
    await flushPromises()
    wrapper.setData({ assessments: study() })
    wrapper.vm.openModal(2, ITEM, 0)
    await flushPromises()

    wrapper.vm.goToStage(OVERALL_ASSESSMENT.stage)

    expect(wrapper.vm.modal.stage).toBe(OVERALL_ASSESSMENT.stage)
  })
})

// CLAUDE.md: un test verde sobre el estado no prueba que se vea. El link tiene que
// quedar visible —sacarlo dejaría la etapa 2 sin salida aparente y sin dónde contar
// qué falta— pero apagado, y decir por qué.
describe('StepFour — el link del pie se ve apagado y explica', () => {
  async function openedGrid (assessments) {
    wrapper = mount(StepFour, {
      localVue,
      attachTo: document.body,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks
    })
    await new Promise(resolve => setTimeout(resolve, 0))
    wrapper.setData({ assessments })
    wrapper.vm.openModal(2, ITEM, 0)
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    return document.body.querySelector('[data-testid="footer-next-stage"]')
  }

  it('lo apaga y pone el aviso cuando faltan fit assessments', async () => {
    const link = await openedGrid(study())
    expect(link).not.toBeNull()
    expect(link.className).toContain('nav-footer-link-blocked')
    expect(link.getAttribute('title')).toBe(GATE)
  })

  it('lo deja vivo y sin aviso con los nueve completos', async () => {
    const link = await openedGrid(study(isFa))
    expect(link.className).not.toContain('nav-footer-link-blocked')
    expect(link.getAttribute('title')).toBe('')
  })
})
