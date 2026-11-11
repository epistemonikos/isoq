import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import Api from '@/utils/Api'

/**
 * Qué avisa el guardado de un campo del estudio cuando falla. Un evento, un canal: lo que
 * ya avisó otro canal (lock, 403, estudio borrado, sin conexión) no suma «no se pudo
 * guardar», y el conflicto de versión —que antes no tenía canal en el Paso 4 y caía en ese
 * genérico, cuyo «intente nuevamente» manda otra vez la misma versión vieja— es un cartel
 * del modal con cómo seguir.
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
const notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }

function createWrapper () {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
    mocks: {
      $t: key => key,
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: notify,
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

/** Modal abierto y un campo de estudio en edición, con el id que se le indique. */
async function editando (wrapper, characteristics) {
  await flushPromises()
  wrapper.vm.openModal(0, ITEM, 0)
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  await wrapper.setData({
    characteristics,
    editingField: { metaIndex: 0, itemIndex: 0, type: 'extractedData' },
    holdsStudyLock: true
  })
  return wrapper
}

let wrapper

beforeEach(() => {
  jest.clearAllMocks()
  Api.get.mockResolvedValue({ data: [] })
  Api.patch.mockResolvedValue({ data: {} })
})

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
})

const rechazo = (status, data = {}) => Object.assign(new Error(String(status)), {
  config: { url: '/isoqf_characteristics/chars1/item/R1' },
  response: { status, data }
})

describe('StepFour — errores al guardar un campo del estudio', () => {
  it('un conflicto de versión es un cartel del modal, sin toast', async () => {
    wrapper = await editando(createWrapper(), { id: 'chars1', items: [] })
    Api.patch.mockRejectedValue(rechazo(409, { reason: 'version_conflict' }))

    await wrapper.vm.onSaveField('texto')
    await flushPromises()

    expect(notify.error).not.toHaveBeenCalled()
    expect(wrapper.find('[data-testid="study-version-conflict"]').exists()).toBe(true)
  })

  // Lo escrito queda a la vista para rehacerlo: recargar es decisión de la persona.
  it('el conflicto de versión no recarga solo; el botón trae la versión al día', async () => {
    wrapper = await editando(createWrapper(), { id: 'chars1', items: [] })
    Api.patch.mockRejectedValue(rechazo(409, { reason: 'version_conflict' }))
    await wrapper.vm.onSaveField('texto')
    await flushPromises()
    Api.get.mockClear()

    wrapper.vm.reloadAfterStudyVersionConflict()
    await flushPromises()

    expect(Api.get).toHaveBeenCalled()
    expect(wrapper.vm.studyVersionConflict).toBe(false)
  })

  it('un estudio borrado no suma «no se pudo guardar»', async () => {
    wrapper = await editando(createWrapper(), { id: 'chars1', items: [] })
    Api.patch.mockRejectedValue(rechazo(409, { reason: 'reference_deleted' }))

    await wrapper.vm.onSaveField('texto')
    await flushPromises()

    expect(notify.error).not.toHaveBeenCalled()
  })

  it('un fallo del servidor sí avisa', async () => {
    wrapper = await editando(createWrapper(), { id: 'chars1', items: [] })
    Api.patch.mockRejectedValue(rechazo(500))

    await wrapper.vm.onSaveField('texto')
    await flushPromises()

    expect(notify.error).toHaveBeenCalledWith('notifications.save_error')
  })
})
