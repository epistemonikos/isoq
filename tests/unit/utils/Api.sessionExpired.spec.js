import axios from 'axios'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { getPendingOperations, removePendingOperation } from '@/services/db'
import { isSessionExpired, markSessionExpired, clearSessionExpired } from '@/utils/sessionExpiry'

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn().mockResolvedValue(1),
  getPendingOperations: jest.fn().mockResolvedValue([]),
  removePendingOperation: jest.fn().mockResolvedValue(undefined),
  getPendingOperationsCount: jest.fn().mockResolvedValue(0)
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))
jest.mock('@/utils/OfflineStrategies', () => ({ strategies: [] }))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn().mockResolvedValue(undefined),
    refLocks: new Map(),
    offlineRefs: new Map()
  }
}))

const errorHandler = axios.interceptors.response.use.mock.calls[0][1]

beforeEach(() => {
  jest.clearAllMocks()
  clearSessionExpired()
  Api.setOnline(true)
  LockService.acquireRef.mockResolvedValue({ success: true })
  axios.patch.mockResolvedValue({ data: {} })
  jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true)
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(key => key === 'l_s' ? 'tok' : null)
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe('Api.js interceptor — sesión vencida', () => {
  const makeError = (url, status = 401) => ({ config: { url, method: 'patch' }, response: { status, data: {} } })

  it('un 401 de la API marca la sesión vencida y sigue rechazando el error', async () => {
    const err = makeError('/api/isoqf_findings/f1')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(isSessionExpired()).toBe(true)
  })

  it('un 401 del login no la marca', async () => {
    const err = makeError('/auth/login')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(isSessionExpired()).toBe(false)
  })
})

// El servidor sólo desliza la ventana de 8 h con actividad del usuario. Lo que el cliente
// hace solo lo marca, o una pestaña abierta nunca dejaría vencer la sesión.
describe('Api.getHeaders() — peticiones de fondo', () => {
  it('con background lleva X-Background-Request', () => {
    expect(Api.getHeaders({ background: true })['X-Background-Request']).toBe('1')
  })

  it('sin background no lo lleva', () => {
    expect(Api.getHeaders()['X-Background-Request']).toBeUndefined()
    expect(Api.getHeaders({ headers: { A: 'b' } })['X-Background-Request']).toBeUndefined()
  })
})

describe('Api.syncPendingOperations() — sesión vencida', () => {
  const granularOp = () => ({
    id: 7,
    method: 'PATCH',
    endpoint: '/api/isoqf_extracted_data/ed1/item/ref1',
    payload: { ref_id: 'ref1', column_0: 'escrito sin conexión' },
    lockRef: 'ref1',
    lockProjectId: 'proj1'
  })

  it('no reproduce la cola mientras la sesión está vencida', async () => {
    markSessionExpired()
    getPendingOperations.mockResolvedValue([granularOp()])

    await Api.syncPendingOperations()

    expect(getPendingOperations).not.toHaveBeenCalled()
    expect(axios.patch).not.toHaveBeenCalled()
  })

  // Antes un 401 al tomar el lock se leía como «lo tiene otra persona», y la operación
  // salía de la cola: lo escrito sin conexión se perdía por un token vencido.
  it('si el lock no se puede tomar por sesión vencida, la operación queda en la cola', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, sessionExpired: true })
    getPendingOperations.mockResolvedValue([granularOp(), { ...granularOp(), id: 8 }])

    await Api.syncPendingOperations()

    expect(removePendingOperation).not.toHaveBeenCalled()
    expect(axios.patch).not.toHaveBeenCalled()
    // Corta la corrida: la siguiente fallaría igual.
    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })
})
