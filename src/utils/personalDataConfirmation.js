/**
 * Confirmación de que el contenido no identifica a participantes de estudios primarios ni
 * incluye datos personales que no se puedan hacer públicos.
 *
 * Es obligatoria para publicar, y la exige también el servidor: PATCH /api/publish responde
 * 400 `personal_data_confirmation_required` a todo guardado con nivel público que no la traiga
 * en `true`. Por eso se pide en las tres puertas que publican —el modal Publicar, la pestaña
 * Propiedades y el modal de edición de la lista—, y en cada guardado público, no sólo al
 * publicar por primera vez: los proyectos publicados antes de la casilla confirman la próxima
 * vez que alguien los guarda. Despublicar la borra en el servidor.
 */
export const PERSONAL_DATA_CONFIRMED = 'no_personal_data_confirmed'
export const PERSONAL_DATA_CONFIRMATION_REASON = 'personal_data_confirmation_required'

// Sólo `true` confirma: el servidor rechaza 'true' y 1.
export function needsPersonalDataConfirmation (project) {
  if (!project || project.public_type === 'private') return false
  return project[PERSONAL_DATA_CONFIRMED] !== true
}

export function isPersonalDataConfirmationRejection (error) {
  const data = error && error.response && error.response.data
  return Boolean(data && data.reason === PERSONAL_DATA_CONFIRMATION_REASON)
}
