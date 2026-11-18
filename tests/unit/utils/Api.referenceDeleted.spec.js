import axios from 'axios'

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn(),
  getPendingOperations: jest.fn(),
  removePendingOperation: jest.fn(),
  getPendingOperationsCount: jest.fn()
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))

jest.requireActual('@/utils/Api')
const errorHandler = axios.interceptors.response.use.mock.calls[0][1]

// Guardar sobre un estudio que otra persona borró: el servidor ya no deja que el upsert
// resucite la fila. El 409 llega por la misma URL granular que un conflicto de lock, y
// mandarlo a ese canal produciría «lo está editando…» sin nadie del otro lado.
describe('Api.js interceptor — 409 reference_deleted', () => {
  let dispatched
  beforeEach(() => {
    dispatched = []
    jest.spyOn(window, 'dispatchEvent').mockImplementation(e => { dispatched.push(e); return true })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  const makeError = (url, data) => ({
    config: { url, method: 'patch', data: '{}' },
    response: { status: 409, data: { reason: 'reference_deleted', ...data } }
  })

  it('avisa por reference-deleted con el estudio y quién lo borró', async () => {
    const err = makeError('/isoqf_extracted_data/ed1/item/R1', { ref_id: 'R1', deleted_by: 'Ana' })
    await expect(errorHandler(err)).rejects.toBe(err)

    const event = dispatched.find(e => e.type === 'reference-deleted')
    expect(event.detail).toEqual({ refId: 'R1', deletedBy: 'Ana', source: 'write' })
    expect(dispatched.some(e => e.type === 'ref-lock-conflict')).toBe(false)
  })

  it('sin ref_id en el cuerpo, saca el estudio de la URL (hoja del endpoint D)', async () => {
    const err = makeError('/isoqf_assessments/as1/item/R7/stage/0/option/2', { deleted_by: null })
    await expect(errorHandler(err)).rejects.toBe(err)

    const event = dispatched.find(e => e.type === 'reference-deleted')
    expect(event.detail).toEqual({ refId: 'R7', deletedBy: null, source: 'write' })
  })
})
