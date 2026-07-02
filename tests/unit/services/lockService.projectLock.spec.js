import LockService from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({
  store: {
    state: { isOnline: true },
    getters: { isLoggedIn: true }
  }
}))
Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => 'token'), removeItem: jest.fn(), setItem: jest.fn() },
  writable: true
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  LockService.projectId = null
  LockService.isLocked = false
  LockService.heartbeatTimer = null
  LockService.idleTimer = null
  LockService.currentRef = null
  LockService.refLocked = false
  global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
})

describe('LockService.release()', () => {
  it('sends a keepalive DELETE request so it survives page unload', async () => {
    LockService.projectId = 'proj1'
    LockService.isLocked = true

    await LockService.release()

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/lock/proj1',
      expect.objectContaining({
        method: 'DELETE',
        keepalive: true,
        headers: expect.objectContaining({ Authorization: 'Bearer test' })
      })
    )
  })
})

describe('LockService pagehide handling', () => {
  it('releases the project lock when the page is being unloaded', () => {
    LockService.projectId = 'proj1'
    LockService.isLocked = true
    const releaseSpy = jest.spyOn(LockService, 'release').mockImplementation(() => Promise.resolve())

    window.dispatchEvent(new Event('pagehide'))

    expect(releaseSpy).toHaveBeenCalled()
  })

  it('releases the ref lock when the page is being unloaded', () => {
    LockService.currentRef = { projectId: 'proj1', refId: 'ref1' }
    LockService.refLocked = true
    const releaseRefSpy = jest.spyOn(LockService, 'releaseRef').mockImplementation(() => Promise.resolve())

    window.dispatchEvent(new Event('pagehide'))

    expect(releaseRefSpy).toHaveBeenCalled()
  })

  it('does nothing when no lock is held', () => {
    const releaseSpy = jest.spyOn(LockService, 'release').mockImplementation(() => Promise.resolve())
    const releaseRefSpy = jest.spyOn(LockService, 'releaseRef').mockImplementation(() => Promise.resolve())

    window.dispatchEvent(new Event('pagehide'))

    expect(releaseSpy).not.toHaveBeenCalled()
    expect(releaseRefSpy).not.toHaveBeenCalled()
  })
})
