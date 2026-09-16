// El servicio de presencia. Vive aparte de lockService a propósito: aquél gestiona
// exclusión mutua y puede negar; éste por contrato no puede negar nada.
process.env.ENABLE_CONCURRENCY_CONTROL = 'on'

import axios from 'axios'
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
  })

  afterEach(async () => {
    await PresenceService.leave()
    jest.useRealTimers()
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
})
