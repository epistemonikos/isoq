import axios from 'axios'
import { addPendingOperation } from '@/services/db'

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

const errorDeRed = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })

function escucharBloqueos () {
  const eventos = []
  const handler = (e) => eventos.push(e.detail)
  window.addEventListener('offline-write-blocked', handler)
  return { eventos, soltar: () => window.removeEventListener('offline-write-blocked', handler) }
}

/**
 * Un POST crea, y un alta no puede esperar en la cola.
 *
 * Medido el 2026-09-28 con el alta de un finding sin conexión: el POST de la lista se
 * encolaba y le devolvía a quien llamó su propio payload, sin id. Con eso se encadenaban
 * el finding (`list_id: undefined`) y el extracted_data (`finding_id: undefined`), la
 * persona veía «Created successfully», y al volver la red quedaba una lista fantasma y dos
 * 403 reintentándose para siempre. Además un alta que llegó al servidor justo antes de que
 * se cortara la respuesta se duplica al reproducirse.
 *
 * Lo que sí se encola son las escrituras idempotentes sobre un id: PATCH, PUT y DELETE.
 */
describe('Api — un POST no se encola sin conexión', () => {
  let escucha

  beforeEach(() => {
    jest.resetAllMocks()
    Api.setOnline(true)
    escucha = escucharBloqueos()
  })

  afterEach(() => { escucha.soltar(); Api.setOnline(true) })

  it('sin conexión falla con el error offline y no deja nada en la cola', async () => {
    Api.setOnline(false)
    axios.post.mockRejectedValueOnce(errorDeRed())

    const error = await Api.post('/isoqf_lists', { name: 'F' }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(addPendingOperation).not.toHaveBeenCalled()
  })

  it('con el navegador sin red falla sin intentar: sería fallar seguro', async () => {
    Api.setOnline(false)
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false })

    const error = await Api.post('/isoqf_lists', { name: 'F' }).catch(e => e)

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => true })
    expect(error.isOfflineError).toBe(true)
    expect(axios.post).not.toHaveBeenCalled()
    expect(escucha.eventos).toEqual([{ path: '/isoqf_lists' }])
  })

  it('con la red cayéndose en el envío, tampoco se encola', async () => {
    axios.post.mockRejectedValueOnce(errorDeRed())

    const error = await Api.post('/isoqf_findings', { list_id: 'l1' }).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(addPendingOperation).not.toHaveBeenCalled()
  })

  // Hay llamadores que sólo pasan el error a `printErrors`, que no muestra nada. El aviso
  // no puede depender de que cada uno se acuerde: Api avisa, y OfflineIndicator lo pinta.
  it('avisa que la escritura no se hizo, con la ruta', async () => {
    axios.post.mockRejectedValueOnce(errorDeRed())

    await Api.post('/isoqf_references/batch-import', { references: [] }).catch(() => {})

    expect(escucha.eventos).toEqual([{ path: '/isoqf_references/batch-import' }])
  })

  // Subir un archivo RIS viaja como FormData, que nunca se encola. Excluirlo del aviso lo
  // dejaba mudo sin conexión: la subida fallaba y nadie decía por qué.
  it('avisa también con FormData (la subida de un archivo)', async () => {
    Api.setOnline(false)
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => false })
    const formData = new FormData()
    formData.append('risFile', 'x')

    await Api.post('/isoqf_references/process-ris', formData).catch(() => {})

    Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => true })
    expect(escucha.eventos).toEqual([{ path: '/isoqf_references/process-ris' }])
  })

  it('no avisa si quien llama pidió noQueue: ya tiene su propio aviso', async () => {
    axios.post.mockRejectedValueOnce(errorDeRed())

    await Api.post('/isoqf_characteristics/', {}, { noQueue: true }).catch(() => {})

    expect(escucha.eventos).toEqual([])
  })

  it('no avisa en las rutas de sesión: el login maneja su propio error', async () => {
    axios.post.mockRejectedValueOnce(errorDeRed())

    await Api.post('/auth/login', {}).catch(() => {})

    expect(escucha.eventos).toEqual([])
  })

  it('un error del servidor no es un bloqueo por conexión: no avisa', async () => {
    axios.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500 } }))

    await Api.post('/isoqf_lists', {}).catch(() => {})

    expect(escucha.eventos).toEqual([])
  })

  it('con `queue: true` explícito, se sigue encolando como antes', async () => {
    Api.setOnline(false)

    const response = await Api.post('/isoqf_lists', { name: 'F' }, { queue: true })

    expect(response.queued).toBe(true)
    expect(addPendingOperation).toHaveBeenCalledTimes(1)
    expect(escucha.eventos).toEqual([])
  })

  it('no le pasa `queue` a axios', async () => {
    axios.post.mockResolvedValueOnce({ data: {} })

    await Api.post('/isoqf_lists', {}, { queue: true })

    expect(axios.post.mock.calls[0][2]).not.toHaveProperty('queue')
  })

  it.each(['patch', 'put', 'delete'])('%s sin conexión se sigue encolando: es idempotente sobre un id', async (method) => {
    Api.setOnline(false)

    const response = await Api[method]('/isoqf_findings/f1', { name: 'nuevo' })

    expect(response.queued).toBe(true)
    expect(addPendingOperation).toHaveBeenCalledTimes(1)
  })
})
