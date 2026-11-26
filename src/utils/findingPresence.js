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

/**
 * Une los nombres en una sola línea: uno solo tal cual, dos o más como
 * «A, B <connector> C».
 *
 * El conector NO es el mismo string en las tres traducciones («y» / «and» / «e»),
 * así que un `join(' y ')` escrito en un componente sería español a mano metido en
 * las traducciones en y pt. Por eso el conector ya viene traducido como parámetro
 * — este módulo no importa `$t`, ese es el patrón de `SECTION_LABEL_KEYS` en
 * `evidenceProfileLockKeys.js`: los datos viven acá, la traducción la hace quien
 * llama.
 *
 * Vive junto a `presentReviewersOf` porque siempre se usan en pareja, y porque dos
 * superficies (la fila del listado y el modal abierto de `ViewTable.vue`) ya
 * tenían esta misma cuenta escrita dos veces antes de moverla acá.
 *
 * @param {string[]} nombres
 * @param {string} connector ya traducido (`presence.and`)
 * @returns {string}
 */
export function joinReviewerNames (nombres, connector) {
  if (!nombres || !nombres.length) return ''
  if (nombres.length === 1) return nombres[0]
  return `${nombres.slice(0, -1).join(', ')} ${connector} ${nombres[nombres.length - 1]}`
}

/**
 * La frase completa del aviso de presencia: junta los nombres y elige la clave
 * singular o plural.
 *
 * Tres superficies (la fila y los dos modales de `ViewTable.vue`, y el encabezado
 * de `editList.vue`) tenían esta misma cuenta escrita a mano cada una — el commit
 * que extrajo `joinReviewerNames` dejó ésta, la otra mitad de la frase, copiada
 * en las dos. `t` es la función de traducción del componente que llama: este
 * módulo no importa i18n (mismo patrón que `SECTION_LABEL_KEYS` en
 * `evidenceProfileLockKeys.js`), así que recibirla como parámetro es la misma
 * dirección de dependencia que ya usa `joinReviewerNames` con el conector.
 *
 * @param {string[]} nombres de `presentReviewersOf`
 * @param {function} t función `$t` del componente
 * @returns {string} vacío si no hay nadie que nombrar
 */
export function presenceNoticeText (nombres, t) {
  if (!nombres || !nombres.length) return ''
  const users = joinReviewerNames(nombres, t('presence.and'))
  return t(
    nombres.length === 1 ? 'presence.reviewing_one' : 'presence.reviewing_many',
    { users })
}
