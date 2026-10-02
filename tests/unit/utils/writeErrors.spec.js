import { writeErrorMessageKey, requestFailureKey } from '@/utils/writeErrors'

const conStatus = (status, { url = '/isoqf_projects/p1', data = {} } = {}) => ({
  config: { url }, response: { status, data }
})

/**
 * Qué aviso corresponde a una escritura que falló, o `null` si otro canal ya avisó.
 *
 * Existe porque muchos `.catch` sólo llamaban a `Commons.printErrors`, que no muestra nada:
 * publicar dejaba el spinner girando, quitarle el acceso a alguien fallaba y el dueño creía
 * que se lo había quitado. La regla es de allowlist: sólo se calla lo que ya se anunció
 * por otro lado; un error que el cliente no reconozca TERMINA VISIBLE.
 */
describe('writeErrorMessageKey', () => {
  it('un error del servidor cualquiera: el texto de la acción', () => {
    expect(writeErrorMessageKey(conStatus(500), 'notifications.share_error')).toBe('notifications.share_error')
  })

  it('sin texto de acción, el genérico de guardado', () => {
    expect(writeErrorMessageKey(conStatus(500))).toBe('notifications.save_error')
  })

  it('un código que el cliente todavía no conoce también se ve', () => {
    expect(writeErrorMessageKey(conStatus(499), 'notifications.share_error')).toBe('notifications.share_error')
  })

  it('un error sin respuesta ni marca de offline (se cayó a mitad de camino) se ve', () => {
    expect(writeErrorMessageKey(new Error('boom'))).toBe('notifications.save_error')
  })

  it('403: no tiene permiso, que es lo que la persona puede entender y hacer algo', () => {
    expect(writeErrorMessageKey(conStatus(403), 'notifications.share_error')).toBe('notifications.write_forbidden')
  })

  it.each([404, 410])('%s: ya no existe', (status) => {
    expect(writeErrorMessageKey(conStatus(status))).toBe('notifications.write_gone')
  })

  describe('lo que ya avisó otro canal no se repite', () => {
    it('sin conexión: OfflineIndicator', () => {
      expect(writeErrorMessageKey({ isOfflineError: true, response: { status: 0 } })).toBeNull()
    })

    it('un 409 de lock en una ruta granular: el canal de conflicto', () => {
      expect(writeErrorMessageKey(conStatus(409, { url: '/isoqf_findings/f1/section/coherence' }))).toBeNull()
    })

    it('un 403 en una ruta granular: también el canal de conflicto', () => {
      expect(writeErrorMessageKey(conStatus(403, { url: '/isoqf_findings/f1/section/coherence' }))).toBeNull()
    })

    it('un conflicto de versión: su propio canal', () => {
      const error = conStatus(409, { url: '/isoqf_characteristics/c1/item/R1', data: { reason: 'version_conflict' } })
      expect(writeErrorMessageKey(error)).toBeNull()
    })


    it('«Project is locked» ya no se calla: el lock de proyecto se retiró y nadie más lo anuncia', () => {
      expect(writeErrorMessageKey(conStatus(409, { data: { message: 'Project is locked by Ana' } }))).not.toBeNull()
    })
  })

  // En vivo, el duplicado sólo tiene canal propio en las categorías (handleCategorySaveError,
  // que no pasa por acá); el interceptor lo anuncia únicamente al reproducir la cola. Callarlo
  // en general dejaría mudo a cualquier otro endpoint con índice único.
  it('un nombre duplicado se ve, con su texto', () => {
    expect(writeErrorMessageKey(conStatus(409, { data: { reason: 'duplicate_key' } }))).toBe('notifications.write_duplicate')
  })

  it('un 409 que no es ninguno de los conocidos se ve: callarlo sería otro silencio', () => {
    expect(writeErrorMessageKey(conStatus(409, { data: { reason: 'algo_nuevo' } }))).toBe('notifications.save_error')
  })
})

/**
 * Para las pantallas previas al login. Sus rutas (`/auth/`) no pasan por el aviso central
 * de «necesita conexión», así que acá el caso sin red SÍ se dice. Y no se dice «sin
 * conexión»: un servidor caído llega igual como error de red, y mandar a revisar el wifi a
 * quien tiene wifi es otro aviso falso.
 */
describe('requestFailureKey', () => {
  it('sin respuesta (o marcado offline): no se pudo conectar', () => {
    expect(requestFailureKey({ isOfflineError: true, response: { status: 0 } })).toBe('common.connection_failed')
    expect(requestFailureKey(Object.assign(new Error('Network Error'), { request: {} }))).toBe('common.connection_failed')
  })

  it('con respuesta de error: el servidor no pudo procesarla', () => {
    expect(requestFailureKey({ response: { status: 500, data: { status: 'error' } } })).toBe('common.server_failed')
    expect(requestFailureKey({ response: { status: 400, data: {} } })).toBe('common.server_failed')
  })

  it('429: demasiados intentos', () => {
    expect(requestFailureKey({ response: { status: 429, data: '<html></html>' } })).toBe('common.too_many_attempts')
  })

  it('un error que no viene de una petición no tiene aviso de petición', () => {
    expect(requestFailureKey(new TypeError('boom'))).toBeNull()
  })
})

