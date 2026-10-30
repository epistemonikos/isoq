import { fixedLockMessageKey } from '@/utils/fixedRefLock'

/**
 * El lock del modal «Re-order your review findings» (Paso 2). El servidor lo exige en los
 * PATCH/PUT de `isoqf_lists` que traen `sort`; el resto de la edición de un finding (título,
 * grupo, referencias, worksheet) escribe otros campos y no se bloquea.
 */
export const FINDINGS_ORDER_LOCK_KEY = 'findings_order'

export function findingsOrderLockMessageKey (status, lockedBy) {
  return fixedLockMessageKey('findings_order', status, lockedBy)
}

/**
 * El orden elegido en el modal, ajustado a los findings que hay AHORA en el servidor.
 *
 * El modal trabaja sobre la foto que tomó al abrirse. Si mientras tanto otra persona creó o
 * borró findings, guardar esa foto a ciegas escribiría `sort` sobre listas que ya no existen
 * (404 y un «error al guardar» falso) y dejaría las nuevas sin ordenar. Así que antes de
 * guardar se reconcilia: se conserva el orden de la persona para las que siguen, se sacan las
 * borradas y las nuevas van al final, que es donde las deja el alta (`sort` = máximo + 1).
 *
 * Los objetos del resultado son los frescos (el título puede haber cambiado), no los de la foto.
 *
 * @returns {{ lists: Object[], added: Object[], removed: Object[], changed: boolean }}
 */
export function reconcileFindingsOrder (chosen, fresh) {
  const freshById = new Map((fresh || []).map(list => [list.id, list]))
  const chosenIds = new Set((chosen || []).map(list => list.id))
  const kept = (chosen || []).filter(list => freshById.has(list.id)).map(list => freshById.get(list.id))
  const removed = (chosen || []).filter(list => !freshById.has(list.id))
  const added = (fresh || []).filter(list => !chosenIds.has(list.id))
  return {
    lists: [...kept, ...added],
    added,
    removed,
    changed: added.length > 0 || removed.length > 0
  }
}
