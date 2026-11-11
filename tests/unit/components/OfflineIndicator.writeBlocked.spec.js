import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import OfflineIndicator from '@/components/OfflineIndicator.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  isOnline: jest.fn(() => false),
  setOnline: jest.fn(),
  syncPendingOperations: jest.fn().mockResolvedValue(undefined),
  getPendingCount: jest.fn().mockResolvedValue(0)
}))

function createWrapper () {
  const wrapper = shallowMount(OfflineIndicator, {
    localVue,
    mocks: { $t: (key) => key, $store: { commit: jest.fn(), state: { isOnline: false } } },
    stubs: { 'font-awesome-icon': true }
  })
  const toast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, toast }
}

// Un alta sin conexión ya no se encola. Muchos llamadores sólo pasan el error a
// `printErrors`, que no muestra nada, así que el aviso vive en el componente montado
// siempre, como los de conflicto al sincronizar.
describe('OfflineIndicator.vue — una escritura que no se hizo por falta de conexión', () => {
  afterEach(() => jest.restoreAllMocks())

  it('avisa que no se guardó y que hay que reintentar con conexión', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('offline-write-blocked', { detail: { path: '/isoqf_lists' } }))

    expect(toast).toHaveBeenCalledWith(
      'offline.writeBlocked',
      expect.objectContaining({ title: 'offline.writeBlockedTitle', variant: 'warning' })
    )
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse', () => {
    const { wrapper, toast } = createWrapper()
    wrapper.destroy()

    window.dispatchEvent(new CustomEvent('offline-write-blocked', { detail: { path: '/isoqf_lists' } }))

    expect(toast).not.toHaveBeenCalled()
  })
})
