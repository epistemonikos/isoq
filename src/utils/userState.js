/**
 * Estado de una cuenta de usuario, derivado del campo `active` del backend.
 *
 * El contrato del servidor es **"ausente = activo"**, y lo sostiene en todas partes:
 * `models.py` lee `user_data.get('active', True)`, `_sanitize_user()` del panel de
 * admin hace `setdefault('active', True)`, y toda consulta de usuarios activos se
 * escribe `{'active': {'$ne': False}}`. Sólo el `False` explícito desactiva.
 *
 * El detalle que rompe todo: `/admin/users` normaliza el campo antes de responder,
 * pero `/api/getProjects` y `/api/isoqf_projects/<id>` lo proyectan crudo desde Mongo
 * (`selectors={'active': 1}`). Un selector no puede devolver un campo que no existe en
 * el documento, así que para esos dos endpoints el campo **simplemente no viaja**.
 *
 * Medido el 2026-09-14 en la base local: 1749 usuarios, **1747 sin el campo**, y
 * **cero** con `active: False`. Con un chequeo truthy salían todos tachados en el modal
 * de compartir y con el select de permisos deshabilitado — usuarios válidos a los que
 * no se les podía cambiar el permiso.
 *
 * Por qué la regla vive acá y no en cada sitio: la expresión estaba repetida cuatro
 * veces en `viewOrganization.usersCanList()`, una por cada rama (can_read / can_write,
 * y sus dos fallbacks por API). Cuatro copias de una regla es cuatro lugares donde
 * arreglarla a medias.
 */

/**
 * True salvo que la cuenta esté explícitamente desactivada.
 *
 * Es una allowlist de desactivación, no una denylist de activación: cualquier forma que
 * no sea el `false` explícito cae en el comportamiento anterior a la feature (activo).
 * Escrito al revés, cada campo ausente, nulo o no serializado desactivaría a alguien.
 *
 * @param {Object|null|undefined} user usuario tal como llega del backend
 * @returns {boolean}
 */
export function isUserActive (user) {
  // Comparación estricta a propósito. Los dos errores posibles no cuestan lo mismo:
  // desactivar de más bloquea el select de permisos de alguien válido —el bug que se
  // está arreglando acá—, mientras que desactivar de menos sólo muestra sin tachar a
  // una cuenta que el backend ya no deja entrar igual. Ante la duda, activo.
  //
  // `user && ...` cubre el usuario que no llegó: en `usersCanList()` el fallback por
  // API arma el objeto con `response.data`, que puede venir vacío.
  return !(user && user.active === false)
}

/**
 * El mismo estado, como la cadena que consumen las plantillas ('active' | 'inactive').
 *
 * @param {Object|null|undefined} user
 * @returns {'active'|'inactive'}
 */
export function deriveUserState (user) {
  return isUserActive(user) ? 'active' : 'inactive'
}
