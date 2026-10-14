import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import { emptyAssessmentItem } from '@/utils/camelotAssessmentKeys'

/**
 * La overall assessment (OA) se emite «tomando en consideración» los nueve fit
 * assessments. Si alguien la cierra y después vuelve atrás a cambiar un FA, la OA queda
 * apoyada en una premisa que dejó de ser cierta — y hasta ahora el producto no decía
 * nada. Lo que se fija acá es cuándo aparece ese recordatorio y, sobre todo, cuándo NO:
 * un cartel que salta en cada guardado se aprende a cerrar sin leer.
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
const REMINDER_MODAL = 'oa-reminder-modal'

/** Un estudio con la OA (etapa 3, opción 0) en el estado que pida el test. */
function studyWithOA (option, text) {
  const item = emptyAssessmentItem('R1', 'Autor 2020')
  item.stages[3].options[0].option = option
  item.stages[3].options[0].text = text
  return { id: 'assess1', items: [item] }
}

function createWrapper () {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

/** Abre el modal del estudio y espía el `$bvModal` REAL (BootstrapVue pisa el de `mocks`). */
async function opened (wrapper, assessments, stage = 0, tab = 0) {
  await flushPromises()
  wrapper.setData({ assessments })
  wrapper.vm.openModal(stage, ITEM, tab)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  return wrapper
}

/** Lo que emite un AssessmentForm cuando un guardado manual cambió el nivel A-E. */
function optionSaved (wrapper, stage = 0, meta = 0) {
  wrapper.vm.onAssessmentOptionSaved({ stage, meta })
}

const shown = (wrapper) => wrapper.vm.$bvModal.show.mock.calls
  .filter(call => call[0] === REMINDER_MODAL).length

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
})

describe('Paso 4 — recordatorio de revisar la OA', () => {
  it('reminds when a fit assessment changes and the OA was already finished', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', 'Mi juicio global'))

    optionSaved(wrapper, 0, 2)

    expect(shown(wrapper)).toBe(1)
  })

  it('stays quiet while the OA has no judgement yet', async () => {
    wrapper = await opened(createWrapper(), studyWithOA(null, ''))

    optionSaved(wrapper, 0, 2)

    expect(shown(wrapper)).toBe(0)
  })

  // Mismo criterio que el círculo de la grilla: sin explicación la OA no está emitida,
  // está a medias — y nadie tiene que "revisar" algo que todavía no terminó.
  it('stays quiet while the OA has a judgement but no explanation', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', ''))

    optionSaved(wrapper, 0, 2)

    expect(shown(wrapper)).toBe(0)
  })

  it('does not accept whitespace as the OA explanation', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', '   \n'))

    optionSaved(wrapper, 0, 2)

    expect(shown(wrapper)).toBe(0)
  })

  it.each([[1, 3], [2, 0]])('reminds from stage %i too (FA at meta %i)', async (stage, meta) => {
    wrapper = await opened(createWrapper(), studyWithOA('B', 'Mi juicio global'), stage)

    optionSaved(wrapper, stage, meta)

    expect(shown(wrapper)).toBe(1)
  })

  // Guardar la OA no es motivo para pedir que se revise la OA.
  it('stays quiet when the cell just saved IS the overall assessment', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', 'Mi juicio global'), 3)

    optionSaved(wrapper, 3, 0)

    expect(shown(wrapper)).toBe(0)
  })

  it('reminds once per study, not once per fit assessment', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', 'Mi juicio global'))

    optionSaved(wrapper, 0, 0)
    optionSaved(wrapper, 0, 1)
    optionSaved(wrapper, 1, 2)

    expect(shown(wrapper)).toBe(1)
  })

  it('reminds again after the study modal is reopened', async () => {
    wrapper = await opened(createWrapper(), studyWithOA('B', 'Mi juicio global'))
    optionSaved(wrapper, 0, 0)

    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    optionSaved(wrapper, 0, 1)

    expect(shown(wrapper)).toBe(2)
  })

  it('survives a study whose assessments have not loaded', async () => {
    wrapper = await opened(createWrapper(), { items: [] })

    expect(() => optionSaved(wrapper, 0, 0)).not.toThrow()
    expect(shown(wrapper)).toBe(0)
  })

  /**
   * La afirmación va sobre el DOM y no sobre el estado. Dos carteles de este mismo
   * componente pasaron revisión con tests verdes y no se dibujaban: uno no tenía rama en
   * la plantilla, el otro estaba rotulado con `placeholder`.
   */
  it('renders the reminder text and an OK button', () => {
    wrapper = createWrapper()
    const modal = wrapper.find(`[data-testid="${REMINDER_MODAL}"]`)

    expect(modal.exists()).toBe(true)
    expect(modal.text()).toContain('camelot.step_four.oa_reminder.body')
    expect(modal.attributes('title')).toBe('camelot.step_four.oa_reminder.title')
    // El stub de bootstrap-vue baja los nombres a minúsculas: `oktitle`, no `ok-title`.
    expect(modal.attributes('oktitle')).toBe('common.ok')
    expect(modal.attributes('okonly')).toBe('true')
  })
})
