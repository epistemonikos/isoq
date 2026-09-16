/**
 * Quiénes están dentro de un hallazgo, para las superficies que informan sin bloquear.
 *
 * La presencia es un canal aparte de los ref-locks: entrar a la worksheet de un
 * hallazgo no toma ningún lock, así que sin esto el listado iSoQ muestra los botones
 * de renombrar y borrar habilitados mientras alguien está adentro leyendo.
 *
 * Vive acá y no en un componente por la misma razón que `lockLostMessage.js`: son
 * cinco las superficies que hacen esta pregunta —la fila del listado, los tres
 * modales del hallazgo y la cabecera de la worksheet— y este repo ya pagó dos veces
 * por tener la misma regla en dos copias.
 */
import { lockKeyBelongsTo } from '@/utils/evidenceProfileLockKeys'

/**
 * Nombres a listar como «revisando», ordenados y sin repetir persona.
 *
 * Las tres reglas, y por qué cada una:
 *
 *  1. **Quien ya está nombrado por un lock del hallazgo sale.** La presencia es un
 *     superconjunto: quien abre un editor sigue estando adentro, pero su aviso de
 *     lock dice algo más informativo («está evaluando Coherence»). Nombrarlo dos
 *     veces con dos textos distintos es peor que no nombrarlo. `lockKeyBelongsTo`
 *     cubre tanto el id pelado como cualquier sección que cuelgue de él.
 *  2. **La identidad se compara por `user_id`, nunca por `user_name`.** Los dos
 *     endpoints lo mandan (`lock.py` lo agregó al listado de locks justamente por
 *     esto), y comparar por nombre colapsa homónimos — reales en proyectos con
 *     varios colaboradores de la misma institución.
 *  3. **El orden es estable, no el de llegada.** Ni `GET /presence` ni `GET /refs`
 *     garantizan orden. Sin esto, dos personas mirando la misma fila leen nombres en
 *     distinto orden, y el texto cambia entre dos sondeos sin que nada haya cambiado
 *     — el mismo defecto que `findingLockDetailsOf` ya tuvo que corregir.
 *
 * Una fila sin `user_name` no se dibuja: sin a quién nombrar, el cartel queda mudo.
 *
 * @param {Array<{finding_id: string, user_id: string, user_name: string}>} present
 * @param {Array<{ref_id: string, user_id: string}>} foreignLocks locks AJENOS
 * @param {string} findingId
 * @param {string} myUserId
 * @returns {string[]}
 */
export function presentReviewersOf (present, foreignLocks, findingId, myUserId) {
  if (!findingId || !Array.isArray(present)) return []

  const yaNombrados = new Set()
  ;(Array.isArray(foreignLocks) ? foreignLocks : []).forEach((lock) => {
    if (!lock || !lock.ref_id || !lock.user_id) return
    if (lockKeyBelongsTo(lock.ref_id, findingId)) yaNombrados.add(lock.user_id)
  })

  const vistos = new Set()
  const nombres = []
  present.forEach((row) => {
    if (!row || row.finding_id !== findingId) return
    if (!row.user_id || !row.user_name) return
    if (myUserId && row.user_id === myUserId) return
    if (yaNombrados.has(row.user_id)) return
    if (vistos.has(row.user_id)) return
    vistos.add(row.user_id)
    nombres.push(row.user_name)
  })

  return nombres.sort((a, b) => a.localeCompare(b))
}
