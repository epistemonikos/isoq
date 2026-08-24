import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import { FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'

/**
 * El temporizador cableado al Paso 4. Lo que se fija acá es el ORDEN: el `@hidden` del
 * modal suelta el lock del estudio Y todas las hojas, así que un PATCH disparado después
 * llegaría sin autorización.
 */
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

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

function createWrapper (overrideProps = {}) {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true, ...overrideProps },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

const ITEM = { index: 0, item: { ref_id: 'R1', authors: 'Autor 2020' } }

/**
 * Abre el modal dejando el reloj armado y espía el `$bvModal` REAL.
 *
 * El espía va después de montar: `localVue.use(BootstrapVue)` instala su propio `$bvModal`
 * que pisa el de `mocks`, así que espiar antes no alcanza al que el componente usa.
 */
async function opened (wrapper) {
  await flushPromises()
  wrapper.vm.openModal(0, ITEM, 0)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  return wrapper
}

beforeEach(() => {
  jest.clearAllMocks()
  LockService.isEnabled = true
  LockService.refLocks.clear()
  LockService.fetchRefLocks.mockResolvedValue([])
  LockService.acquireRef.mockResolvedValue({ success: true })
})

describe('StepFour — armado del temporizador', () => {
  it('arma el reloj al abrir el modal', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    expect(wrapper.vm.$_inactivity).not.toBeNull()
    wrapper.destroy()
  })

  it('no lo arma sin permiso de escritura', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  it('no lo arma con el control de concurrencia apagado', async () => {
    LockService.isEnabled = false
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  it('lo desarma al cerrar el modal', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    wrapper.vm.onAssessmentModalClosed()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  // Perder UNA hoja no libera el estudio ni las otras nueve celdas.
  it('sobrevive a perder una hoja mientras queden locks', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    LockService.refLocks.set('R1', 'proj1')

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'R1::s0::o2', lockedBy: 'Ana' }
    }))
    await flushPromises()

    expect(wrapper.vm.$_inactivity).not.toBeNull()
    wrapper.destroy()
  })

  it('se desarma cuando ya no queda ningún lock', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()
    LockService.refLocks.clear()

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'R1::s0::o2', lockedBy: 'Ana' }
    }))
    await flushPromises()

    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })
})

describe('StepFour — expiración', () => {
  it('pide el flush ANTES de cerrar, con el estudio como scope', async () => {
    const wrapper = await opened(createWrapper())

    const visto = jest.fn()
    window.addEventListener(FLUSH_PENDING_EDITS, visto)

    wrapper.vm.onInactivityExpired()

    expect(visto).toHaveBeenCalled()
    expect(visto.mock.calls[0][0].detail.scope).toBe('R1')
    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-1')
    expect(visto.mock.invocationCallOrder[0])
      .toBeLessThan(wrapper.vm.$bvModal.hide.mock.invocationCallOrder[0])

    window.removeEventListener(FLUSH_PENDING_EDITS, visto)
    wrapper.destroy()
  })

  it('en solo lectura no pide el flush, pero cierra igual', async () => {
    const wrapper = await opened(createWrapper())
    await wrapper.setData({ isRefReadOnly: true })

    const visto = jest.fn()
    window.addEventListener(FLUSH_PENDING_EDITS, visto)

    wrapper.vm.onInactivityExpired()

    expect(visto).not.toHaveBeenCalled()
    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-1')

    window.removeEventListener(FLUSH_PENDING_EDITS, visto)
    wrapper.destroy()
  })

  it('avisa que se guardó y se liberó', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, ITEM, 0)
    await flushPromises()

    wrapper.vm.onInactivityExpired()

    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.inactivity_released')
    wrapper.destroy()
  })
})
