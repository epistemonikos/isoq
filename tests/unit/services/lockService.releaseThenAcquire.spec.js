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
Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => 'token'), removeItem: jest.fn(), setItem: jest.fn() },
  writable: true
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})
  jest.spyOn(LockService, 'stopRefHeartbeat').mockImplementation(() => {})
  LockService.refLocks.clear()
  LockService.pendingRefReleases.clear()
})

/**
 * Cerrar y reabrir el modal de Propiedades manda un DELETE y un POST de la misma clave casi
 * juntos. Si el DELETE llega último, borra el lock recién tomado y el editor queda
 * habilitado sin lock detrás.
 */
describe('LockService — soltar y volver a tomar la misma clave', () => {
  it('el POST del acquire sale recién cuando terminó el DELETE del release', async () => {
    const order = []
    let finishDelete
    global.fetch = jest.fn(() => new Promise((resolve) => {
      finishDelete = () => { order.push('delete'); resolve({ ok: true }) }
    }))
    axios.post.mockImplementation(() => {
      order.push('post')
      return Promise.resolve({ data: { status: true } })
    })
    LockService.refLocks.set('project_properties', 'p1')

    const releasing = LockService.releaseRef('project_properties')
    const acquiring = LockService.acquireRef('p1', 'project_properties')
    await Promise.resolve()
    await Promise.resolve()
    expect(order).toEqual([])

    finishDelete()
    await releasing
    await acquiring
    expect(order).toEqual(['delete', 'post'])
    expect(LockService.heldRefs()).toEqual(['project_properties'])
    expect(LockService.pendingRefReleases.size).toBe(0)
  })

  it('sin release en vuelo el acquire no espera nada', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    await LockService.acquireRef('p1', 'project_properties')
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('un release de OTRA clave no demora el acquire', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) // nunca termina
    axios.post.mockResolvedValue({ data: { status: true } })
    LockService.refLocks.set('R1', 'p1')

    LockService.releaseRef('R1')
    await LockService.acquireRef('p1', 'project_properties')
    expect(axios.post).toHaveBeenCalledTimes(1)
  })
})
