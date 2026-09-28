import axios from 'axios'
import { addPendingOperation } from '@/services/db'

// jest.config.js mockea Api.js por defecto: acá se prueba la implementación real.
const Api = jest.requireActual('@/utils/Api').default

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn(),
  getPendingOperations: jest.fn(),
  removePendingOperation: jest.fn(),
  getPendingOperationsCount: jest.fn()
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))

const errorDeRed = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })

/**
 * Dos salidas del modo offline para las operaciones que no se pueden diferir.
 *
 * La cola offline sirve para escrituras que siguen valiendo más tarde: la de un ítem, sobre
 * un id conocido. Hay dos que no: reemplazar la tabla entera (el `DELETE` + `POST` del
 * import), que reproducida horas después pisa lo que otra persona hizo mientras tanto, y la
 * consulta que decide si crear un documento, donde una caché vieja con una lista vacía es
 * un «no sé» disfrazado de «no existe».
 */
describe('Api — noQueue: una escritura que no se puede diferir falla en vez de encolarse', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.setOnline(true)
  })

  it.each(['post', 'delete'])('%s sin conexión: error offline y nada en la cola', async (method) => {
    Api.setOnline(false)

    const error = await Api[method]('/isoqf_characteristics/doc1', { a: 1 }, { noQueue: true }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(addPendingOperation).not.toHaveBeenCalled()
    expect(axios.post).not.toHaveBeenCalled()
    expect(axios.delete).not.toHaveBeenCalled()
  })

  it.each(['post', 'delete'])('%s con la red cayéndose en el envío: error offline y nada en la cola', async (method) => {
    // Es el caso que se escapaba: el botón de importar mira el `isOnline` del store, pero
    // la red se puede caer entre abrir el modal y apretar Guardar.
    axios[method].mockRejectedValueOnce(errorDeRed())

    const error = await Api[method]('/isoqf_characteristics/doc1', { a: 1 }, { noQueue: true }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(addPendingOperation).not.toHaveBeenCalled()
    expect(Api.isOnline()).toBe(false)
  })

  it('no le pasa la opción a axios', async () => {
    axios.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await Api.post('/isoqf_characteristics/', { a: 1 }, { noQueue: true })

    expect(axios.post.mock.calls[0][2]).not.toHaveProperty('noQueue')
  })

  it('sin la opción, una escritura offline se sigue encolando como siempre', async () => {
    Api.setOnline(false)

    await Api.post('/isoqf_characteristics/', { a: 1 })

    expect(addPendingOperation).toHaveBeenCalledTimes(1)
  })
})

describe('Api — networkOnly: una lectura que decide no acepta la caché como respuesta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.setOnline(true)
    jest.spyOn(Api, 'getCachedData').mockResolvedValue([])
  })

  afterEach(() => { Api.getCachedData.mockRestore() })

  it('sin conexión falla, aunque haya caché', async () => {
    Api.setOnline(false)

    const error = await Api.get('/isoqf_characteristics', {}, { networkOnly: true }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(Api.getCachedData).not.toHaveBeenCalled()
  })

  it('con la red cayéndose falla, aunque haya caché', async () => {
    axios.mockRejectedValueOnce(errorDeRed())

    const error = await Api.get('/isoqf_characteristics', {}, { networkOnly: true }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(Api.getCachedData).not.toHaveBeenCalled()
  })

  it('no le pasa la opción a axios', async () => {
    axios.mockResolvedValueOnce({ data: [] })

    await Api.get('/isoqf_characteristics', {}, { networkOnly: true })

    expect(axios.mock.calls[0][0]).not.toHaveProperty('networkOnly')
  })

  it('sin la opción, offline sigue sirviendo la caché', async () => {
    Api.setOnline(false)

    const response = await Api.get('/isoqf_characteristics', {})

    expect(response.fromCache).toBe(true)
  })
})
