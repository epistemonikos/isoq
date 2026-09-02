import { refLockKeyFromUrl } from '@/utils/refLockUrls'

// A rejection on a granular write that the concurrency layer already explains on its
// own: 409 goes out as `ref-lock-conflict` (with the holder's name and the text kept
// locally), 403 as `permission-denied`.
const ANNOUNCED_STATUSES = [409, 403]

// The item-version check answers on the same URLs and with the same 409, but it is a
// different axis: the lock decides WHO may write, the version decides whether what is
// about to be written was read before somebody else changed it. Its rejections have no
// announcement of their own — the conflict channel talks about locks, and here the user
// does hold theirs. Staying silent would drop a save with no signal at all.
const VERSION_REASONS = new Set(['version_conflict', 'invalid_version'])

// El nombre ya existe en el proyecto. Tercer eje, y el único de los tres en que no hay
// nadie del otro lado: no es que otra persona esté editando ni que la fila haya cambiado
// bajo los pies, es que el texto que se quiere escribir choca con uno que ya está.
const DUPLICATE_KEY_REASON = 'duplicate_key'

/**
 * True when a failed save has already been reported to the user by the lock channel.
 *
 * Every editor's `catch` used to add "could not save, please try again" on top of that
 * message. Two toasts said contradictory things about one event, and the generic one
 * gave advice that cannot work: retrying does nothing while somebody else holds the
 * lock. Verified in the browser on 2026-08-19.
 */
export function isLockRejection (error) {
  const status = error && error.response && error.response.status
  if (!ANNOUNCED_STATUSES.includes(status)) return false
  if (isVersionRejection(error)) return false
  if (isDuplicateKeyRejection(error)) return false
  const url = (error.config && error.config.url) || ''
  return Boolean(refLockKeyFromUrl(url))
}

/**
 * True when the server rejected the write over the item's version rather than its lock.
 *
 * Reads `reason` and nothing else: the status and the URL are identical to a lock
 * conflict, so they cannot tell the two apart. A 409 with no `reason` is a lock
 * conflict, which is what every 409 was before this check existed.
 */
export function isVersionRejection (error) {
  const reason = error && error.response && error.response.data &&
    error.response.data.reason
  return VERSION_REASONS.has(reason)
}

/**
 * True cuando el servidor rechazó la escritura porque el nombre ya existe.
 *
 * Lee `reason` y nada más, igual que el chequeo de versión: el status es el mismo 409 y
 * el endpoint puede ser cualquiera con un índice único detrás. Hoy son las categorías.
 *
 * De acá cuelgan dos decisiones y conviene tenerlas juntas. La primera es qué se ve: el
 * cartel de lock diría «otra persona tiene el estudio» cuando no hay nadie editando. La
 * segunda es que **reintentar no puede funcionar**: el payload lleva el nombre que choca,
 * así que la cola offline tiene que descartar la operación en vez de repetirla para
 * siempre y trabar todo lo que quedó detrás.
 */
export function isDuplicateKeyRejection (error) {
  const reason = error && error.response && error.response.data &&
    error.response.data.reason
  return reason === DUPLICATE_KEY_REASON
}
