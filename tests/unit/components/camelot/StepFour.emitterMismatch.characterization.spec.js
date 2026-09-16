import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

/**
 * CARACTERIZACIÓN — documenta el comportamiento ACTUAL, no el deseado.
 *
 * `saveField` (StepFour.vue:1070) saca el destino de la escritura de SU propio
 * `editingField`; la tarjeta emite únicamente su `editValue`, sin identificarse. Mientras
 * cada emisión llegue de la tarjeta que está en edición eso funciona — pero el debounce de
 * 1,5 s de `CamelotAssessmentCard` sobrevive al cambio de tarjeta (sólo lo cancelan sus
 * propios botones), así que existe una ventana donde el texto de una tarjeta se escribe en
 * el campo de otra.
 *
 * Estos tests pasan en VERDE describiendo el defecto. Es la evidencia de que el gate
 * `isEditing` planificado hace falta: el temporizador de inactividad va a flushear todos
 * los debounces a la vez, convirtiendo esta ventana de 1,5 s en el caso rutinario.
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

function createWrapper () {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

/** Deja el componente como si el modal estuviera abierto sobre el estudio R1. */
async function openedOnStudy (wrapper) {
  await wrapper.setData({
    refId: 'R1',
    isModalOpen: true,
    characteristics: {
      id: 'chars1',
      organization: 'org1',
      project_id: 'proj1',
      items: [{ ref_id: 'R1', authors: 'Autor 2020' }]
    }
  })
}

describe('StepFour.vue — desajuste emisor/destino en saveField (CARACTERIZACIÓN)', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it('escribe el texto de una tarjeta en el campo de OTRA cuando editingField ya cambió', async () => {
    const wrapper = createWrapper()
    await openedOnStudy(wrapper)

    // El usuario venía editando la tarjeta X = meta 0 / item 0 ('research_'), extractedData.
    // Antes de que su debounce de 1,5 s dispare, pasa a la tarjeta Y = item 2
    // ('researchers_') y encima a un campo de otro TIPO (comments).
    await wrapper.setData({
      editingField: { metaIndex: 0, itemIndex: 2, type: 'comments' }
    })

    // Ahora dispara el debounce que la tarjeta X había dejado agendado.
    wrapper.vm.onAutoSaveField('TEXTO QUE EL USUARIO ESCRIBIO EN RESEARCH')
    await flushPromises()

    const [, payload] = Api.patch.mock.calls[0]

    // El defecto: el texto aterriza en researchers_comments, el campo de Y.
    expect(payload.researchers_comments).toBe('TEXTO QUE EL USUARIO ESCRIBIO EN RESEARCH')
    // Y no queda nada en el campo que el usuario realmente estaba editando.
    expect(payload.research_extractedData).toBeUndefined()

    wrapper.destroy()
  })

  it('el mismo camino revienta si editingField quedó en nulls (el usuario apretó Cancel)', async () => {
    const wrapper = createWrapper()
    await openedOnStudy(wrapper)

    // `onCancelEditing` deja editingField en nulls; el debounce de la tarjeta sigue vivo.
    await wrapper.setData({
      editingField: { metaIndex: null, itemIndex: null, type: null }
    })

    // this.meta[null].items[null] -> TypeError. El PATCH nunca sale.
    expect(() => wrapper.vm.onAutoSaveField('texto huerfano')).toThrow(TypeError)
    expect(Api.patch).not.toHaveBeenCalled()

    wrapper.destroy()
  })
})
