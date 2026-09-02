/**
 * Qué decirle a la persona cuando el latido perdió el ref-lock.
 *
 * El servidor manda tres motivos y no se explican igual. La diferencia que importa no es
 * quién tiene el lock: es **si va a poder seguir**.
 *
 * - `evicted_granularity_conflict`: alguien tiene otra granularidad del mismo estudio y el
 *   desempate por antigüedad nos desalojó. Se destraba solo en cuanto la otra persona
 *   suelta la hoja, así que el cartel puede prometer eso y ofrecer reintentar.
 * - `locked_by_other_user`: lo tomaron. No hay nada que esperar salvo que terminen.
 * - `lock_expired`: caducó y no hay a quién nombrar.
 *
 * Un servidor sin ese despliegue, un 401 o un 403 no mandan motivo, y un cliente viejo
 * puede recibir un motivo que no conoce. En los dos casos el default cae del lado del
 * comportamiento anterior: se nombra a quien lo tenga, o se usa el texto anónimo. Mismo
 * criterio que la allowlist del 409 de versión — lo desconocido no debe cambiar la rama.
 *
 * Vive acá y no en cada componente porque siete handlers de `ref-lock-lost` muestran este
 * cartel, y este hilo ya mostró dos veces lo que cuesta tener la misma regla en dos copias.
 */

// El latido, cuando nos desaloja por granularidad.
const EVICTED = 'evicted_granularity_conflict'
// El acquire, cuando otro tiene otra granularidad del mismo estudio. Es la misma situación
// de fondo que EVICTED y el servidor le da un valor propio a propósito: acá la persona
// nunca tuvo el lock, así que el texto no explica una pérdida.
const DENIED_OTHER_GRANULARITY = 'locked_at_another_granularity'
const EXPIRED = 'lock_expired'

/** Clave i18n del cartel cuando el latido nos quitó el lock. */
export function lockLostMessageKey (reason, lockedBy) {
  if (reason === EVICTED) return 'lock.evicted_granularity'
  if (reason === EXPIRED) return 'lock.lock_expired'
  return lockedBy ? 'lock.ref_locked_by' : 'lock.permissions_revoked'
}

/** Clave i18n del cartel cuando el acquire nos negó el lock al abrir el editor. */
export function lockDeniedMessageKey (reason, lockedBy) {
  if (reason === DENIED_OTHER_GRANULARITY) return 'lock.locked_at_another_granularity'
  return lockedBy ? 'lock.ref_locked_by' : 'lock.permissions_revoked'
}

/**
 * True cuando el bloqueo se destraba solo y tiene sentido ofrecer volver a intentar.
 *
 * Los dos motivos de granularidad cuentan, vengan del latido o del acquire: en los dos la
 * espera termina cuando la otra persona suelta la hoja. Que el servidor los nombre distinto
 * es para el texto, no para esta decisión.
 */
export function isRetryableLockLoss (reason) {
  return reason === EVICTED || reason === DENIED_OTHER_GRANULARITY
}
