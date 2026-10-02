import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import StepFour from '@/components/camelot/StepFour.vue'

/**
 * REGRESIÓN. Estos tests nacieron como caracterización —describían el defecto— y se
 * invirtieron al arreglarlo (commit del tramo 4).
 *
 * El canal de conflicto (`ref-lock-conflict` -> RefLockConflictModal) es lo que rescata el
 * texto que el servidor rechazó, y es la promesa que sostiene la decisión de producto "al
 * expirar se cierra igual y el texto se preserva". No llegaba por ninguno de los dos
 * caminos que el temporizador produce:
 *
 *   Paso 3 — `resetModal` anula `localReference` al cerrar y el guard comparaba contra él,
 *            así que un 409 en vuelo al momento del cierre se descartaba.
 *   Paso 4 — el guard comparaba contra `this.refId` mientras los conflictos del endpoint D
 *            llegan con la clave compuesta `ref::sK::oI`: nunca coincidían.
 *
 * Que el texto quede en localStorage no alcanza: el único código que vuelve a tocar esas
 * claves es un `removeItem`. Si el modal no abre, nadie lo ve nunca.
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

describe('canal de conflicto — el 409 que llega después del cierre', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('Paso 3: un conflicto que llega DESPUÉS de cerrar el modal abre igual el rescate', async () => {
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

    // El flujo del temporizador: hay un guardado en vuelo, se cierra, y el 409 llega
    // cuando `localReference` ya es null.
    wrapper.vm.clearConflict()
    await wrapper.setData({ isSaving: true })
    wrapper.vm.resetModal()
    await flushPromises()
    expect(wrapper.vm.localReference).toBeNull()

    conflict('R1')
    await flushPromises()

    expect(wrapper.vm.conflictData).not.toBeNull()
    expect(wrapper.vm.conflictLockedBy).toBe('Ana')

    // Consumido una sola vez: `ref-lock-conflict` también se emite por 403 y por el
    // replay de la cola, y no queremos que una escritura de fondo reabra el rescate.
    wrapper.vm.clearConflict()
    conflict('R1')
    await flushPromises()
    expect(wrapper.vm.conflictData).toBeNull()

    wrapper.destroy()
  })

  it('un conflicto de OTRO estudio no abre el rescate', async () => {
    const wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks: commonMocks
    })
    await wrapper.setData({ refId: 'R1', isModalOpen: true })
    wrapper.vm.$refs.conflictModal = { show: jest.fn() }
    await flushPromises()

    conflict('R9')
    conflict('R9::s1::o2')
    await flushPromises()

    expect(wrapper.vm.conflictData).toBeNull()
    wrapper.destroy()
  })

  // El estudio abierto empieza igual que el retenido, pero no son el mismo: sin el
  // guard de igualdad exacta un prefijo compartido abriría el rescate del vecino.
  it('no confunde un estudio cuyo id empieza igual que otro', async () => {
    const wrapper = shallowMount(StepFour, {
      localVue,
      propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
      mocks: commonMocks
    })
    await wrapper.setData({ refId: 'R1', isModalOpen: true })
    wrapper.vm.$refs.conflictModal = { show: jest.fn() }
    await flushPromises()

    conflict('R1X::s0::o0')
    await flushPromises()

    expect(wrapper.vm.conflictData).toBeNull()
    wrapper.destroy()
  })

  it('Paso 4: un conflicto de celda (clave compuesta) abre el rescate', async () => {
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

    // Y el del endpoint D llega como 'R1::s1::o2': se normaliza con baseRefOf.
    conflict('R1::s1::o2')
    await flushPromises()
    expect(wrapper.vm.conflictData).not.toBeNull()
    // La clave que se le pasa al modal es la CRUDA: RefLockConflictModal hace
    // localStorage.removeItem('conflict_ref_' + refId), y con la base quedaría huérfana.
    expect(wrapper.vm.conflictRefId).toBe('R1::s1::o2')

    wrapper.destroy()
  })
})
