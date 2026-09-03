import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import { FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'
import { otherTabActiveOn } from '@/utils/editorPresence'

/**
 * La explicación es obligatoria en cuanto hay una opción elegida, pero hasta ahora sólo
 * el botón *Save* lo hacía cumplir. Cambiar de pestaña, cambiar de etapa o cerrar el modal
 * salteaban el aviso, y el auto-guardado de 1,5 s persistía la celda incompleta igual: el
 * aviso terminaba siendo opcional para quien no apretara *Save*.
 *
 * Lo que se fija acá son las tres salidas nuevas y, sobre todo, la que NO debe quedar
 * atrapada: el cierre por inactividad existe para soltar locks, y un guard que lo frene
 * convierte un arreglo de interfaz en un lock colgado del lado del servidor.
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

function createWrapper (overrideProps = {}) {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true, ...overrideProps },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

/** Abre el modal y espía el `$bvModal` REAL (BootstrapVue pisa el de `mocks`). */
async function opened (wrapper, stage = 0, tab = 0) {
  await flushPromises()
  wrapper.vm.openModal(stage, ITEM, tab)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  return wrapper
}

/** Lo que emite un AssessmentForm cuando su celda queda con opción y sin explicación. */
function markIncomplete (wrapper, stage, meta, incomplete = true) {
  wrapper.vm.onCellIncompleteChange({ stage, meta, incomplete })
}

/** Un evento de `activate-tab` de bootstrap-vue: cancelable. */
function tabEvent () {
  let prevented = false
  return {
    preventDefault () { prevented = true },
    get defaultPrevented () { return prevented }
  }
}

let wrapper

beforeEach(() => {
  jest.clearAllMocks()
  LockService.isEnabled = true
  LockService.refLocks.clear()
  LockService.fetchRefLocks.mockResolvedValue([])
  LockService.acquireRef.mockResolvedValue({ success: true })
  otherTabActiveOn.mockReturnValue(false)
})

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
})

describe('StepFour.vue — el aviso de explicación cubre el cambio de pestaña', () => {
  it('frena el cambio de pestaña cuando la que se abandona quedó incompleta', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)

    const evt = tabEvent()
    wrapper.vm.onActivateTab(1, 0, evt)

    expect(evt.defaultPrevented).toBe(true)
    expect(wrapper.vm.modal.tab).toBe(0)
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('explanation-guard-modal')
  })

  it('deja pasar el cambio cuando la pestaña que se abandona está completa', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0, false)

    const evt = tabEvent()
    wrapper.vm.onActivateTab(1, 0, evt)

    expect(evt.defaultPrevented).toBe(false)
    expect(wrapper.vm.$bvModal.show).not.toHaveBeenCalledWith('explanation-guard-modal')
  })

  // La celda incompleta es de otra persona: pedirle una explicación que no puede
  // escribir sería un callejón sin salida.
  it('deja pasar el cambio cuando la celda incompleta está en solo lectura', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.deniedCellHolders = new Map([['0-0', 'Otra Persona']])
    await wrapper.vm.$nextTick()

    const evt = tabEvent()
    wrapper.vm.onActivateTab(1, 0, evt)

    expect(evt.defaultPrevented).toBe(false)
  })

  // Otra pestaña incompleta no es asunto de esta salida: sólo se pregunta por la que
  // se está abandonando.
  it('no pregunta por una pestaña incompleta que no es la que se abandona', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 2)

    const evt = tabEvent()
    wrapper.vm.onActivateTab(1, 0, evt)

    expect(evt.defaultPrevented).toBe(false)
  })

  it('"más tarde" cambia la pestaña y persiste lo que el debounce tenía agendado', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())

    const flushed = jest.fn()
    window.addEventListener(FLUSH_PENDING_EDITS, flushed)
    wrapper.vm.explanationGuardDoItLater()
    window.removeEventListener(FLUSH_PENDING_EDITS, flushed)

    expect(wrapper.vm.modal.tab).toBe(1)
    expect(wrapper.vm.selectedMeta).toBe(1)
    expect(flushed).toHaveBeenCalled()
    expect(flushed.mock.calls[0][0].detail.scope).toBe('R1')
  })

  /**
   * El foco no se aplica de un solo intento. Bootstrap-vue lo DEVUELVE al cerrar el aviso
   * —verificado en navegador: el cursor terminaba dentro del cartel ya cerrado, con el
   * test en verde porque comprobaba la llamada y no dónde aterrizaba—, y `hidden`, que
   * ocurre después de esa devolución, cuelga de `transitionend`: esta base de código ya lo
   * tiene documentado como poco confiable. Lo que se fija acá es que ninguna de las dos
   * vías sea la única.
   */
  it('"ahora" se queda donde está y apunta el foco al textarea de esa celda', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())

    wrapper.vm.explanationGuardDoItNow()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.modal.tab).toBe(0)
    expect(wrapper.vm.pendingFocusId).toBe('assessment-explanation-0-0')
  })

  it('el foco aterriza cuando el aviso avisa que terminó de cerrarse', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())
    wrapper.vm.explanationGuardDoItNow()

    const el = document.createElement('textarea')
    el.id = 'assessment-explanation-0-0'
    document.body.appendChild(el)

    wrapper.vm.onExplanationGuardHidden()

    expect(document.activeElement).toBe(el)
    expect(wrapper.vm.pendingFocusId).toBe(null)
    document.body.removeChild(el)
  })

  // El caso que justifica el reintento: `hidden` puede no llegar nunca.
  it('el foco aterriza igual aunque el aviso nunca emita hidden', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())

    const frames = []
    const raf = jest.spyOn(window, 'requestAnimationFrame')
      .mockImplementation(cb => { frames.push(cb); return frames.length })

    wrapper.vm.explanationGuardDoItNow()
    expect(frames.length).toBe(1)

    // Primer frame: el textarea todavía no está montado — el reintento sigue.
    frames.shift()()
    expect(frames.length).toBe(1)
    expect(wrapper.vm.pendingFocusId).toBe('assessment-explanation-0-0')

    const el = document.createElement('textarea')
    el.id = 'assessment-explanation-0-0'
    document.body.appendChild(el)

    frames.shift()()

    expect(document.activeElement).toBe(el)
    expect(wrapper.vm.pendingFocusId).toBe(null)
    // Cede: nada más que reintentar.
    expect(frames.length).toBe(0)

    document.body.removeChild(el)
    raf.mockRestore()
  })

  // "Más tarde" no deja nada pendiente: enfocar tras cerrar el aviso robaría el foco de
  // la pestaña a la que la persona acaba de llegar.
  it('"más tarde" no deja un foco pendiente', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())
    wrapper.vm.explanationGuardDoItLater()

    expect(wrapper.vm.pendingFocusId).toBe(null)

    const focus = jest.fn()
    jest.spyOn(document, 'getElementById').mockReturnValue({ focus })
    wrapper.vm.onExplanationGuardHidden()

    expect(focus).not.toHaveBeenCalled()
    document.getElementById.mockRestore()
  })

  // El id del textarea estaba repetido en las cuatro instancias, así que "hacerlo ahora"
  // enfocaba siempre la caja de la primera pestaña. Acá se exige la celda concreta.
  it('"ahora" salta a la pestaña incompleta cuando no es la activa', async () => {
    wrapper = await opened(createWrapper(), 0, 2)
    markIncomplete(wrapper, 0, 2)
    wrapper.vm.onActivateTab(3, 2, tabEvent())

    wrapper.vm.explanationGuardDoItNow()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.modal.tab).toBe(2)
    expect(wrapper.vm.pendingFocusId).toBe('assessment-explanation-0-2')
  })

  // Reactivar la pestaña destino vuelve a emitir `activate-tab`; sin la exención el
  // guard se dispararía contra sí mismo y la pestaña nunca cambiaría.
  it('el cambio que autoriza el propio aviso no se vuelve a interceptar', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.onActivateTab(1, 0, tabEvent())
    wrapper.vm.explanationGuardDoItLater()

    const evt = tabEvent()
    wrapper.vm.onActivateTab(1, 0, evt)

    expect(evt.defaultPrevented).toBe(false)
  })
})

describe('StepFour.vue — el aviso cubre el cambio de etapa', () => {
  it('frena goToStage cuando hay una celda incompleta en la etapa actual', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 3)

    wrapper.vm.goToStage(1)

    expect(wrapper.vm.modal.stage).toBe(0)
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('explanation-guard-modal')
  })

  it('"más tarde" completa el cambio de etapa', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 3)
    wrapper.vm.goToStage(1)

    wrapper.vm.explanationGuardDoItLater()

    expect(wrapper.vm.modal.stage).toBe(1)
    expect(wrapper.vm.modal.tab).toBe(0)
  })

  it('sin celdas incompletas el cambio de etapa es directo', async () => {
    wrapper = await opened(createWrapper())

    wrapper.vm.goToStage(2)

    expect(wrapper.vm.modal.stage).toBe(2)
    expect(wrapper.vm.$bvModal.show).not.toHaveBeenCalledWith('explanation-guard-modal')
  })

  // Las etapas 2 y 3 no tienen pestañas: su única salida es la etapa o el cierre.
  it('vale igual en una etapa sin pestañas', async () => {
    wrapper = await opened(createWrapper(), 3, 0)
    markIncomplete(wrapper, 3, 0)

    wrapper.vm.requestModalClose()

    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('explanation-guard-modal')
    expect(wrapper.vm.$bvModal.hide).not.toHaveBeenCalledWith('modal-1')
  })
})

describe('StepFour.vue — el aviso cubre el cierre del modal', () => {
  it('frena el cierre pedido por la persona cuando hay una celda incompleta', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 1)

    wrapper.vm.requestModalClose()

    expect(wrapper.vm.$bvModal.hide).not.toHaveBeenCalledWith('modal-1')
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('explanation-guard-modal')
  })

  it('"más tarde" cierra el modal', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 1)
    wrapper.vm.requestModalClose()

    wrapper.vm.explanationGuardDoItLater()

    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-1')
  })

  it('la X de la cabecera pasa por el mismo aviso', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 1)

    const evt = { trigger: 'headerclose', preventDefault: jest.fn() }
    wrapper.vm.onAssessmentModalHide(evt)

    expect(evt.preventDefault).toHaveBeenCalled()
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('explanation-guard-modal')
  })

  it('sin celdas incompletas el cierre es directo', async () => {
    wrapper = await opened(createWrapper())

    wrapper.vm.requestModalClose()

    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-1')
  })

  /**
   * El caso que más importa proteger. `onInactivityExpired` cierra el modal para SOLTAR
   * los locks; si el guard lo secuestra, el lock queda vivo del lado del servidor y la
   * persona que espera nunca lo recibe. Un arreglo de interfaz no puede costar eso.
   */
  it('el cierre por inactividad NO queda atrapado por el aviso', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)

    const evt = { trigger: null, preventDefault: jest.fn() }
    wrapper.vm.onAssessmentModalHide(evt)

    expect(evt.preventDefault).not.toHaveBeenCalled()
  })

  it('el modal se cierra de verdad al expirar la inactividad con una celda incompleta', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)

    wrapper.vm.onInactivityExpired(Date.now())
    await flushPromises()

    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-1')
    expect(wrapper.vm.isModalOpen).toBe(false)
  })
})

describe('StepFour.vue — contabilidad de celdas incompletas', () => {
  it('olvida la celda cuando el formulario avisa que ya está completa', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    expect(wrapper.vm.incompleteMetasInStage).toEqual([0])

    markIncomplete(wrapper, 0, 0, false)
    expect(wrapper.vm.incompleteMetasInStage).toEqual([])
  })

  // Las etapas se conmutan con `v-if`: los formularios de la etapa anterior se destruyen
  // y avisan que se van. Sin eso el padre arrastraría celdas que ya no existen.
  it('sólo cuenta las celdas de la etapa abierta', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 1)
    markIncomplete(wrapper, 1, 2)

    expect(wrapper.vm.incompleteMetasInStage).toEqual([1])
  })

  /**
   * Reabrir el modal NO puede vaciar el mapa. Los AssessmentForm siguen montados y su
   * `isIncomplete` no cambió, así que el watcher no vuelve a emitir: vaciarlo lo dejaba
   * vacío para siempre y la X del encabezado dejaba de avisar. Medido en navegador —el
   * test anterior afirmaba el vaciado, es decir, fijaba el bug.
   *
   * No hace falta vaciarlo: el mapa describe lo que los formularios montados muestran, y
   * los que se desmontan se dan de baja solos.
   */
  it('reabrir el modal conserva lo que los formularios montados reportaron', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)

    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'R2', authors: 'Otro 2021' } }, 0)
    await flushPromises()

    expect(wrapper.vm.incompleteMetasInStage).toEqual([0])
  })

  // El caso concreto que se rompía: abrir, cerrar y volver a abrir, y que la X siga avisando.
  it('la X sigue avisando después de reabrir el modal', async () => {
    wrapper = await opened(createWrapper())
    markIncomplete(wrapper, 0, 0)
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()

    const evt = { trigger: 'headerclose', preventDefault: jest.fn() }
    wrapper.vm.onAssessmentModalHide(evt)

    expect(evt.preventDefault).toHaveBeenCalled()
  })
})
