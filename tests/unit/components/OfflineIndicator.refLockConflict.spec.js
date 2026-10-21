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

function createWrapper () {
  const wrapper = shallowMount(OfflineIndicator, {
    localVue,
    mocks: { $t: (key) => key, $store: { commit: jest.fn(), state: { isOnline: true } } },
    stubs: { 'font-awesome-icon': true }
  })
  const toast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, toast }
}

// A replay conflict happens when nothing is open: the editor that made the change was
// closed long before the network came back. Without a global listener the payload was
// stashed in localStorage and the user was never told.
describe('OfflineIndicator.vue — aviso global de conflicto al sincronizar', () => {
  afterEach(() => jest.restoreAllMocks())

  it('avisa quién tomó la entidad cuando el conflicto trae usuario', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
      detail: { refId: 'ref1', failedData: { column_0: 'texto' }, lockedBy: 'Ana Pérez', source: 'replay' }
    }))

    expect(toast).toHaveBeenCalledWith(
      'offline.syncConflict',
      expect.objectContaining({ title: 'offline.syncConflictTitle', noAutoHide: true })
    )
    wrapper.destroy()
  })

  it('usa el mensaje sin usuario cuando el rechazo fue lock_not_held (locked_by nulo)', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
      detail: { refId: 'ref1', failedData: { column_0: 'texto' }, lockedBy: '', source: 'replay' }
    }))

    expect(toast).toHaveBeenCalledWith(
      'offline.syncConflictNoUser',
      expect.objectContaining({ title: 'offline.syncConflictTitle' })
    )
    wrapper.destroy()
  })

  // The offline wording ("a change you made offline") is a lie for a request that
  // failed live: the user was online, somebody simply took the entity first. Reported
  // from the field as "I don't think I was working offline".
  it('usa el texto de conflicto en vivo cuando el 409 no vino de la cola offline', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
      detail: { refId: 'ref1', failedData: {}, lockedBy: 'Ana Pérez', source: 'live' }
    }))

    expect(toast).toHaveBeenCalledWith(
      'lock.live_conflict',
      expect.objectContaining({ title: 'lock.live_conflict_title', noAutoHide: true })
    )
    wrapper.destroy()
  })

  it('usa el texto en vivo sin usuario cuando el 409 no trae quién lo tomó', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
      detail: { refId: 'ref1', failedData: {}, lockedBy: '', source: 'live' }
    }))

    expect(toast).toHaveBeenCalledWith(
      'lock.live_conflict_no_user',
      expect.objectContaining({ title: 'lock.live_conflict_title' })
    )
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const { wrapper } = createWrapper()
    wrapper.destroy()
    expect(removeSpy).toHaveBeenCalledWith('ref-lock-conflict', expect.any(Function))
  })
})
