import axios from 'axios'
import LockService from '@/services/lockService'

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
  LockService.currentRef = null
  LockService.refLocked = false
  LockService.refLockedBy = null
  LockService.refHeartbeatTimer = null
})

describe('LockService.acquireRef()', () => {
  it('retorna { success: true } y activa heartbeat cuando el backend acepta', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    const startSpy = jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})

    const result = await LockService.acquireRef('proj1', 'ref1')

    expect(result).toEqual({ success: true })
    expect(LockService.refLocked).toBe(true)
    expect(LockService.currentRef).toEqual({ projectId: 'proj1', refId: 'ref1' })
    expect(startSpy).toHaveBeenCalled()
  })

  it('retorna { success: false, lockedBy } cuando el backend responde 409', async () => {
    const err = { response: { status: 409, data: { locked_by: 'Ana López' } } }
    axios.post.mockRejectedValue(err)

    const result = await LockService.acquireRef('proj1', 'ref1')

    expect(result).toEqual({ success: false, lockedBy: 'Ana López' })
    expect(LockService.refLocked).toBe(false)
  })

  it('retorna { success: true } sin llamar axios cuando isEnabled es false', async () => {
    jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(false)
    const result = await LockService.acquireRef('proj1', 'ref1')
    expect(axios.post).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })
})

describe('LockService.releaseRef()', () => {
  it('llama DELETE y limpia estado', async () => {
    axios.delete.mockResolvedValue({})
    LockService.currentRef = { projectId: 'proj1', refId: 'ref1' }
    LockService.refLocked = true

    await LockService.releaseRef()

    expect(axios.delete).toHaveBeenCalledWith(
      '/api/lock/proj1/ref/ref1',
      expect.objectContaining({ headers: expect.any(Object) })
    )
    expect(LockService.currentRef).toBeNull()
    expect(LockService.refLocked).toBe(false)
  })

  it('dispara el evento ref-locks-changed tras liberar', async () => {
    axios.delete.mockResolvedValue({})
    const spy = jest.spyOn(window, 'dispatchEvent')
    LockService.currentRef = { projectId: 'proj1', refId: 'ref1' }
    LockService.refLocked = true

    await LockService.releaseRef()

    expect(spy.mock.calls.some(([e]) => e.type === 'ref-locks-changed')).toBe(true)
    spy.mockRestore()
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
