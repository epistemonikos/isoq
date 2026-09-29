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

const errorDeRed = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' })
const flush = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }

function navegadorConRed (onLine) {
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, get: () => onLine })
}

// Un error de red es una SOSPECHA de estar sin conexión, no un hecho. Antes la dejaba
// firme: `isOnline` quedaba en false y lo único que lo devolvía era el evento `online` del
// navegador, que no llega si el navegador nunca perdió la red (se reinició el servidor, un
// wifi que parpadeó). La pestaña entera quedaba sirviendo caché y encolando hasta recargar.
describe('Api — sale sola del modo offline cuando la red vuelve', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // reset y no clear: un `mockResolvedValueOnce` sin consumir sobrevive a clearAllMocks y
    // contesta la primera llamada del test siguiente.
    jest.resetAllMocks()
    navegadorConRed(true)
    Api.setOnline(true)
    getPendingOperations.mockResolvedValue([])
  })

  afterEach(() => {
    Api.setOnline(true)
    jest.useRealTimers()
  })

  async function caerPorRed () {
    axios.mockRejectedValueOnce(errorDeRed())
    await Api.get('/isoqf_projects', {}).catch(() => {})
    expect(Api.isOnline()).toBe(false)
  }

  it('sondea la salud del servidor y vuelve a online cuando responde', async () => {
    await caerPorRed()
    axios.get.mockResolvedValueOnce({ data: { status: 'healthy' } })

    jest.advanceTimersByTime(5000)
    await flush()

    expect(axios.get).toHaveBeenCalledWith('/api/health', expect.any(Object))
    expect(Api.isOnline()).toBe(true)
  })

  it('mientras el servidor no responde sigue offline, y espera cada vez más entre intentos', async () => {
    await caerPorRed()
    axios.get.mockRejectedValue(errorDeRed())

    jest.advanceTimersByTime(5000); await flush()
    expect(axios.get).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(5000); await flush()
    expect(axios.get).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(5000); await flush()
    expect(axios.get).toHaveBeenCalledTimes(2)
    expect(Api.isOnline()).toBe(false)
  })

  it('cualquier respuesta del servidor cuenta como red, aunque no sea 200', async () => {
    // Un 503 durante un deploy dice que el servidor contesta: ya no es un problema de red,
    // y seguir en modo offline encolaría escrituras que ahora sí fallarían de verdad.
    await caerPorRed()
    axios.get.mockRejectedValueOnce(Object.assign(new Error('503'), { response: { status: 503 } }))

    jest.advanceTimersByTime(5000); await flush()

    expect(Api.isOnline()).toBe(true)
  })

  it('al volver sincroniza la cola', async () => {
    await caerPorRed()
    getPendingOperations.mockResolvedValue([
      { id: 1, method: 'POST', endpoint: '/api/isoqf_findings', payload: { a: 1 } }
    ])
    axios.post.mockResolvedValue({ data: {} })
    axios.get.mockResolvedValueOnce({ data: {} })

    jest.advanceTimersByTime(5000); await flush()

    expect(axios.post).toHaveBeenCalledWith('/api/isoqf_findings', { a: 1 }, expect.any(Object))
    expect(removePendingOperation).toHaveBeenCalledWith(1)
  })

  it('con el navegador sin red no sondea: espera el evento online', async () => {
    await caerPorRed()
    navegadorConRed(false)

    jest.advanceTimersByTime(60000); await flush()

    expect(axios.get).not.toHaveBeenCalled()
  })

  it('al volver la pestaña al frente sondea en el acto, sin esperar el temporizador', async () => {
    // Chrome frena los setTimeout de una pestaña oculta hasta uno por minuto. Volver al
    // frente es el momento en que la persona va a actuar: es el mismo motivo por el que
    // `revalidateLocks()` late en `visibilitychange`.
    await caerPorRed()
    axios.get.mockResolvedValueOnce({ data: {} })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })

    document.dispatchEvent(new Event('visibilitychange'))
    await flush()

    expect(axios.get).toHaveBeenCalledWith('/api/health', expect.any(Object))
    expect(Api.isOnline()).toBe(true)
  })

  it('una escritura noQueue intenta la red aunque el flag diga offline, y si sale vuelve a online', async () => {
    // No tiene cola ni caché a la que caer, así que no intentarlo es fallar seguro. Es el
    // reintento del import: sin esto no mandaba nada hasta el próximo sondeo.
    await caerPorRed()
    axios.post.mockResolvedValueOnce({ data: { id: 'nuevo' } })

    await Api.post('/isoqf_characteristics/', { a: 1 }, { noQueue: true })

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(Api.isOnline()).toBe(true)
  })

  it('una lectura networkOnly intenta la red aunque el flag diga offline', async () => {
    await caerPorRed()
    axios.mockResolvedValueOnce({ data: [{ id: 'doc' }] })

    const response = await Api.get('/isoqf_characteristics', {}, { networkOnly: true })

    expect(response.data).toEqual([{ id: 'doc' }])
    expect(Api.isOnline()).toBe(true)
  })

  // Un GET sin caché a la que caer (las rutas /auth/ no se cachean) fallaba al instante con el
  // flag offline, sin salir: el Reintentar de VerifyEmail no servía hasta el próximo sondeo.
  it('un GET sin caché a la que caer intenta la red aunque el flag diga offline', async () => {
    await caerPorRed()
    axios.mockResolvedValueOnce({ data: { status: 'verified' } })

    const response = await Api.get('/auth/verify_email/t', {})

    expect(response.data).toEqual({ status: 'verified' })
    expect(Api.isOnline()).toBe(true)
  })

  it('con el navegador sin red, ese GET falla sin intentar', async () => {
    await caerPorRed()
    navegadorConRed(false)

    const error = await Api.get('/auth/verify_email/t', {}).catch(e => e)

    expect(error.isOfflineError).toBe(true)
    expect(axios).toHaveBeenCalledTimes(1) // sólo el de `caerPorRed`
  })

  it('una escritura normal con el flag offline se sigue encolando sin tocar la red', async () => {
    await caerPorRed()

    await Api.patch('/isoqf_findings/f1', { a: 1 })

    expect(axios.patch).not.toHaveBeenCalled()
  })
})

// Al volver la red la sincronización se dispara desde varios lados (el evento `online` en
// Api, el de OfflineIndicator y ahora el sondeo). Dos corridas solapadas leían la misma
// cola antes de que se vaciara y reproducían cada operación dos veces: un POST duplicado.
describe('Api.syncPendingOperations — una sola corrida a la vez', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    navegadorConRed(true)
    Api.setOnline(true)
  })

  it('dos llamadas solapadas reproducen cada operación una vez', async () => {
    getPendingOperations.mockResolvedValue([
      { id: 1, method: 'POST', endpoint: '/api/isoqf_findings', payload: { a: 1 } }
    ])
    let soltar
    axios.post.mockImplementation(() => new Promise(resolve => { soltar = resolve }))

    const primera = Api.syncPendingOperations()
    const segunda = Api.syncPendingOperations()
    await flush()
    soltar({ data: {} })
    await Promise.all([primera, segunda])

    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('terminada una corrida, la siguiente vuelve a leer la cola', async () => {
    getPendingOperations.mockResolvedValue([])
    await Api.syncPendingOperations()
    await Api.syncPendingOperations()

    expect(getPendingOperations).toHaveBeenCalledTimes(2)
  })
})
