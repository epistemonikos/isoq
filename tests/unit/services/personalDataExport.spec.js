jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: { post: jest.fn() }
}))

import { downloadPersonalData, downloadUserDataAsAdmin } from '@/services/personalDataExport'

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


// Un superadmin genera la copia de otra persona que no puede entrar (Art. 12.3). El servidor
// exige su contraseña y que declare haber verificado la identidad de quien la pidió.
describe('downloadUserDataAsAdmin', () => {
  const createObjectURL = window.URL.createObjectURL

  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: new Blob(['zip']) })
    createObjectURL.mockReturnValue('blob:fake')
  })

  it('pide el zip de esa persona con la contraseña del admin y la verificación declarada', async () => {
    await downloadUserDataAsAdmin('u9', 'clave-admin')

    expect(Api.post).toHaveBeenCalledWith(
      '/admin/users/u9/export',
      { password: 'clave-admin', identity_verified: true },
      { responseType: 'blob' }
    )
  })

  it('dispara la descarga con un nombre que identifica a la persona', async () => {
    const appendChild = jest.spyOn(document.body, 'appendChild')
    await downloadUserDataAsAdmin('u9', 'clave-admin')

    const link = appendChild.mock.calls[0][0]
    expect(link.getAttribute('download')).toBe('user_data_u9.zip')
    appendChild.mockRestore()
  })

  it('propaga el mensaje del servidor al fallar', async () => {
    const body = new Blob([JSON.stringify({ result: 'invalid_password', message: 'Incorrect password' })])
    Api.post.mockRejectedValueOnce({ response: { status: 403, data: body } })

    await expect(downloadUserDataAsAdmin('u9', 'mala')).rejects.toMatchObject({
      backendMessage: 'Incorrect password'
    })
  })
})
