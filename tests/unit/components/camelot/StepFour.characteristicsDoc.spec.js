import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'
import Api from '@/utils/Api'

/**
 * `saveField` decidía crear o actualizar mirando UN dato local: `characteristics.id`. Y ese
 * campo vale `undefined` en dos situaciones que no se parecen en nada:
 *
 *   - no existe todavía el documento del proyecto (crear está bien), y
 *   - no lo pudimos leer: el `.catch` de `getCharacteristics` sólo muestra un toast y deja
 *     el estado inicial `{ items: [] }`, sin id; o la respuesta del GET todavía no llegó
 *     cuando el auto-guardado de 1,5 s disparó.
 *
 * En los dos últimos casos crear es lo peor que se puede hacer: el proyecto queda con dos
 * documentos, y como `getCharacteristics` lee `response.data[0]` sin orden garantizado, la
 * próxima lectura puede caer en el que no tiene los datos. Medido en la base: un proyecto
 * con 13 documentos creados de a uno, con minutos de diferencia, el mismo día.
 *
 * Quién sabe si el documento existe es el servidor, así que se le pregunta antes de crear.
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
  Api.post.mockResolvedValue({ data: { id: 'nuevo1' } })
})

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
})

describe('StepFour — no crear un segundo documento de características', () => {
  it('con el documento cargado actualiza, sin preguntar de más', async () => {
    wrapper = await editando(createWrapper(), { id: 'chars1', items: [] })
    Api.get.mockClear()

    wrapper.vm.onAutoSaveField('texto')
    await flushPromises()

    expect(Api.patch).toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    // El camino normal no paga una consulta extra.
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('sin id local, si el servidor YA tiene documento, lo actualiza en vez de crear otro', async () => {
    wrapper = await editando(createWrapper(), { items: [] })
    // Lo que la carga no pudo traer (falló, o llegó tarde) sí está en el servidor.
    Api.get.mockResolvedValue({ data: [{ id: 'chars1', items: [] }] })

    wrapper.vm.onAutoSaveField('texto')
    await flushPromises()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).toHaveBeenCalledWith(
      expect.stringContaining('/isoqf_characteristics/chars1/item/R1'),
      expect.any(Object)
    )
  })

  it('sin id y sin documento en el servidor, crea: es la primera vez', async () => {
    wrapper = await editando(createWrapper(), { items: [] })
    Api.get.mockResolvedValue({ data: [] })

    wrapper.vm.onAutoSaveField('texto')
    await flushPromises()
    await flushPromises()

    expect(Api.post).toHaveBeenCalled()
  })

  it('si no se puede verificar, no crea a ciegas y lo dice', async () => {
    wrapper = await editando(createWrapper(), { items: [] })
    Api.get.mockRejectedValue(new Error('red caída'))

    wrapper.vm.onAutoSaveField('texto')
    await flushPromises()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
    expect(notify.error).toHaveBeenCalled()
  })

  // Adoptar el id no puede traerse puesto el documento del servidor: lo que se está
  // escribiendo vive en el estado local y el PATCH es por ítem.
  it('adopta el id encontrado sin pisar lo que se está escribiendo', async () => {
    wrapper = await editando(createWrapper(), { items: [{ ref_id: 'R1', research_extractedData: 'lo mío' }] })
    Api.get.mockResolvedValue({ data: [{ id: 'chars1', items: [{ ref_id: 'R1', research_extractedData: 'lo viejo del servidor' }] }] })

    wrapper.vm.onAutoSaveField('texto nuevo')
    await flushPromises()
    await flushPromises()

    expect(wrapper.vm.characteristics.id).toBe('chars1')
    const enviado = Api.patch.mock.calls[0][1]
    expect(enviado.research_extractedData).toBe('texto nuevo')
  })
})
