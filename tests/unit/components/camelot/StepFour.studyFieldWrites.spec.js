import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'
import { FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'

/**
 * Los campos de estudio (CamelotAssessmentCard) no escriben: emiten, y quien hace el PATCH
 * es StepFour. Por eso su escritura no viajaba por el canal de `flushPendingEdits` —lo que
 * ese canal recoge son las promesas que devuelven los editores— y el cierre del modal
 * soltaba el ref-lock del estudio con el PATCH todavía en vuelo.
 *
 * Es el mismo 409 `lock_not_held` que ya se midió para las celdas del assessment, con la
 * diferencia de que acá la promesa vive en el anfitrión: no hay que pedírsela a nadie, hay
 * que anotarla.
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

/** Deja el componente con el modal abierto y un campo de estudio en edición. */
async function editando (wrapper) {
  await flushPromises()
  wrapper.vm.openModal(0, ITEM, 0)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  await wrapper.setData({
    characteristics: { id: 'chars1', organization: 'org1', project_id: 'proj1', items: [] },
    editingField: { metaIndex: 0, itemIndex: 0, type: 'extractedData' },
    holdsStudyLock: true
  })
  return wrapper
}

let wrapper

beforeEach(() => {
  jest.clearAllMocks()
  LockService.isEnabled = true
  LockService.refLocks.clear()
  LockService.fetchRefLocks.mockResolvedValue([])
  LockService.acquireRef.mockResolvedValue({ success: true })
  Api.get.mockResolvedValue({ data: [] })
  Api.patch.mockResolvedValue({ data: {} })
})

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
})

describe('StepFour — el lock del estudio espera a la escritura de sus campos', () => {
  it('no suelta el lock mientras el guardado del campo sigue en vuelo', async () => {
    wrapper = await editando(createWrapper())
    let resolverPatch
    Api.patch.mockReturnValue(new Promise(r => { resolverPatch = () => r({ data: {} }) }))

    // Auto-guardado del campo: escribe y sigue editando.
    wrapper.vm.onAutoSaveField('texto a medio escribir')
    await flushPromises()

    // Se cierra el modal con el PATCH todavía viajando.
    wrapper.vm.onAssessmentModalClosed()
    await flushPromises()

    expect(LockService.releaseRef).not.toHaveBeenCalled()

    resolverPatch()
    await flushPromises()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalled()
  })

  it('el flush al salir arrastra la escritura del campo, no sólo la de las celdas', async () => {
    wrapper = await editando(createWrapper())
    let resolverPatch
    Api.patch.mockReturnValue(new Promise(r => { resolverPatch = () => r({ data: {} }) }))

    // La tarjeta responde al flush DURANTE el dispatch, que es síncrono: para cuando
    // flushBeforeLeaving devuelve, su PATCH ya salió. Emitir después no reproduce nada.
    const emitirComoLaTarjeta = () => wrapper.vm.onAutoSaveField('lo que el debounce tenía agendado')
    window.addEventListener(FLUSH_PENDING_EDITS, emitirComoLaTarjeta)
    const espera = wrapper.vm.flushBeforeLeaving()
    window.removeEventListener(FLUSH_PENDING_EDITS, emitirComoLaTarjeta)
    await flushPromises()

    let resuelta = false
    espera.then(() => { resuelta = true })
    await flushPromises()

    expect(resuelta).toBe(false)

    resolverPatch()
    await flushPromises()
    await flushPromises()

    expect(resuelta).toBe(true)
  })

  it('una escritura rechazada no deja el lock tomado para siempre', async () => {
    wrapper = await editando(createWrapper())
    Api.patch.mockRejectedValue({ response: { status: 409, data: { reason: 'lock_not_held' } } })

    wrapper.vm.onAutoSaveField('texto')
    await flushPromises()
    wrapper.vm.onAssessmentModalClosed()
    await flushPromises()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalled()
  })
})
