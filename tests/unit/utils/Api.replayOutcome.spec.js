import axios from 'axios'
import { getPendingOperations, removePendingOperation } from '@/services/db'

// jest.config.js mapea `@/utils/Api` a un mock: acá se prueba la implementación real.
const Api = jest.requireActual('@/utils/Api').default

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn().mockResolvedValue(1),
  getPendingOperations: jest.fn().mockResolvedValue([]),
  removePendingOperation: jest.fn().mockResolvedValue(undefined),
  getPendingOperationsCount: jest.fn().mockResolvedValue(0)
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))
jest.mock('@/utils/OfflineStrategies', () => ({ strategies: [] }))

const op = (id, endpoint = `/api/isoqf_findings/f${id}`) => ({ id, method: 'PATCH', endpoint, payload: { name: `cambio ${id}` } })
const rechazo = (status) => Object.assign(new Error(String(status)), { response: { status, data: {} }, config: {} })
const errorDeRed = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })

let rechazos
function escuchar () {
  rechazos = []
  const handler = (e) => rechazos.push(e.detail)
  window.addEventListener('offline-replay-rejected', handler)
  return () => window.removeEventListener('offline-replay-rejected', handler)
}

describe('Api.syncPendingOperations — qué hace con cada rechazo', () => {
  let soltar

  beforeEach(() => {
    jest.resetAllMocks()
    Api.setOnline(true)
    removePendingOperation.mockResolvedValue(undefined)
    soltar = escuchar()
  })

  afterEach(() => { soltar(); Api.setOnline(true) })

  it('un 403 sale de la cola y se avisa; la corrida sigue con la siguiente', async () => {
    // La persona editó sin conexión y mientras tanto le quitaron el permiso. Sin permiso no
    // hay forma legítima de guardarlo: reintentarlo para siempre sólo esconde la pérdida.
    getPendingOperations.mockResolvedValue([op(1), op(2)])
    axios.patch.mockRejectedValueOnce(rechazo(403)).mockResolvedValueOnce({ data: {} })

    await Api.syncPendingOperations()

    expect(removePendingOperation).toHaveBeenCalledWith(1)
    expect(removePendingOperation).toHaveBeenCalledWith(2)
    expect(rechazos).toEqual([{ rejected: [{ status: 403, method: 'PATCH', endpoint: '/api/isoqf_findings/f1', reason: 'forbidden' }] }])
  })

  it('los rechazos de una misma corrida se avisan juntos, en un solo evento', async () => {
    getPendingOperations.mockResolvedValue([op(1), op(2)])
    axios.patch.mockRejectedValueOnce(rechazo(403)).mockRejectedValueOnce(rechazo(404))

    await Api.syncPendingOperations()

    expect(rechazos).toHaveLength(1)
    expect(rechazos[0].rejected.map(r => r.reason)).toEqual(['forbidden', 'gone'])
  })

  it('un 5xx se queda en la cola y corta la corrida: no se reproduce la siguiente fuera de orden', async () => {
    getPendingOperations.mockResolvedValue([op(1), op(2)])
    axios.patch.mockRejectedValueOnce(rechazo(503))

    await Api.syncPendingOperations()

    expect(removePendingOperation).not.toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(1)
    expect(rechazos).toEqual([])
  })

  it('sin respuesta se queda, corta la corrida y vuelve a sospechar que no hay red', async () => {
    getPendingOperations.mockResolvedValue([op(1), op(2)])
    axios.patch.mockRejectedValueOnce(errorDeRed())

    await Api.syncPendingOperations()

    expect(removePendingOperation).not.toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalledTimes(1)
    expect(Api.isOnline()).toBe(false)
  })

  it('un 401 se queda: al volver a entrar puede pasar', async () => {
    getPendingOperations.mockResolvedValue([op(1)])
    axios.patch.mockRejectedValueOnce(rechazo(401))

    await Api.syncPendingOperations()

    expect(removePendingOperation).not.toHaveBeenCalled()
  })

  it('un DELETE que da 404 sale de la cola sin aviso: ya no estaba, que era lo que se quería', async () => {
    getPendingOperations.mockResolvedValue([{ id: 1, method: 'DELETE', endpoint: '/api/isoqf_list_categories/c1', payload: null }])
    axios.delete.mockRejectedValueOnce(rechazo(404))

    await Api.syncPendingOperations()

    expect(removePendingOperation).toHaveBeenCalledWith(1)
    expect(rechazos).toEqual([])
  })

  it('un 409 de lock ya anunciado sale de la cola sin sumar un segundo aviso', async () => {
    getPendingOperations.mockResolvedValue([op(1, '/api/isoqf_characteristics/c1/item/R1')])
    axios.patch.mockRejectedValueOnce(Object.assign(rechazo(409), { config: { url: '/api/isoqf_characteristics/c1/item/R1' } }))

    await Api.syncPendingOperations()

    expect(removePendingOperation).toHaveBeenCalledWith(1)
    expect(rechazos).toEqual([])
  })
})
