import axios from 'axios'
import LockService from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({
  store: { state: { isOnline: true }, getters: { isLoggedIn: true } }
}))

// Quien tenía abierto un estudio se entera de que lo borraron por el latido, sin esperar
// a guardar. Lo que se fija acá es el camino: que `deleted_by` llegue al evento y que el
// aviso NO salga por `ref-lock-lost`, cuyos carteles dirían «lo tiene X».
describe('LockService — estudio borrado por otra persona', () => {
  let events
  const record = e => events.push({ type: e.type, detail: e.detail })

  beforeEach(() => {
    jest.clearAllMocks()
    events = []
    jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
    LockService.refLocks.clear()
    LockService.refHeartbeatTimer = null
    window.addEventListener('reference-deleted', record)
    window.addEventListener('ref-lock-lost', record)
  })
  afterEach(() => {
    window.removeEventListener('reference-deleted', record)
    window.removeEventListener('ref-lock-lost', record)
    jest.restoreAllMocks()
  })

  const deleted = (by) => ({ response: { status: 409, data: { reason: 'reference_deleted', deleted_by: by } } })

  it.each([
    ['R1', 'R1'],
    ['R1::s0::o2', 'R1'],
    ['ed1::ed::R1', 'R1']
  ])('el latido de %s avisa por el canal propio con el estudio %s', async (key, study) => {
    LockService.refLocks.set(key, 'proj1')
    axios.post.mockRejectedValue(deleted('Ana Pérez'))

    await LockService.refHeartbeat()

    expect(events).toEqual([{
      type: 'reference-deleted',
      detail: { refId: study, deletedBy: 'Ana Pérez', source: 'lock' }
    }])
    expect(LockService.refLocks.has(key)).toBe(false)
  })

  it('los demás motivos siguen saliendo por ref-lock-lost', async () => {
    LockService.refLocks.set('R1', 'proj1')
    axios.post.mockRejectedValue({ response: { status: 409, data: { reason: 'locked_by_other_user', locked_by: 'Bea' } } })

    await LockService.refHeartbeat()

    expect(events).toEqual([{
      type: 'ref-lock-lost',
      detail: { refId: 'R1', lockedBy: 'Bea', reason: 'locked_by_other_user' }
    }])
  })

  it('el acquire sobre un estudio borrado avisa y devuelve el motivo sin titular', async () => {
    axios.post.mockRejectedValue(deleted('Ana Pérez'))

    const result = await LockService.acquireRef('proj1', 'R1::s1::o0')

    expect(result).toEqual({ success: false, lockedBy: null, reason: 'reference_deleted' })
    expect(events).toEqual([{
      type: 'reference-deleted',
      detail: { refId: 'R1', deletedBy: 'Ana Pérez', source: 'lock' }
    }])
  })
})
