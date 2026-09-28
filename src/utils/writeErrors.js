import { isLockRejection, isVersionRejection, isDuplicateKeyRejection } from '@/utils/lockErrors'
import { rejectionReason } from '@/utils/replayOutcome'

/**
 * Qué aviso corresponde a una escritura que falló, o `null` si otro canal ya avisó.
 *
 * Muchos `.catch` sólo llamaban a `Commons.printErrors`, que arma un objeto y no muestra
 * nada: publicar dejaba el spinner girando, y quitarle el acceso a alguien podía fallar sin
 * que el dueño se enterara. Esta función decide el aviso en un solo lugar para que todas
 * las pantallas digan lo mismo — y lo mismo que la cola offline (`rejectionReason`).
 *
 * Es una ALLOWLIST de lo que se calla: sólo lo que ya anunció otro canal. Un error que el
 * cliente no reconozca termina visible; escrito al revés, cada motivo nuevo del servidor
 * sería otro silencio.
 *
 * @param {Error} error
 * @param {string} [fallbackKey] el texto de la acción («no se pudo compartir…»)
 * @returns {string|null} clave i18n, o null
 */
export function writeErrorMessageKey (error, fallbackKey = 'notifications.save_error') {
  if (error && error.isOfflineError) return null // OfflineIndicator
  if (isLockRejection(error)) return null // canal de conflicto de lock (ref-lock-conflict)
  if (isVersionRejection(error)) return null // canal de conflicto de versión

  const response = error && error.response
  const status = response && response.status
  const message = (response && response.data && response.data.message) || ''
  // El proyecto lo tiene otra persona: el interceptor muestra el modal «bloqueado por X».
  if (status === 409 && String(message).includes('Project is locked')) return null

  if (isDuplicateKeyRejection(error)) return 'notifications.write_duplicate'
  if (!status) return fallbackKey

  const reason = rejectionReason(status)
  if (reason === 'forbidden') return 'notifications.write_forbidden'
  if (reason === 'gone') return 'notifications.write_gone'
  return fallbackKey
}

/**
 * Para las pantallas previas al login. Sus rutas (`/auth/`) no pasan por el aviso central de
 * «necesita conexión», así que el caso sin red lo dicen ellas. No se dice «sin conexión»: un
 * servidor caído llega igual como error de red, y mandar a revisar el wifi a quien lo tiene
 * sería otro aviso falso.
 */
export function requestFailureKey (error) {
  const status = error && error.response && error.response.status
  if (!status || (error && error.isOfflineError)) return 'common.connection_failed'
  return 'common.server_failed'
}
