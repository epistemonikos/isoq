/*
 * Sesión vencida: un estado de la pestaña, no un error de cada petición.
 *
 * Desde 2026-10-06 el servidor cierra la sesión tras 8 h sin actividad del usuario y
 * siempre a los 7 días. Hasta entonces el cliente no tenía ningún manejo del 401: cada
 * `.catch` lo leía a su manera —«Error al guardar», o en el latido del lock «tu acceso
 * cambió a solo lectura»— y nada pedía volver a entrar hasta recargar.
 *
 * Lo marca el interceptor de `Api.js` al primer 401 y lo levanta `SessionExpiredModal` al
 * volver a entrar. Mientras dura, la cola offline no se reproduce y el latido no suelta
 * locks: todo lo que estaba en pantalla tiene que seguir ahí después del login.
 *
 * Vive fuera del store a propósito: `store.js` importa `Api.js`, y el interceptor que lo
 * marca vive en `Api.js`.
 */

export const SESSION_EXPIRED = 'session-expired'
export const SESSION_RESTORED = 'session-restored'

let expired = false

function announce (type) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(type))
}

export function isSessionExpired () {
  return expired
}

/** Devuelve `true` sólo la primera vez: diez peticiones que fallan juntas son un aviso. */
export function markSessionExpired () {
  if (expired) return false
  expired = true
  announce(SESSION_EXPIRED)
  return true
}

export function clearSessionExpired () {
  if (!expired) return
  expired = false
  announce(SESSION_RESTORED)
}

function hasStoredToken () {
  try {
    const token = localStorage.getItem('l_s')
    return Boolean(token) && token !== 'null'
  } catch (e) {
    return false
  }
}

/*
 * Un 401 de `/auth/` es la respuesta a un intento de entrar, no una sesión que venció. Y
 * sin token guardado no había sesión: un visitante anónimo no tiene nada que renovar.
 */
export function isSessionExpiredRejection (error) {
  if (!error || !error.response || error.response.status !== 401) return false
  const url = (error.config && error.config.url) || ''
  if (/(^|\/)auth\//.test(url)) return false
  return hasStoredToken()
}
