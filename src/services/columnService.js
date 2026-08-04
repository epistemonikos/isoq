/**
 * Operaciones granulares de columna para las tablas del Paso 3 y del Paso 4.
 *
 * Reemplazan el PATCH del documento completo, que era Last-Write-Wins: guardar columnas
 * con una copia obsoleta de `fields` borraba la columna que otra persona acababa de crear.
 * Cada operación de acá toca una sola clave con un operador atómico, así que dos usuarios
 * agregando columnas distintas ya no se pisan.
 *
 * El lock NO se gestiona acá: los cuatro endpoints lo exigen cuando la concurrencia está
 * encendida (409 `lock_not_held`), pero la unidad es el documento (`<doc_id>::fields`) y
 * quien sabe cuándo empieza y termina la edición es el modal. El componente lo toma al
 * primer cambio real y lo suelta al cerrar.
 */
import Api from '@/utils/Api'
import { i18n } from '@/plugins/i18n'
import { newCustomFieldKey } from '@/utils/customFieldsHelper'

// Claves que el backend conserva en su posición y que rechaza si viajan en `order`.
// Las 24 claves CAMELOT NO están acá a propósito: no se pueden crear ni borrar, pero sí
// se reordenan.
const SYSTEM_FIELD_KEYS = ['ref_id', 'authors', 'actions', 'edit']

function fieldPath (collection, docId, key) {
  return `/${collection}/${docId}/field/${key}`
}

/**
 * Agrega una columna. La clave la genera el cliente, así que el alta es un `PATCH`
 * idempotente: se puede encolar sin conexión, reproducir sin duplicar, y la columna se
 * puede renderizar antes de que llegue la respuesta.
 *
 * @returns {Promise<{key: string, response: Object}>}
 */
export async function addColumn (collection, docId, label) {
  const key = newCustomFieldKey()
  const response = await Api.patch(fieldPath(collection, docId, key), { label })
  return { key, response }
}

/** Renombra una columna. Sólo viaja `label`: el backend rechaza `key` en el body. */
export function renameColumn (collection, docId, key, label) {
  return Api.patch(fieldPath(collection, docId, key), { label })
}

/**
 * Borra una columna. El backend quita la entrada de `fields` y limpia esa clave en todas
 * las filas, así que no hay que mandar `items`. Es idempotente: una clave inexistente
 * devuelve 200.
 */
export function deleteColumn (collection, docId, key) {
  return Api.delete(fieldPath(collection, docId, key))
}

/**
 * Reordena. `order` acepta un subconjunto: lo que no se menciona se queda en su índice,
 * así que una columna que otra persona agregó mientras el modal estaba abierto no se
 * pierde ni hace fallar el request.
 */
export function reorderColumns (collection, docId, order) {
  if (!order || !order.length) return Promise.resolve(null)
  return Api.put(`/${collection}/${docId}/fields/order`, { order })
}

/**
 * Id del documento de la tabla, creándolo si todavía no existe. Los cuatro endpoints
 * granulares necesitan un `<doc_id>`, y en un proyecto nuevo la primera columna se pide
 * antes de que exista el documento.
 *
 * Consulta antes de crear a propósito: es la mitigación acordada con el backend para la
 * carrera de doble creación, que hoy no tiene índice único que la cierre. Encoge la
 * ventana sin tomar el lock de proyecto, que frenaría a todos los demás en el proyecto.
 *
 * @returns {Promise<string|null>}
 */
export async function ensureTableDocument (collection, organization, projectId) {
  const existing = await Api.get(
    `/${collection}?organization=${organization}&project_id=${projectId}`
  )
  const found = existing && existing.data && existing.data[0]
  if (found) return found.id || found._id || null

  // La creación es la única ruta donde el cliente manda `fields` completo: el documento no
  // existe, así que no hay copia obsoleta posible ni columnas de otra persona que perder.
  // Sólo los de sistema; las columnas llegan después, de a una. Y sin `items`: en CAMELOT
  // las filas son un left-join virtual contra las referencias.
  const created = await Api.post(`/${collection}/`, {
    organization,
    project_id: projectId,
    fields: [
      { key: 'ref_id', label: i18n.t('table_headers.reference_id') },
      { key: 'authors', label: i18n.t('table_headers.author_year') }
    ]
  })
  const data = created && created.data
  return data ? (data.id || data._id || null) : null
}

/**
 * Claves reordenables de un `fields`, en su orden actual: todo menos los campos de
 * sistema. Es lo que puede viajar en `order`.
 */
export function movableKeys (fields) {
  return (fields || [])
    .filter(field => field && field.key && !SYSTEM_FIELD_KEYS.includes(field.key))
    .map(field => field.key)
}

export default {
  addColumn,
  ensureTableDocument,
  renameColumn,
  deleteColumn,
  reorderColumns,
  movableKeys
}
