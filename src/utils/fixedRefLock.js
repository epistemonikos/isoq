/**
 * Lo común a los ref-locks de clave fija (`list_categories`, `findings_order`): claves que
 * no cuelgan de ningún estudio, así que el único choque posible es la misma clave tomada
 * por otra persona. El servidor las exige en sus rutas (bloquea si otro la tiene; no exige
 * poseerla).
 */

/**
 * El lock de OTRA persona sobre `key`, o null. Uno propio —la misma persona en otra
 * pestaña— cuenta como libre: el acquire se lo concede igual.
 */
export function findForeignFixedLock (locks, key, myUserId) {
  return (locks || []).find(lock => (
    lock.ref_id === key && String(lock.user_id) !== String(myUserId)
  )) || null
}

/**
 * Clave i18n del cartel (`lock.<prefix>_…`), o null si no corresponde ninguno. Un estado
 * desconocido cae en null: no inventa un cartel.
 */
export function fixedLockMessageKey (prefix, status, lockedBy) {
  if (status === 'denied') return lockedBy ? `lock.${prefix}_locked_by` : `lock.${prefix}_unavailable`
  if (status === 'lost') return lockedBy ? `lock.${prefix}_lost_to` : `lock.${prefix}_lost`
  if (status === 'forbidden') return 'lock.permissions_revoked'
  if (status === 'released_idle') return `lock.${prefix}_released_idle`
  return null
}

/**
 * True si el servidor rechazó la escritura porque otra persona tiene el lock.
 *
 * Allowlist sobre `reason`: el mismo 409 llega también por `duplicate_key` (nombre
 * repetido), que tiene su propio aviso, y un motivo que este cliente no conozca no debe
 * leerse como «otra persona está editando».
 */
export function isFixedLockRejection (error) {
  const response = error && error.response
  if (!response || response.status !== 409) return false
  return Boolean(response.data && response.data.reason === 'locked_by_other_user')
}
