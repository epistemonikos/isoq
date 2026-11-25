// Columnas de sistema de las tablas de los Pasos 3/4: no son datos que haya cargado nadie.
const SYSTEM_KEYS = new Set(['ref_id', 'authors', 'actions'])

/**
 * ¿La tabla tiene al menos una columna creada por la persona? (#420)
 *
 * Sin documento en los Pasos 3/4 las filas igual existen (se derivan de las referencias, con
 * la forma `{ ref_id, authors }`), y un `<b-table>` con `fields` vacío o ausente inventa las
 * columnas desde esas claves: mostraba «Ref Id». Sin columnas propias no se dibuja la tabla;
 * el aviso de «falta información» ya lo dice.
 *
 * @param {Array} fields `fieldsObj` o `fields` de la tabla; cualquier otro valor = sin columnas.
 */
export function hasDataColumns (fields) {
  return Array.isArray(fields) && fields.some(f => f && !SYSTEM_KEYS.has(f.key))
}
