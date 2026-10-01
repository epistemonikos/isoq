/**
 * El lock del modal «Review finding groups» (Paso 2).
 *
 * Un ref-lock con clave fija, como el de Propiedades: no cuelga de ningún estudio, así
 * que el único choque posible es la misma clave tomada por otra persona. El servidor la
 * exige en las rutas genéricas de `isoqf_list_categories` (bloquea si otro la tiene; no
 * exige poseerla).
 */
export const CATEGORIES_LOCK_KEY = 'list_categories'

/**
 * El lock de OTRA persona sobre la clave, o null. Uno propio —la misma persona en otra
 * pestaña— cuenta como libre: el acquire se lo concede igual.
 */
export function findCategoriesLock (locks, myUserId) {
  return (locks || []).find(lock => (
    lock.ref_id === CATEGORIES_LOCK_KEY && String(lock.user_id) !== String(myUserId)
  )) || null
}

/** Clave i18n del cartel, o null si no corresponde ninguno. Un estado desconocido cae en null. */
export function categoriesLockMessageKey (status, lockedBy) {
  if (status === 'denied') return lockedBy ? 'lock.categories_locked_by' : 'lock.categories_unavailable'
  if (status === 'lost') return lockedBy ? 'lock.categories_lost_to' : 'lock.categories_lost'
  if (status === 'forbidden') return 'lock.permissions_revoked'
  if (status === 'released_idle') return 'lock.categories_released_idle'
  return null
}

/**
 * True si el servidor rechazó la escritura de un grupo porque otra persona tiene el modal.
 *
 * Allowlist sobre `reason`: el mismo 409 llega también por `duplicate_key` (nombre
 * repetido), que tiene su propio aviso, y un motivo que este cliente no conozca no debe
 * leerse como «otra persona está editando».
 */
export function isCategoriesLockRejection (error) {
  const response = error && error.response
  if (!response || response.status !== 409) return false
  return Boolean(response.data && response.data.reason === 'locked_by_other_user')
}
