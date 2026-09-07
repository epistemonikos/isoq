/**
 * Reading a lock key out of a request URL. Lives apart from `Api` on purpose: it is a
 * pure string function, and the error helpers that need it must not have to pull in
 * axios, Dexie and i18n (nor be defeated by a test that automocks the HTTP client).
 * `Api` re-exports it so existing importers keep working.
 */
import { leafLockKey } from '@/utils/camelotAssessmentKeys'
import { EP_SECTION_INFIX } from '@/utils/evidenceProfileLockKeys'

// Endpoint D nests the cell position under /item/, so the raw split would yield
// '<ref_id>/stage/0/option/2' — a string that matches no lock the client holds.
// The lock the backend checks is the composite key '<ref_id>::s0::o2'.
const ITEM_LEAF_URL_RE = /\/item\/([^/]+)\/stage\/([^/]+)\/option\/([^/?]+)/
// El endpoint A bloquea UNA SECCIÓN del evidence profile, así que su clave compone el
// id del documento con el nombre de la sección: `<doc_id>::ep::<name>`. Antes devolvía
// el id pelado, que era la unidad de lock cuando abrir cualquiera de los cinco
// assessments se llevaba el finding entero.
//
// Esta clave es la que el interceptor de 409 usa para elegir a qué editor avisarle y la
// que la cola offline persiste para re-adquirir el lock en el replay. Si no coincide con
// la que el modal sostiene, el fallo NO es un aviso mal enrutado: un 409 en vivo queda
// mudo —`isLockRejection` suprime el toast genérico dando por hecho que el canal de
// conflicto habló— y una escritura offline se pierde en silencio, re-fallando en cada
// reconexión. El nombre de la sección lo valida el servidor con un 400; acá se compone
// tal como viene, igual que el resto de las claves de este módulo.
const SECTION_URL_RE = /\/(?:isoqf_findings|isoqf_lists)\/([^/]+)\/section\/([^/?]+)/
// La identidad del finding (name, category, notes, references). Bloquea el DOCUMENTO
// —el id pelado—, que ya NO es la misma clave que el evidence profile: ésa pasó a ser
// por sección. Siguen excluyéndose de todas formas, y eso es deliberado: el servidor
// hace colgar `<doc_id>::ep::<name>` de `<doc_id>`, así que quien renombra desde la
// tabla y quien evalúa una dimensión no pueden pisarse — cambiar las referencias
// invalida los datos extraídos de esa hoja. Lo que se ganó es que dos personas sí
// puedan evaluar dimensiones distintas a la vez. El servidor espeja los cuatro campos a
// `isoqf_lists`, así que acá va un solo PATCH y un solo lock.
const IDENTITY_URL_RE = /\/isoqf_findings\/([^/]+)\/identity(?:[/?]|$)/
const ITEM_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments|isoqf_extracted_data)\/[^/]+\/item\//
// The four column endpoints lock the table DOCUMENT rather than a row, so their key is
// `<doc_id>::fields`. Keeping it apart from the row key is the point: whoever edits
// columns must not block whoever edits a study.
const FIELD_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments)\/([^/]+)\/(?:field\/[^/?]+|fields\/order)/
const FIELDS_KEY_SUFFIX = '::fields'
const FIELDS_KEY_RE = /^(.+)::fields$/

/**
 * Clave de lock del documento de una tabla: la unidad que toman los cuatro endpoints de
 * columna. Se mantiene aparte de la clave de fila a propósito, para que quien edita
 * columnas no bloquee a quien edita un estudio.
 *
 * Devuelve `null` sin documento en vez de `undefined::fields`: esa clave se tomaría sobre
 * nada y no se soltaría nunca, porque `releaseRef` la busca por igualdad de string y el
 * release iría con otro valor. La falla no sería un error sino un lock colgado.
 */
export function fieldsLockKey (docId) {
  return docId ? `${docId}${FIELDS_KEY_SUFFIX}` : null
}

/** `'doc123::fields'` -> `'doc123'` | `'R1'` -> `null` (no es clave de columnas). */
export function docIdFromFieldsLockKey (lockKey) {
  const match = FIELDS_KEY_RE.exec(lockKey || '')
  return match ? match[1] : null
}

function refLockKeyFromItemUrl (url) {
  const leaf = ITEM_LEAF_URL_RE.exec(url)
  if (leaf) {
    const [, refId, stage, option] = leaf
    return leafLockKey(refId, stage, option) || refId
  }
  return url.split('/item/')[1] || ''
}

/**
 * Lock key a granular write needs, or null when the URL is not a granular endpoint.
 * Endpoints B/C/D lock a row/cell (`ref_id`, `ref::sK::oI`); el endpoint A bloquea una
 * SECCIÓN del evidence profile (`<doc_id>::ep::<name>`) y el de identidad el documento
 * entero (`finding_id` / `list_id`) — son claves distintas a propósito: la del documento
 * es más amplia y el servidor la hace chocar con cualquier sección suya, que es lo que
 * impide renombrar o borrar un finding que otro tiene abierto. The column endpoints lock
 * the table document (`<doc_id>::fields`).
 */
export function refLockKeyFromUrl (url = '') {
  const section = SECTION_URL_RE.exec(url)
  if (section) return `${section[1]}${EP_SECTION_INFIX}${section[2]}`
  const identity = IDENTITY_URL_RE.exec(url)
  if (identity) return identity[1]
  const field = FIELD_URL_RE.exec(url)
  if (field) return fieldsLockKey(field[1])
  if (ITEM_URL_RE.test(url)) return refLockKeyFromItemUrl(url) || null
  return null
}
