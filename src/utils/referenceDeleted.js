import { baseRefOf } from '@/utils/camelotAssessmentKeys'
import { ED_ROW_INFIX } from '@/utils/extractedDataLockKeys'

/**
 * Un estudio que otra persona borró en el Paso 1 mientras acá estaba abierto.
 *
 * El servidor lo dice de tres maneras y las tres terminan en el mismo evento
 * `reference-deleted`, que es lo único que escuchan los editores y las vistas:
 *
 * - el latido o el acquire de un lock de ese estudio: 409 `reason: reference_deleted`
 *   (`lockService.js`). Es como se entera quien lo tenía abierto sin esperar a guardar;
 * - una escritura por ítem (`/item/<ref_id>`): el mismo 409, porque el servidor ya no
 *   deja que el upsert resucite la fila (`Api.js`);
 * - `/identity`: guarda el resto de la selección y devuelve los descartados en
 *   `dropped_references` (`ViewTable`, `editListEvidenceProfile`).
 *
 * El evento lleva el estudio, no la clave de lock: `R1`, `R1::s0::o2` y `ed1::ed::R1` son
 * el mismo estudio, y quien escucha decide por estudio si lo afecta.
 *
 * Es un canal propio y no `ref-lock-lost`/`ref-lock-conflict` porque esos hablan de otra
 * persona que TIENE el lock — el cartel diría «lo está editando X», y acá no hay nada que
 * esperar: el estudio ya no existe. Por lo mismo `isLockRejection` lo deja afuera.
 */
export const REFERENCE_DELETED = 'reference_deleted'

export const REFERENCE_DELETED_EVENT = 'reference-deleted'

/** El estudio de una clave de ref-lock: `R1`, `R1::s0::o2` y `ed1::ed::R1` -> `R1`. */
export function studyOfLockKey (lockKey) {
  if (typeof lockKey !== 'string' || !lockKey) return null
  const at = lockKey.indexOf(ED_ROW_INFIX)
  if (at > 0) return lockKey.slice(at + ED_ROW_INFIX.length)
  return baseRefOf(lockKey) || lockKey
}

/** True cuando el servidor rechazó la escritura porque el estudio ya no existe. */
export function isReferenceDeletedRejection (error) {
  const data = error && error.response && error.response.data
  return Boolean(error && error.response && error.response.status === 409 &&
    data && data.reason === REFERENCE_DELETED)
}

/**
 * Avisa que `refId` fue borrado. `source` elige el texto: 'lock' (el editor se cierra, lo
 * no guardado se pierde), 'write' (no se guardó) o 'identity' (se guardó sin él).
 */
export function announceReferenceDeleted ({ refId, deletedBy = null, source = 'lock' }) {
  if (!refId || typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(REFERENCE_DELETED_EVENT, {
    detail: { refId, deletedBy: deletedBy || null, source }
  }))
}

/** Clave i18n del aviso según `source`. Lo desconocido cae en el texto del lock. */
export function referenceDeletedMessageKey (source, deletedBy) {
  const base = source === 'write' ? 'reference_deleted.not_saved'
    : source === 'identity' ? 'reference_deleted.saved_without'
      : 'reference_deleted.editor_closed'
  return deletedBy ? `${base}_by` : base
}

/**
 * Quiénes, además de mí, están trabajando ahora con el estudio `refId`, en cualquier
 * granularidad: el estudio entero, una celda del Paso 4 o una fila de datos extraídos de
 * algún hallazgo. Lo usa el Paso 1 para advertir antes de borrar — advierte, no bloquea.
 *
 * Los locks propios se descartan por `user_id` (cubre otra pestaña mía) y por las claves
 * que esta pestaña sostiene (`ownKeys`), por si el listado no trae `user_id`.
 *
 * @param {Array<{ref_id, user_id, user_name}>} locks el sondeo de viewProject
 * @returns {string[]} nombres, sin repetir
 */
export function studyHolders (locks, refId, ownUserId = null, ownKeys = new Set()) {
  if (!refId || !Array.isArray(locks)) return []
  const names = []
  locks.forEach(lock => {
    if (!lock || ownKeys.has(lock.ref_id)) return
    if (ownUserId && lock.user_id === ownUserId) return
    if (studyOfLockKey(lock.ref_id) !== refId) return
    const name = lock.user_name || '?'
    if (!names.includes(name)) names.push(name)
  })
  return names
}

/**
 * Los ids de `selected` que siguen existiendo en `refs` (las referencias cargadas).
 *
 * El modal de referencias de un hallazgo arrancaba con `list.references` tal cual, y un
 * id que ya no existe no se dibuja como checkbox pero seguía en la selección: guardar lo
 * reenviaba. Sin `refs` cargadas no se filtra nada — vaciar la selección por no saber
 * sería peor que reenviar un id que el servidor igual descarta.
 */
export function existingReferenceIds (selected, refs) {
  if (!Array.isArray(selected)) return []
  if (!Array.isArray(refs) || !refs.length) return [...selected]
  const known = new Set(refs.map(ref => ref && ref.id))
  return selected.filter(id => known.has(id))
}

/**
 * `/identity` guardó sin los estudios que ya no existían y los devuelve en
 * `dropped_references`. Se avisa uno por uno: la persona marcó algo que no quedó.
 */
export function announceDroppedReferences (body) {
  const dropped = body && Array.isArray(body.dropped_references) ? body.dropped_references : []
  dropped.forEach(item => {
    if (item && item.ref_id) {
      announceReferenceDeleted({ refId: item.ref_id, deletedBy: item.deleted_by, source: 'identity' })
    }
  })
  return dropped.length
}
