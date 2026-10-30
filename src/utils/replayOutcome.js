import { refLockKeyFromUrl } from '@/utils/refLockUrls'

/**
 * Qué hacer con una operación de la cola offline que el servidor no aceptó al reproducirla.
 *
 * Antes, todo lo que no fuera un conflicto de lock, versión o nombre duplicado se quedaba en
 * la cola para siempre. El caso que lo hizo visible: alguien edita sin conexión, mientras
 * tanto le quitan el permiso, y al volver su edición da 403 en cada sincronización — el
 * contador nunca baja y nadie le avisa que lo escrito no se va a guardar.
 *
 * Reintentable es una ALLOWLIST (como `VERSION_REASONS` en lockErrors.js): lo que no está
 * acá se descarta y se avisa. Escrito al revés, cualquier código que el cliente no conozca
 * volvería a trabar la cola para siempre.
 *
 *   'retry'          se queda en la cola, y la corrida se corta para no reproducir lo que
 *                    sigue fuera de orden.
 *   'drop'           sale de la cola, y la cola avisa qué se perdió.
 *   'drop-announced' sale de la cola sin aviso propio: el interceptor ya lo anunció.
 *   'done'           un DELETE sobre algo que ya no está: sale como un éxito.
 */

// 401: la sesión venció. Al volver a entrar la misma escritura puede pasar, y tirarla sería
// perder trabajo por un token.
const RETRYABLE_STATUSES = [401, 408, 429]

/**
 * El documento ya no está. Para un DELETE eso es haber llegado a donde se quería: el
 * backend responde 404 sobre un documento inexistente (antes, 200 sin efecto), y tratarlo
 * como error le diría a la persona lo contrario de lo que pasó.
 */
export function isAlreadyGone (error) {
  const status = error && error.response && error.response.status
  return status === 404 || status === 410
}

export function replayOutcome (error, method = '') {
  const status = error && error.response && error.response.status
  if (!status) return 'retry'
  if (String(method).toUpperCase() === 'DELETE' && isAlreadyGone(error)) return 'done'
  if (RETRYABLE_STATUSES.includes(status) || status >= 500) return 'retry'

  // Un 409 en una ruta granular es un lock ajeno: el interceptor ya lo mandó al canal de
  // conflicto con el texto de la persona. Un 403 en un replay NO lo anuncia (ver el
  // interceptor en Api.js), así que cae abajo y lo avisa la cola con su motivo.
  const url = (error.config && error.config.url) || ''
  if (status === 409 && refLockKeyFromUrl(url)) return 'drop-announced'

  return 'drop'
}

/** El motivo que ve la persona. Agrupa los códigos en lo que ella puede hacer distinto. */
export function rejectionReason (status) {
  if (status === 403) return 'forbidden'
  if (status === 404 || status === 410) return 'gone'
  return 'rejected'
}
