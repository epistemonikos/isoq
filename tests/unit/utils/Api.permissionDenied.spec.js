import axios from 'axios'

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn(),
  getPendingOperations: jest.fn(),
  removePendingOperation: jest.fn(),
  getPendingOperationsCount: jest.fn()
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))

// Importing the real Api registers the response interceptor on the mocked axios.
jest.requireActual('@/utils/Api')

// The interceptor's error handler is the 2nd argument of the first .use() call.
const errorHandler = axios.interceptors.response.use.mock.calls[0][1]

describe('Api.js interceptor — permission-denied', () => {
  let dispatched

  beforeEach(() => {
    dispatched = []
    jest.spyOn(window, 'dispatchEvent').mockImplementation(e => { dispatched.push(e); return true })
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  const makeError = (url, method, status = 403) => ({
    config: { url, method },
    response: { status, data: {} }
  })

  it.each(['patch', 'post', 'put', 'delete'])('dispara permission-denied en un 403 de %s', async (method) => {
    const err = makeError('/isoqf_findings/find1', method)
    await expect(errorHandler(err)).rejects.toBe(err)

    const event = dispatched.find(e => e.type === 'permission-denied')
    expect(event).toBeTruthy()
    expect(event.detail).toEqual({ url: '/isoqf_findings/find1', method })
  })

  it('NO dispara permission-denied en un 403 de GET (lectura)', async () => {
    const err = makeError('/isoqf_projects/proj1', 'get')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(dispatched.some(e => e.type === 'permission-denied')).toBe(false)
  })

  it('NO dispara permission-denied en un 409 (eso es un conflicto de lock, no de permisos)', async () => {
    const err = makeError('/isoqf_lists/list1', 'patch', 409)
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(dispatched.some(e => e.type === 'permission-denied')).toBe(false)
  })

  it('SÍ dispara permission-denied incluso en la adquisición de un lock de referencia (403)', async () => {
    // Un 403 al intentar tomar un ref-lock también significa "ya no tienes permiso
    // de escritura" — debe propagarse igual que cualquier otra escritura rechazada,
    // aunque LockService la maneje además localmente para su propio mensaje.
    const err = makeError('/api/lock/proj1/ref/ref1', 'post')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(dispatched.some(e => e.type === 'permission-denied')).toBe(true)
  })
})
