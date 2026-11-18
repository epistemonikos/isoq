import axios from 'axios'
import LockService from '@/services/lockService'
import { isSessionExpired, clearSessionExpired } from '@/utils/sessionExpiry'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({
  getHeaders: (config = {}) => ({
    Authorization: 'Bearer test',
    ...(config.background ? { 'X-Background-Request': '1' } : {})
  })
}))
jest.mock('@/store', () => ({
  store: {
    state: { isOnline: true },
    getters: { isLoggedIn: true }
  }
}))

beforeEach(() => {
  jest.clearAllMocks()
  clearSessionExpired()
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => key === 'l_s' ? 'tok' : null)
  LockService.refLocks.clear()
  LockService.refHeartbeatTimer = null
})

afterEach(() => {
  LockService.stopRefHeartbeat()
  jest.restoreAllMocks()
})

const headersOf = (call) => call[call.length - 1].headers

describe('LockService — sesión vencida', () => {
  // El 401 se trataba como un 403: soltaba el lock, ponía el editor en solo lectura y
  // decía «tu acceso cambió a solo lectura». Nada de eso es cierto: la persona sigue
  // teniendo acceso, sólo tiene que volver a entrar, y el lock lo recupera el latido
  // siguiente (el servidor resucita un lock propio vencido a propósito).
  it('un 401 en el latido no suelta el lock ni anuncia que se perdió', async () => {
    LockService.refLocks.set('R1', 'proj1')
    axios.post.mockRejectedValue({ response: { status: 401, data: {} } })
    const spy = jest.spyOn(window, 'dispatchEvent')

    await LockService.refHeartbeat()

    expect(LockService.heldRefs()).toEqual(['R1'])
    const types = spy.mock.calls.map(([e]) => e.type)
    expect(types).not.toContain('ref-lock-lost')
    expect(isSessionExpired()).toBe(true)
  })

  it('el latido viaja como petición de fondo', async () => {
    LockService.refLocks.set('R1', 'proj1')
    axios.post.mockResolvedValue({ data: { status: true } })

    await LockService.refHeartbeat()

    expect(headersOf(axios.post.mock.calls[0])['X-Background-Request']).toBe('1')
  })

  it('tomar un lock es una acción del usuario, no de fondo', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})

    await LockService.acquireRef('proj1', 'R1')

    expect(headersOf(axios.post.mock.calls[0])['X-Background-Request']).toBeUndefined()
  })

  it('un 401 al tomar el lock lo dice, en vez de «error desconocido»', async () => {
    axios.post.mockRejectedValue({ response: { status: 401, data: {} } })

    const result = await LockService.acquireRef('proj1', 'R1')

    expect(result).toEqual({ success: false, sessionExpired: true })
  })

  it('el sondeo del listado de locks es de fondo; el del import, no', async () => {
    axios.get.mockResolvedValue({ data: [] })

    await LockService.fetchRefLocks('proj1')
    await LockService.probeRefLocks('proj1')

    expect(headersOf(axios.get.mock.calls[0])['X-Background-Request']).toBe('1')
    expect(headersOf(axios.get.mock.calls[1])['X-Background-Request']).toBeUndefined()
  })
})
