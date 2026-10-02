/**
 * Nombre con el que el backend denormaliza al dueño de un lock (`user_name`).
 *
 * Vive acá porque lo necesitan dos consumidores que no deben importarse entre sí:
 * `refLockStateMixin` (locks de estudio de los Pasos 3/4) y `Criteria.vue` (cajas del
 * Paso 2). Los dos hacen la misma pregunta —«¿este lock es mío?»— y una respuesta
 * distinta en cada lado se ve como una caja bloqueada contra uno mismo.
 */
export function userDisplayName (user) {
  const u = user || {}
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || null
}
