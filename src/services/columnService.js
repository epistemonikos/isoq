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
  renameColumn,
  deleteColumn,
  reorderColumns,
  movableKeys
}
