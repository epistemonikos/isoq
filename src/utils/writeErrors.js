import { isLockRejection, isVersionRejection, isDuplicateKeyRejection } from '@/utils/lockErrors'
import { rejectionReason } from '@/utils/replayOutcome'
import { isReferenceDeletedRejection } from '@/utils/referenceDeleted'
import { isPersonalDataConfirmationRejection } from '@/utils/personalDataConfirmation'

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
  // El 403 de una escritura es de `permission-denied`: la pantalla que lo reclamó
  // (viewProject / editList) ya dijo si se perdió la escritura o si ese cambio no se
  // permite. Sin dueño montado no viene marcado, y se avisa abajo como `write_forbidden`.
  if (error && error.permissionDeniedAnnounced) return null
  if (isLockRejection(error)) return null // canal de conflicto de lock (ref-lock-conflict)
  if (isVersionRejection(error)) return null // canal de conflicto de versión
  if (isReferenceDeletedRejection(error)) return null // canal reference-deleted (Api.js)

  const response = error && error.response
  const status = response && response.status

  if (isDuplicateKeyRejection(error)) return 'notifications.write_duplicate'
  if (isPersonalDataConfirmationRejection(error)) return 'publish.confirm_no_personal_data_required'
  if (!status) return fallbackKey

  const reason = rejectionReason(status)
  if (reason === 'forbidden') return 'notifications.write_forbidden'
  if (reason === 'gone') return 'notifications.write_gone'
  return fallbackKey
}

/**
 * True cuando la escritura no llegó al servidor: la cola offline la guardó para después y
 * respondió `200` con `queued: true`.
 *
 * Un «Guardado» ahí promete algo que todavía no pasó —y que el replay puede rechazar—. Lo
 * pendiente ya lo cuenta la barra de OfflineIndicator; el éxito se anuncia cuando lo hay.
 */
export function wasOnlyQueued (response) {
  return Boolean(response && response.queued)
}

/**
 * Para las pantallas previas al login. Sus rutas (`/auth/`) no pasan por el aviso central de
 * «necesita conexión», así que el caso sin red lo dicen ellas. No se dice «sin conexión»: un
 * servidor caído llega igual como error de red, y mandar a revisar el wifi a quien lo tiene
 * sería otro aviso falso.
 */
export function requestFailureKey (error) {
  if (error && error.isOfflineError) return 'common.connection_failed'
  const status = error && error.response && error.response.status
  // `/auth/login` está limitado por Flask-Limiter, que responde HTML sin `status`. «El
  // servidor falló» mandaba a esperar sin decir por qué ni cuánto.
  if (status === 429) return 'common.too_many_attempts'
  if (status) return 'common.server_failed'
  // Sin respuesta pero con petición: la red o el servidor caído.
  if (error && (error.request || error.isAxiosError)) return 'common.connection_failed'
  // No viene de una petición (un error del router, por ejemplo): no es un problema de
  // conexión, y decirlo sería falso.
  return null
}
