import axios from 'axios'
import LockService, { studyLockState } from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({
  store: {
    state: { isOnline: true },
    getters: { isLoggedIn: true }
  }
}))
// Mock localStorage para el check de 'l_s'
Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => 'token'), removeItem: jest.fn(), setItem: jest.fn() },
  writable: true
})

beforeEach(() => {
  jest.clearAllMocks()
  // Feature flag reads process.env, which is undefined under jest → force enabled.
  // The "isEnabled false" test overrides this spy explicitly.
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  LockService.refLocks.clear()
  LockService.refLockedBy = null
  LockService.refHeartbeatTimer = null
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
})

describe('LockService.acquireRef()', () => {
  it('retorna { success: true } y activa heartbeat cuando el backend acepta', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    const startSpy = jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})

    const result = await LockService.acquireRef('proj1', 'ref1')

    expect(result).toEqual({ success: true })
    expect(LockService.refLocked).toBe(true)
    expect(LockService.heldRefs()).toEqual(['ref1'])
    expect(startSpy).toHaveBeenCalled()
  })

  it('retorna { success: false, lockedBy } cuando el backend responde 409', async () => {
    const err = { response: { status: 409, data: { locked_by: 'Ana López' } } }
    axios.post.mockRejectedValue(err)

    const result = await LockService.acquireRef('proj1', 'ref1')

    expect(result).toEqual({ success: false, lockedBy: 'Ana López' })
    expect(LockService.refLocked).toBe(false)
  })

  it('retorna { success: false, permissionDenied: true } cuando el backend responde 403 (sin lockedBy)', async () => {
    const err = { response: { status: 403, data: {} } }
    axios.post.mockRejectedValue(err)

    const result = await LockService.acquireRef('proj1', 'ref1')

    expect(result).toEqual({ success: false, permissionDenied: true })
    expect(result.lockedBy).toBeUndefined()
    expect(LockService.refLocked).toBe(false)
    expect(LockService.refLockedBy).toBeNull()
  })

  it('retorna { success: true } sin llamar axios cuando isEnabled es false', async () => {
    jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(false)
    const result = await LockService.acquireRef('proj1', 'ref1')
    expect(axios.post).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })
})

describe('LockService.releaseRef()', () => {
  it('llama DELETE con keepalive y limpia estado', async () => {
    LockService.refLocks.set('ref1', 'proj1')

    await LockService.releaseRef()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/lock/proj1/ref/ref1',
      expect.objectContaining({ method: 'DELETE', keepalive: true, headers: expect.any(Object) })
    )
    expect(LockService.heldRefs()).toEqual([])
    expect(LockService.refLocked).toBe(false)
  })

  it('dispara el evento ref-locks-changed tras liberar', async () => {
    const spy = jest.spyOn(window, 'dispatchEvent')
    LockService.refLocks.set('ref1', 'proj1')

    await LockService.releaseRef()

    expect(spy.mock.calls.some(([e]) => e.type === 'ref-locks-changed')).toBe(true)
    spy.mockRestore()
  })
})

// Step 4 needs the bare study lock (for isoqf_characteristics, endpoint B) AND
// the leaf lock of the cell being edited (endpoint D) at the same time. The
// backend allows one user to hold both; the client has to be able to as well.
describe('LockService — holding several locks at once', () => {
  beforeEach(() => {
    axios.post.mockResolvedValue({ data: { status: true } })
    jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})
  })

  it('adds each acquired ref to the registry instead of evicting the previous one', async () => {
    await LockService.acquireRef('proj1', 'R1')
    await LockService.acquireRef('proj1', 'R1::s0::o0')

    expect(LockService.heldRefs()).toEqual(['R1', 'R1::s0::o0'])
  })

  it('releases a single ref by id and keeps the others', async () => {
    await LockService.acquireRef('proj1', 'R1')
    await LockService.acquireRef('proj1', 'R1::s0::o0')

    await LockService.releaseRef('R1::s0::o0')

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/lock/proj1/ref/R1::s0::o0',
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(LockService.heldRefs()).toEqual(['R1'])
    expect(LockService.refLocked).toBe(true)
  })

  it('releases every held ref when called with no argument', async () => {
    await LockService.acquireRef('proj1', 'R1')
    await LockService.acquireRef('proj1', 'R1::s0::o0')

    await LockService.releaseRef()

    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(LockService.heldRefs()).toEqual([])
  })

  it('does nothing when asked to release a ref it does not hold', async () => {
    await LockService.acquireRef('proj1', 'R1')

    await LockService.releaseRef('R2')

    expect(global.fetch).not.toHaveBeenCalled()
    expect(LockService.heldRefs()).toEqual(['R1'])
  })

  it('does not re-acquire a ref it already holds', async () => {
    await LockService.acquireRef('proj1', 'R1')
    axios.post.mockClear()

    const result = await LockService.acquireRef('proj1', 'R1')

    expect(result).toEqual({ success: true })
    expect(axios.post).not.toHaveBeenCalled()
  })

  // Opening the Step 4 modal asks for the leaf lock twice in the same tick (an
  // explicit call plus the activeLeafRef watcher). The `has()` guard cannot
  // catch that: neither call has registered the ref yet when the other starts.
  it('coalesces concurrent acquires of the same ref into one request', async () => {
    const [a, b] = await Promise.all([
      LockService.acquireRef('proj1', 'R1::s0::o2'),
      LockService.acquireRef('proj1', 'R1::s0::o2')
    ])

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(a).toEqual({ success: true })
    expect(b).toEqual({ success: true })
    expect(LockService.heldRefs()).toEqual(['R1::s0::o2'])
  })

  it('still issues one request per distinct ref when they overlap', async () => {
    await Promise.all([
      LockService.acquireRef('proj1', 'R1'),
      LockService.acquireRef('proj1', 'R1::s0::o2')
    ])

    expect(axios.post).toHaveBeenCalledTimes(2)
    expect(LockService.heldRefs().sort()).toEqual(['R1', 'R1::s0::o2'])
  })

  it('lets a later acquire retry after a failed one', async () => {
    axios.post.mockRejectedValueOnce({ response: { status: 409, data: { locked_by: 'Ana' } } })
    const first = await LockService.acquireRef('proj1', 'R1::s0::o2')
    expect(first).toEqual({ success: false, lockedBy: 'Ana' })

    axios.post.mockResolvedValue({ data: { status: true } })
    const second = await LockService.acquireRef('proj1', 'R1::s0::o2')

    expect(second).toEqual({ success: true })
  })
})

describe('LockService.refHeartbeat() — several locks', () => {
  it('beats for every held ref', async () => {
    LockService.refLocks.set('R1', 'proj1')
    LockService.refLocks.set('R1::s0::o0', 'proj1')
    axios.post.mockResolvedValue({ data: { status: true } })

    await LockService.refHeartbeat()

    expect(axios.post).toHaveBeenCalledWith(
      '/api/lock/proj1/ref/R1/heartbeat', {}, expect.any(Object)
    )
    expect(axios.post).toHaveBeenCalledWith(
      '/api/lock/proj1/ref/R1::s0::o0/heartbeat', {}, expect.any(Object)
    )
  })

  it('drops only the ref whose heartbeat was rejected, and names it in the event', async () => {
    LockService.refLocks.set('R1', 'proj1')
    LockService.refLocks.set('R1::s0::o0', 'proj1')
    axios.post.mockImplementation((url) => (
      url.includes('R1::s0::o0')
        ? Promise.reject({ response: { status: 409, data: {} } })
        : Promise.resolve({ data: { status: true } })
    ))
    const spy = jest.spyOn(window, 'dispatchEvent')

    await LockService.refHeartbeat()

    expect(LockService.heldRefs()).toEqual(['R1'])
    const lost = spy.mock.calls.map(([e]) => e).find(e => e.type === 'ref-lock-lost')
    expect(lost.detail).toEqual({ refId: 'R1::s0::o0' })
    spy.mockRestore()
  })

  it('stops the timer once the last lock is gone', async () => {
    LockService.refLocks.set('R1', 'proj1')
    const stopSpy = jest.spyOn(LockService, 'stopRefHeartbeat')
    axios.post.mockRejectedValue({ response: { status: 409, data: {} } })

    await LockService.refHeartbeat()

    expect(LockService.heldRefs()).toEqual([])
    expect(stopSpy).toHaveBeenCalled()
    stopSpy.mockRestore()
  })
})

describe('studyLockState()', () => {
  const locks = [
    { ref_id: 'R1', user_name: 'Ana López' },
    { ref_id: 'R2::s0::o0', user_name: 'Beto Ruiz' },
    { ref_id: 'R2::s1::o3', user_name: 'Beto Ruiz' },
    { ref_id: 'R3::s0::o0', user_name: 'Yo Mismo' }
  ]

  it('reports a study taken whole by someone else', () => {
    const state = studyLockState(locks, 'R1', 'Yo Mismo')
    expect(state.wholeStudyBlockedBy).toBe('Ana López')
    expect(state.saveWholeStudyBlocked).toBe(true)
    expect(state.lockedLeaves.size).toBe(0)
  })

  it('reports individual leaves taken by someone else', () => {
    const state = studyLockState(locks, 'R2', 'Yo Mismo')
    expect(state.wholeStudyBlockedBy).toBeNull()
    expect([...state.lockedLeaves.keys()]).toEqual(['R2::s0::o0', 'R2::s1::o3'])
    expect(state.lockedLeaves.get('R2::s0::o0')).toBe('Beto Ruiz')
    // A leaf held by another user still blocks any save that goes through B.
    expect(state.saveWholeStudyBlocked).toBe(true)
  })

  it('ignores my own locks', () => {
    const state = studyLockState(locks, 'R3', 'Yo Mismo')
    expect(state.wholeStudyBlockedBy).toBeNull()
    expect(state.lockedLeaves.size).toBe(0)
    expect(state.saveWholeStudyBlocked).toBe(false)
  })

  it('reports a free study as free', () => {
    const state = studyLockState(locks, 'R9', 'Yo Mismo')
    expect(state.wholeStudyBlockedBy).toBeNull()
    expect(state.saveWholeStudyBlocked).toBe(false)
  })

  // Matching by prefix would make R1X a child of R1 and invent a conflict.
  it('does not treat a study whose id starts with another as its leaf', () => {
    const state = studyLockState(
      [{ ref_id: 'R1X::s0::o0', user_name: 'Ana López' }], 'R1', 'Yo Mismo'
    )
    expect(state.saveWholeStudyBlocked).toBe(false)
  })

  it('survives an empty or missing lock list', () => {
    expect(studyLockState([], 'R1', 'Yo').saveWholeStudyBlocked).toBe(false)
    expect(studyLockState(null, 'R1', 'Yo').saveWholeStudyBlocked).toBe(false)
  })
})

describe('LockService.acquireRef() — evento', () => {
  it('dispara ref-locks-changed tras adquirir con éxito', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})
    const spy = jest.spyOn(window, 'dispatchEvent')

    await LockService.acquireRef('proj1', 'ref1')

    expect(spy.mock.calls.some(([e]) => e.type === 'ref-locks-changed')).toBe(true)
    spy.mockRestore()
  })
})

describe('LockService.fetchRefLocks()', () => {
  it('retorna lista de locks activos del proyecto', async () => {
    axios.get.mockResolvedValue({ data: [{ ref_id: 'ref1', user_name: 'Ana López' }] })
    const result = await LockService.fetchRefLocks('proj1')
    expect(result).toEqual([{ ref_id: 'ref1', user_name: 'Ana López' }])
  })

  it('retorna [] cuando hay error de red', async () => {
    axios.get.mockRejectedValue(new Error('Network error'))
    const result = await LockService.fetchRefLocks('proj1')
    expect(result).toEqual([])
  })
})
