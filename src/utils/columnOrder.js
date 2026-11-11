/**
 * Qué orden de columnas puede viajar en `PUT /<coleccion>/<doc>/fields/order`.
 *
 * El servidor (`parse_field_order`) rechaza con 400 los campos de sistema y cualquier clave
 * que el documento no tenga guardada, y deja quieto lo que no se menciona. De ahí las tres
 * exclusiones de `persistableOrder`.
 *
 * Vive aparte de `columnService` a propósito: es lógica pura, y los specs mockean ese
 * servicio entero. Mockeada, la regla que hay que probar desaparecería del test.
 */

// Claves que el backend conserva en su posición y que rechaza si viajan en `order`.
// Las 24 claves CAMELOT NO están acá a propósito: no se pueden crear ni borrar, pero sí
// se reordenan.
export const SYSTEM_FIELD_KEYS = ['ref_id', 'authors', 'actions', 'edit']

/**
 * Claves reordenables de un `fields`, en su orden actual: todo menos los campos de
 * sistema.
 */
export function movableKeys (fields) {
  return (fields || [])
    .filter(field => field && field.key && !SYSTEM_FIELD_KEYS.includes(field.key))
    .map(field => field.key)
}

/**
 * Del orden que el usuario tiene a la vista, lo que el servidor va a aceptar.
 *
 * `virtual` = repuesta por el cliente y ausente de la base (`camelotFields.js`): no
 * cuenta como guardada. `createdKeys` son las altas de este mismo guardado, que ya existen
 * en el servidor aunque la copia local de `fields` todavía no las tenga.
 *
 * @param {string[]} wantedKeys orden a la vista, con cada `_comments` junto a su dominio
 * @param {Object[]} storedFields `fields` del documento, tal como se leyó
 * @param {string[]} [createdKeys]
 * @returns {string[]}
 */
export function persistableOrder (wantedKeys, storedFields, createdKeys = []) {
  const stored = new Set([
    ...(storedFields || []).filter(field => field && field.key && !field.virtual).map(field => field.key),
    ...createdKeys
  ])
  return (wantedKeys || []).filter(key => stored.has(key) && !SYSTEM_FIELD_KEYS.includes(key))
}

/**
 * ¿El documento ya tiene estas claves en este orden relativo? Sirve para no mandar un
 * reorden que no cambia nada: el editor del estudio guarda por tecleo.
 *
 * Una clave que el documento no tiene hace que sea falso: el orden guardado no puede
 * incluir una columna que todavía no conoce.
 */
export function isStoredOrder (order, storedFields) {
  const wanted = new Set(order)
  const current = movableKeys(storedFields).filter(key => wanted.has(key))
  return current.length === order.length && current.every((key, index) => key === order[index])
}
