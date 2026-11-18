import {
  SESSION_EXPIRED, SESSION_RESTORED,
  isSessionExpired, markSessionExpired, clearSessionExpired, isSessionExpiredRejection
} from '@/utils/sessionExpiry'

// La sesión dura 8 h sin actividad y 7 días como máximo (servidor, 2026-10-06). Un 401 a
// mitad de trabajo no puede tratarse como un error de guardado ni como «tu acceso cambió»:
// es una sesión vencida, y lo que la persona estaba escribiendo tiene que sobrevivir a
// volver a entrar.
describe('sessionExpiry', () => {
  let dispatched

  beforeEach(() => {
    clearSessionExpired()
    dispatched = []
    jest.spyOn(window, 'dispatchEvent').mockImplementation(e => { dispatched.push(e.type); return true })
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => key === 'l_s' ? 'tok' : null)
  })

  afterEach(() => jest.restoreAllMocks())

  it('se marca una sola vez, aunque fallen varias peticiones a la vez', () => {
    expect(markSessionExpired()).toBe(true)
    expect(markSessionExpired()).toBe(false)
    expect(isSessionExpired()).toBe(true)
    expect(dispatched).toEqual([SESSION_EXPIRED])
  })

  it('al restaurarse avisa, y sólo si estaba vencida', () => {
    clearSessionExpired()
    expect(dispatched).toEqual([])
    markSessionExpired()
    clearSessionExpired()
    expect(isSessionExpired()).toBe(false)
    expect(dispatched).toEqual([SESSION_EXPIRED, SESSION_RESTORED])
  })

  const err = (url, status = 401) => ({ config: { url }, response: { status, data: {} } })

  it('un 401 de la API con sesión iniciada es una sesión vencida', () => {
    expect(isSessionExpiredRejection(err('/api/isoqf_findings/f1'))).toBe(true)
    expect(isSessionExpiredRejection(err('http://host/users/u1'))).toBe(true)
  })

  it('un 401 de /auth/ no lo es: ahí el 401 es la respuesta al intento de entrar', () => {
    expect(isSessionExpiredRejection(err('/auth/login'))).toBe(false)
    expect(isSessionExpiredRejection(err('http://host/auth/user'))).toBe(false)
  })

  it('sin token guardado no hay sesión que vencer', () => {
    Storage.prototype.getItem.mockImplementation(() => null)
    expect(isSessionExpiredRejection(err('/api/isoqf_findings/f1'))).toBe(false)
  })

  it('otros estados y errores de red no cuentan', () => {
    expect(isSessionExpiredRejection(err('/api/x', 403))).toBe(false)
    expect(isSessionExpiredRejection({ config: { url: '/api/x' } })).toBe(false)
    expect(isSessionExpiredRejection(undefined)).toBe(false)
  })
})
