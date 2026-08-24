import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import StepFour from '@/components/camelot/StepFour.vue'

/**
 * CARACTERIZACIÓN — documenta el comportamiento ACTUAL, no el deseado.
 *
 * El canal de conflicto (`ref-lock-conflict` -> RefLockConflictModal) es lo que debería
 * rescatar el texto que el servidor rechazó, y es la promesa que sostiene la decisión de
 * producto "al expirar se cierra igual y el texto se preserva". Estos dos tests muestran
 * que hoy no llega en los dos caminos que el temporizador va a producir:
 *
 *   Paso 3 — `resetModal` anula `localReference` al cerrar, y el guard compara contra él,
 *            así que un 409 que llega DESPUÉS del cierre se descarta.
 *   Paso 4 — el guard compara contra `this.refId` (el estudio) mientras los conflictos del
 *            endpoint D llegan con la clave compuesta `ref::sK::oI`: nunca coinciden.
 *
 * Pasan en VERDE describiendo el defecto.
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
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map()
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const commonMocks = {
  $t: key => key,
  $route: { params: { id: 'proj1', org_id: 'org1' } },
  $bvModal: { show: jest.fn(), hide: jest.fn() },
  $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
  $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
}

const conflict = (refId) => window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
  detail: { refId, failedData: { texto: 'lo que el usuario escribio' }, lockedBy: 'Ana', source: 'live' }
}))

describe('canal de conflicto (CARACTERIZACIÓN)', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('Paso 3: un conflicto que llega DESPUÉS de cerrar el modal se descarta', async () => {
    const wrapper = shallowMount(EditReferenceModal, {
      localVue,
      propsData: {
        reference: { id: 'R1', authors: 'Autor 2020' },
        charsData: { id: 'chars1', items: [], fields: [] },
        camelot: {}
      },
      mocks: commonMocks
    })
    await flushPromises()

    // Con el editor abierto sí lo toma: ésta es la mitad que funciona.
    conflict('R1')
    await flushPromises()
    expect(wrapper.vm.conflictData).not.toBeNull()

    // Ahora el flujo del temporizador: guardar, cerrar, y el 409 llega después.
    wrapper.vm.clearConflict()
    wrapper.vm.resetModal()
    await flushPromises()
    expect(wrapper.vm.localReference).toBeNull()

    conflict('R1')
    await flushPromises()

    // El defecto: el guard compara contra un localReference ya anulado y sale temprano.
    expect(wrapper.vm.conflictData).toBeNull()

    wrapper.destroy()
  })

  it('Paso 4: un conflicto de celda (clave compuesta) nunca abre el modal', async () => {
    const wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks: commonMocks
    })
    await wrapper.setData({ refId: 'R1', isModalOpen: true })
    // shallowMount deja el RefLockConflictModal como stub sin `show()`; el handler lo
    // invoca por $refs, así que hay que darle uno que responda.
    wrapper.vm.$refs.conflictModal = { show: jest.fn() }
    await flushPromises()

    // Un conflicto del endpoint B, con el refId pelado, sí entra.
    conflict('R1')
    await flushPromises()
    expect(wrapper.vm.conflictData).not.toBeNull()

    wrapper.vm.clearConflict()

    // Pero el del endpoint D llega como 'R1::s1::o2' y el guard exige igualdad exacta.
    conflict('R1::s1::o2')
    await flushPromises()
    expect(wrapper.vm.conflictData).toBeNull()

    wrapper.destroy()
  })
})
