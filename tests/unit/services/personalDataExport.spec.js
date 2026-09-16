jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}))

import { downloadPersonalData } from '@/services/personalDataExport'

const Api = require('@/utils/Api').default

describe('downloadPersonalData', () => {
  // tests/unit/setup.js:36-42 ya las define como jest.fn() no configurables.
  const createObjectURL = window.URL.createObjectURL
  const revokeObjectURL = window.URL.revokeObjectURL

  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: new Blob(['zip']) })
    createObjectURL.mockReturnValue('blob:fake')
  })

  it('pide el zip con el usuario y la contraseña', async () => {
    await downloadPersonalData('u1', 'secreta')

    expect(Api.post).toHaveBeenCalledWith(
      '/users/get_full_data',
      { user_id: 'u1', password: 'secreta' },
      { responseType: 'blob' }
    )
  })

  it('dispara la descarga y libera el object URL', async () => {
    await downloadPersonalData('u1', 'secreta')

    expect(createObjectURL).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })

  it('no deja el enlace temporal en el DOM', async () => {
    await downloadPersonalData('u1', 'secreta')

    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  // ─── Errores ─────────────────────────────────────────────────────────────────
  //
  // Con responseType 'blob' axios envuelve TAMBIÉN los errores, así que el
  // {result, message} del backend llega como Blob y no como objeto.

  function blobError (payload, status = 403) {
    return {
      response: { status, data: new Blob([JSON.stringify(payload)], { type: 'application/json' }) }
    }
  }

  it('expone el mensaje del backend cuando la contraseña es incorrecta', async () => {
    Api.post.mockRejectedValueOnce(blobError({ result: 'invalid_password', message: 'Incorrect password' }))

    await expect(downloadPersonalData('u1', 'mala')).rejects.toMatchObject({
      backendMessage: 'Incorrect password'
    })
  })

  it('deja backendMessage nulo si el cuerpo no es JSON', async () => {
    // Un 502 de nginx devuelve HTML: quien llame decide el texto a mostrar.
    Api.post.mockRejectedValueOnce({
      response: { status: 502, data: new Blob(['<html>Bad Gateway</html>'], { type: 'text/html' }) }
    })

    await expect(downloadPersonalData('u1', 'secreta')).rejects.toMatchObject({
      backendMessage: null
    })
  })

  it('deja backendMessage nulo si no hay respuesta', async () => {
    Api.post.mockRejectedValueOnce(new Error('Network Error'))

    await expect(downloadPersonalData('u1', 'secreta')).rejects.toMatchObject({
      backendMessage: null
    })
  })

  it('deja backendMessage nulo si el JSON no trae message', async () => {
    Api.post.mockRejectedValueOnce(blobError({ result: 'invalid_password' }))

    await expect(downloadPersonalData('u1', 'mala')).rejects.toMatchObject({
      backendMessage: null
    })
  })
})
