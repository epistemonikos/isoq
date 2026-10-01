/**
 * El lock de las propiedades del proyecto.
 *
 * Un ref-lock con clave fija y no el lock de proyecto: `@verify_project_lock` del backend
 * rechaza las escrituras ajenas sobre siete colecciones, así que el lock de proyecto
 * congelaba los pasos 1–4 para todo el equipo mientras alguien miraba las propiedades.
 *
 * Una sola clave para la pestaña Propiedades, el modal de la lista y el modal Publicar:
 * Publicar escribe `public_type` y `license_type`, que también son campos de Propiedades.
 */
export const PROPERTIES_LOCK_KEY = 'project_properties'

/**
 * El lock de OTRA persona sobre la clave, o null. Uno propio —la misma persona en otra
 * pestaña del navegador— cuenta como libre: el acquire se lo va a conceder igual, y
 * tratarlo como ajeno la dejaría esperando para siempre.
 */
export function findPropertiesLock (locks, myUserId) {
  return (locks || []).find(lock => (
    lock.ref_id === PROPERTIES_LOCK_KEY && String(lock.user_id) !== String(myUserId)
  )) || null
}

/**
 * Clave i18n del cartel, o null si no corresponde mostrar ninguno. Un estado desconocido
 * cae en null: no inventa un cartel.
 */
export function propertiesLockMessageKey (status, lockedBy) {
  if (status === 'denied') return lockedBy ? 'lock.properties_locked_by' : 'lock.properties_unavailable'
  if (status === 'lost') return lockedBy ? 'lock.properties_lost_to' : 'lock.properties_lost'
  if (status === 'forbidden') return 'lock.permissions_revoked'
  if (status === 'released_idle') return 'lock.properties_released_idle'
  return null
}
