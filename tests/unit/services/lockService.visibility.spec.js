import LockService from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({
  store: {
    state: { isOnline: true },
    getters: { isLoggedIn: true }
  }
}))

function setVisibility (state) {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  LockService.refLocks.clear()
  LockService.projectId = null
  LockService.isLocked = false
})

afterEach(() => jest.restoreAllMocks())

// Chrome throttles setInterval in background tabs down to once a minute — below the
// server's 60s lock TTL. The lock lapses, someone else takes the study, and the user
// comes back to a form that still looks editable. Beating on the way back in is what
// turns that into a read-only form before they type.
describe('LockService — revalidación al volver la pestaña al frente', () => {
  it('late los ref-locks apenas la pestaña vuelve a estar visible', () => {
    const refSpy = jest.spyOn(LockService, 'refHeartbeat').mockResolvedValue(undefined)
    LockService.refLocks.set('ref1', 'proj1')
    setVisibility('visible')

    document.dispatchEvent(new Event('visibilitychange'))

    expect(refSpy).toHaveBeenCalled()
  })

  it('late el lock de proyecto apenas la pestaña vuelve a estar visible', () => {
    const beat = jest.spyOn(LockService, 'heartbeat').mockResolvedValue(undefined)
    LockService.projectId = 'proj1'
    LockService.isLocked = true
    setVisibility('visible')

    document.dispatchEvent(new Event('visibilitychange'))

    expect(beat).toHaveBeenCalled()
  })

  it('no late al esconderse la pestaña: ahí no hay nada que revalidar', () => {
    const refSpy = jest.spyOn(LockService, 'refHeartbeat').mockResolvedValue(undefined)
    LockService.refLocks.set('ref1', 'proj1')
    setVisibility('hidden')

    document.dispatchEvent(new Event('visibilitychange'))

    expect(refSpy).not.toHaveBeenCalled()
  })

  it('no llama al servidor si no sostenemos ningún lock', () => {
    const refSpy = jest.spyOn(LockService, 'refHeartbeat').mockResolvedValue(undefined)
    const beat = jest.spyOn(LockService, 'heartbeat').mockResolvedValue(undefined)
    setVisibility('visible')

    document.dispatchEvent(new Event('visibilitychange'))

    expect(refSpy).not.toHaveBeenCalled()
    expect(beat).not.toHaveBeenCalled()
  })
})
