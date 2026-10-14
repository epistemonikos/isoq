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

const rechazo = (reason, n = 1) => Array.from({ length: n }, (_, i) => ({ status: 0, method: 'PATCH', endpoint: `/api/x/${i}`, reason }))

// Lo que se hizo sin conexión y el servidor no aceptó al volver. No hay ningún editor
// abierto cuando llega —la persona editó hace rato—, así que el aviso vive acá.
describe('OfflineIndicator.vue — cambios hechos sin conexión que no se guardaron', () => {
  afterEach(() => jest.restoreAllMocks())

  it('un aviso por motivo, con la cantidad, y que no se oculte solo: es trabajo perdido', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('offline-replay-rejected', {
      detail: { rejected: [...rechazo('forbidden', 2), ...rechazo('gone')] }
    }))

    expect(toast).toHaveBeenCalledTimes(2)
    expect(toast).toHaveBeenCalledWith(
      `offline.replayRejected.forbidden|${JSON.stringify({ count: 2 })}`,
      expect.objectContaining({ title: 'offline.replayRejectedTitle', variant: 'danger', noAutoHide: true })
    )
    expect(toast).toHaveBeenCalledWith(
      `offline.replayRejected.gone|${JSON.stringify({ count: 1 })}`,
      expect.anything()
    )
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse', () => {
    const { wrapper, toast } = createWrapper()
    wrapper.destroy()

    window.dispatchEvent(new CustomEvent('offline-replay-rejected', { detail: { rejected: rechazo('gone') } }))

    expect(toast).not.toHaveBeenCalled()
  })
})
