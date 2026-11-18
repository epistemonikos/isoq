import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import { FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'
import { otherTabActiveOn } from '@/utils/editorPresence'

/**
 * Salir de una etapa DESTRUYE sus formularios: las etapas se conmutan con `v-if`, y el
 * `beforeDestroy` de AssessmentForm cancela el auto-guardado agendado. Lo elegido en el
 * último segundo y medio se perdía en silencio — no hay aviso, no hay error, y el valor
 * simplemente no está cuando se vuelve.
 *
 * El canal para evitarlo ya existía y ya se usaba en dos salidas (el «más tarde» del aviso
 * de explicación y el cierre por inactividad). Lo que faltaba era pedirlo en las salidas
 * que NO disparan ningún aviso, que son las más frecuentes: la celda está completa, así que
 * nada intercepta la navegación.
 *
 * Lo que NO debe flushear tiene el mismo peso: sin lock no hay nada que escribir, y el
 * cierre porque la misma persona abrió el estudio en otra pestaña existe justamente para
 * que esta copia vieja no pise lo que se está escribiendo en la otra.
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

async function opened (wrapper, stage = 0, tab = 0) {
  await flushPromises()
  wrapper.vm.openModal(stage, ITEM, tab)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  return wrapper
}

/** Escucha el canal mientras corre `fn`, y devuelve los scopes pedidos. */
function scopesPedidosDurante (fn) {
  const visto = jest.fn()
  window.addEventListener(FLUSH_PENDING_EDITS, visto)
  fn()
  window.removeEventListener(FLUSH_PENDING_EDITS, visto)
  return visto.mock.calls.map(c => c[0].detail.scope)
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

describe('StepFour — salir de una etapa persiste lo que quedó agendado', () => {
  it('cambiar de etapa por el link del pie escribe lo pendiente', async () => {
    wrapper = await opened(createWrapper())

    const scopes = scopesPedidosDurante(() => wrapper.vm.goToStage(1))

    expect(scopes).toContain('R1')
    expect(wrapper.vm.modal.stage).toBe(1)
  })

  it('volver a la etapa anterior también', async () => {
    wrapper = await opened(createWrapper(), 1)

    const scopes = scopesPedidosDurante(() => wrapper.vm.goToStage(0))

    expect(scopes).toContain('R1')
    expect(wrapper.vm.modal.stage).toBe(0)
  })

  it('cerrar el modal desde el pie o el Cancel del formulario también', async () => {
    wrapper = await opened(createWrapper())

    const scopes = scopesPedidosDurante(() => wrapper.vm.requestModalClose())

    expect(scopes).toContain('R1')
  })

  // La X no pasa por el aviso cuando la celda está completa: se va derecho al cierre.
  it('la X de la cabecera también, aunque no haya nada que avisar', async () => {
    wrapper = await opened(createWrapper())

    const scopes = scopesPedidosDurante(
      () => wrapper.vm.onAssessmentModalHide({ trigger: 'headerclose', preventDefault () {} })
    )

    expect(scopes).toContain('R1')
  })

  it('no pide nada cuando el estudio está en solo lectura: sin lock no hay qué escribir', async () => {
    wrapper = await opened(createWrapper())
    await wrapper.setData({ isRefReadOnly: true })

    const scopes = scopesPedidosDurante(() => wrapper.vm.goToStage(1))

    expect(scopes).toEqual([])
  })

  // El cierre programático por presencia en otra pestaña existe para que ESTA copia no
  // pise la otra. Flushear ahí sería exactamente lo contrario.
  it('no escribe al cerrarse porque la misma persona abrió el estudio en otra pestaña', async () => {
    wrapper = await opened(createWrapper())
    otherTabActiveOn.mockReturnValue(true)

    const scopes = scopesPedidosDurante(() => wrapper.vm.onInactivityExpired(Date.now()))

    expect(scopes).toEqual([])
  })
})
