/**
 * Completar una tabla con los estudios que no tienen fila en el documento.
 *
 * Las tablas de los Pasos 3 y 4 y la de datos extraídos guardan una fila por referencia,
 * pero el documento y las referencias no se crean juntos: un finding creado sin
 * referencias, una referencia agregada después, o un documento que nació de un import
 * dejan estudios sin fila. La tabla tiene que mostrarlos igual.
 *
 * Hasta ahora eso se resolvía **escribiendo** las filas faltantes con un PATCH del
 * documento completo, que es la ruta que pisa la edición ajena y que el servidor va a
 * cerrar. Derivarlas al mostrar da el mismo resultado sin escribir nada: cuando la persona
 * escribe en una de esas filas, el endpoint por ítem la crea solo — es un upsert.
 *
 * La regla vive acá porque estaba escrita cuatro veces —`editList`, el worksheet, la
 * preview del proyecto y CAMELOT— y cada copia decidía distinto qué contar como faltante.
 */

/**
 * `items` más una fila por cada referencia que no aparezca en ellos.
 *
 * Las derivadas van al final, en el orden de `refIds`, y las construye `makeRow(refId)`
 * porque la forma de la fila depende de la tabla: la de datos extraídos lleva `column_0`,
 * la de assessments CAMELOT lleva el árbol de etapas.
 *
 * Los ítems huérfanos —de referencias que ya no están— se dejan pasar a propósito: el
 * servidor los quita al borrar la referencia, y filtrarlos acá esconderÍa un dato
 * inesperado en vez de mostrarlo.
 */
export function withDerivedRows (items, refIds, makeRow) {
  const existentes = items || []
  const referencias = refIds || []
  // Normalizado a string: los ids llegan como string de un lado y a veces con otro tipo del
  // otro, y comparar sin normalizar duplicaba la fila.
  const conFila = new Set(existentes.map(i => String(i && i.ref_id)))
  const derivadas = referencias
    .filter(refId => !conFila.has(String(refId)))
    .map(refId => makeRow(refId))
  return [...existentes, ...derivadas]
}
