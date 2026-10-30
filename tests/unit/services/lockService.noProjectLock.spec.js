import LockService from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({ store: { state: { isOnline: true }, getters: { isLoggedIn: true } } }))

/**
 * El lock de proyecto se retiró en los dos repos (2026-10-01): el servidor ya no tiene sus
 * endpoints, y mientras existió congelaba los pasos 1–4 para todo el equipo. Las propiedades
 * usan el ref-lock `project_properties` (propertiesLockMixin).
 *
 * Esto reemplaza a las afirmaciones `expect(LockService.acquire).not.toHaveBeenCalled()` que
 * vivían en los specs de componentes: verificaban contra un MOCK que no se llamara un método
 * que ya no existe, así que pasaban aunque alguien lo reintrodujera. Ésta mira el módulo real.
 */
describe('lockService — el lock de proyecto no vuelve', () => {
  it.each([
    'acquire', 'release', 'heartbeat', 'startHeartbeat', 'stopHeartbeat',
    'startIdleDetection', 'stopIdleDetection', 'resetIdleTimer', 'handleIdle', 'handleLockLost'
  ])('no expone %s', (name) => {
    expect(LockService[name]).toBeUndefined()
  })

  it('no guarda estado del lock de proyecto', () => {
    expect(LockService).not.toHaveProperty('projectId')
    expect(LockService).not.toHaveProperty('isLocked')
    expect(LockService).not.toHaveProperty('idleTimer')
  })

  it('los ref-locks siguen ahí', () => {
    expect(typeof LockService.acquireRef).toBe('function')
    expect(typeof LockService.releaseRef).toBe('function')
  })
})
