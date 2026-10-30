import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import OfflineIndicator from '@/components/OfflineIndicator.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  isOnline: jest.fn(() => true),
  setOnline: jest.fn(),
  syncPendingOperations: jest.fn().mockResolvedValue(undefined),
  getPendingCount: jest.fn().mockResolvedValue(0)
}))

// Interpola de verdad: lo que hay que probar es que el nombre de quien borró LLEGA al
// texto, y con la clave a secas un `{name}` perdido se vería igual que uno pasado.
const translate = (key, params) => (params ? `${key}|${JSON.stringify(params)}` : key)

function createWrapper () {
  const wrapper = shallowMount(OfflineIndicator, {
    localVue,
    mocks: { $t: translate, $store: { commit: jest.fn(), state: { isOnline: true } } },
    stubs: { 'font-awesome-icon': true }
  })
  const toast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, toast }
}

const fire = (detail) => window.dispatchEvent(new CustomEvent('reference-deleted', { detail }))

// Le llega a quien tenía el estudio abierto en otro hallazgo o en el Paso 3/4, que puede
// no estar mirando: el aviso no se oculta solo y nombra a quien lo borró.
describe('OfflineIndicator.vue — estudio borrado por otra persona', () => {
  afterEach(() => jest.restoreAllMocks())

  it('nombra a quien lo borró', () => {
    const { wrapper, toast } = createWrapper()
    fire({ refId: 'R1', deletedBy: 'Ana Pérez', source: 'lock' })

    expect(toast).toHaveBeenCalledWith(
      `reference_deleted.editor_closed_by|${JSON.stringify({ name: 'Ana Pérez' })}`,
      expect.objectContaining({ title: 'reference_deleted.title', noAutoHide: true })
    )
    wrapper.destroy()
  })

  it('elige el texto según el origen: no se guardó', () => {
    const { wrapper, toast } = createWrapper()
    fire({ refId: 'R1', deletedBy: null, source: 'write' })

    expect(toast.mock.calls[0][0]).toMatch(/^reference_deleted\.not_saved\|/)
    wrapper.destroy()
  })

  // El mismo borrado llega por el latido de cada lock del estudio y, si había un
  // guardado en vuelo, también por su rechazo: un aviso, no tres.
  it('un solo aviso por estudio aunque llegue por varios caminos', () => {
    const { wrapper, toast } = createWrapper()
    fire({ refId: 'R1', deletedBy: 'Ana', source: 'lock' })
    fire({ refId: 'R1', deletedBy: 'Ana', source: 'lock' })
    fire({ refId: 'R1', deletedBy: 'Ana', source: 'write' })
    fire({ refId: 'R2', deletedBy: 'Ana', source: 'lock' })

    expect(toast).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })
})
