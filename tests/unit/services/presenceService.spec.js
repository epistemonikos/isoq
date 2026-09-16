// El servicio de presencia. Vive aparte de lockService a propósito: aquél gestiona
// exclusión mutua y puede negar; éste por contrato no puede negar nada.
//
// El flag hay que guardarlo y restaurarlo: jest no resetea process.env entre
// specs corridos en el mismo worker, así que setearlo sin restaurar se lo deja
// encendido a cualquier spec que corra después y lo lea sin override propio
// (mismo hazard que documenta tests/unit/constants/gdpr.spec.js). Va suelto,
// antes del import, porque el servicio lee el flag al construirse el singleton.
const originalEnableConcurrencyControl = process.env.ENABLE_CONCURRENCY_CONTROL
process.env.ENABLE_CONCURRENCY_CONTROL = 'on'

import axios from 'axios'
import { store } from '@/store'
import PresenceService from '@/services/presenceService'

jest.mock('axios', () => ({ post: jest.fn(), delete: jest.fn(), get: jest.fn() }))
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer t' }) }))
jest.mock('@/store', () => ({ store: { state: { isOnline: true } } }))

describe('presenceService', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    axios.post.mockResolvedValue({ data: { status: true } })
    axios.delete.mockResolvedValue({ data: { status: true } })
    axios.get.mockResolvedValue({ data: { enabled: true, present: [] } })
    axios.post.mockClear()
    axios.delete.mockClear()
    axios.get.mockClear()
    PresenceService.projectId = null
    PresenceService.findingId = null
    store.state.isOnline = true
  })

  afterEach(async () => {
    await PresenceService.leave()
    jest.useRealTimers()
  })

  afterAll(() => {
    if (originalEnableConcurrencyControl === undefined) {
      delete process.env.ENABLE_CONCURRENCY_CONTROL
    } else {
      process.env.ENABLE_CONCURRENCY_CONTROL = originalEnableConcurrencyControl
    }
  })

  it('entrar marca presencia en ese hallazgo', async () => {
    await PresenceService.enter('p1', 'f1')

    expect(axios.post).toHaveBeenCalledWith(
      '/api/presence/p1/f1', {}, { headers: { Authorization: 'Bearer t' } })
  })

  it('el ping repite el mismo POST cada 30 s', async () => {
    await PresenceService.enter('p1', 'f1')
    axios.post.mockClear()

    jest.advanceTimersByTime(30000)

    expect(axios.post).toHaveBeenCalledTimes(1)
    expect(axios.post.mock.calls[0][0]).toBe('/api/presence/p1/f1')
  })

  it('entrar a otro hallazgo suelta el anterior', async () => {
    // La worksheet se navega de un hallazgo a otro sin desmontar en algunos caminos.
    // Sin esto quedan dos presencias vivas de la misma persona.
    await PresenceService.enter('p1', 'f1')
    await PresenceService.enter('p1', 'f2')

    expect(axios.delete).toHaveBeenCalledWith(
      '/api/presence/p1/f1', { headers: { Authorization: 'Bearer t' } })
  })

  it('salir borra la marca y detiene el ping', async () => {
    await PresenceService.enter('p1', 'f1')
    await PresenceService.leave()
    axios.post.mockClear()

    jest.advanceTimersByTime(60000)

    expect(axios.delete).toHaveBeenCalledWith(
      '/api/presence/p1/f1', { headers: { Authorization: 'Bearer t' } })
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('salir sin haber entrado no lanza ni pide nada', async () => {
    await PresenceService.leave()

    expect(axios.delete).not.toHaveBeenCalled()
  })

  it('el listado devuelve `present`', async () => {
    axios.get.mockResolvedValue({
      data: { enabled: true, present: [{ finding_id: 'f1', user_id: 'u', user_name: 'A' }] }
    })

    const present = await PresenceService.fetch('p1')

    expect(axios.get).toHaveBeenCalledWith(
      '/api/presence/p1', { headers: { Authorization: 'Bearer t' } })
    expect(present).toEqual([{ finding_id: 'f1', user_id: 'u', user_name: 'A' }])
  })

  it('un fallo de red devuelve lista vacía y no lanza', async () => {
    // Igual que fetchRefLocks: si no sé, no pinto a nadie. La cadena que llama a esto
    // desde getList() no tiene catch propio, y un throw se traga todo lo que sigue.
    axios.get.mockRejectedValue(new Error('network'))

    await expect(PresenceService.fetch('p1')).resolves.toEqual([])
  })

  it('una respuesta con forma desconocida devuelve lista vacía', async () => {
    axios.get.mockResolvedValue({ data: 'vaya cosa' })

    await expect(PresenceService.fetch('p1')).resolves.toEqual([])
  })

  it('un fallo al marcar no lanza: la presencia es accesoria', async () => {
    axios.post.mockRejectedValue(new Error('network'))

    await expect(PresenceService.enter('p1', 'f1')).resolves.toBeUndefined()
  })

  it('probePresence: enabled true con filas', async () => {
    axios.get.mockResolvedValue({
      data: { enabled: true, present: [{ finding_id: 'f1', user_id: 'u', user_name: 'A' }] }
    })

    const result = await PresenceService.probePresence('p1')

    expect(result).toEqual({
      present: [{ finding_id: 'f1', user_id: 'u', user_name: 'A' }],
      enabled: true
    })
  })

  it('probePresence: enabled false — el flag de servidor está apagado', async () => {
    // El caso que se perdió antes con lockService: con el cliente encendido y el
    // servidor apagado, `present` viene vacío pero por una razón distinta a «nadie
    // está adentro». Sin este campo las cinco superficies de presencia quedan
    // vacías sin manera de saber por qué.
    axios.get.mockResolvedValue({ data: { enabled: false, present: [] } })

    const result = await PresenceService.probePresence('p1')

    expect(result).toEqual({ present: [], enabled: false })
  })

  it('probePresence: sin el campo `enabled` se asume true', async () => {
    axios.get.mockResolvedValue({
      data: { present: [{ finding_id: 'f1', user_id: 'u', user_name: 'A' }] }
    })

    const result = await PresenceService.probePresence('p1')

    expect(result.enabled).toBe(true)
  })

  it('probePresence: un fallo de red devuelve present vacío y enabled true', async () => {
    axios.get.mockRejectedValue(new Error('network'))

    await expect(PresenceService.probePresence('p1')).resolves.toEqual({
      present: [], enabled: true
    })
  })

  it('sin conexión, ping() no manda nada ni lo encola', async () => {
    // A diferencia de las mutaciones de negocio (que Api SÍ encola para el
    // reconecte), una presencia es una afirmación sobre el presente: replicarla
    // al volver la conexión diría que alguien sigue donde ya no está. No hay
    // cola que inspeccionar acá — la ausencia de llamada a axios.post ES la
    // prueba de que no se encoló nada.
    store.state.isOnline = false

    await PresenceService.enter('p1', 'f1')

    expect(axios.post).not.toHaveBeenCalled()
  })
})
