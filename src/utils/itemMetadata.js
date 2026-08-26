/**
 * Las claves que el servidor guarda DENTRO de una fila de las tablas de los Pasos 3 y 4
 * y que no son datos del usuario.
 *
 * Hoy hay una sola: el contador de versión optimista `_v`. Vive acá y no en cada sitio
 * porque tiene que hacer dos trabajos opuestos en cinco lugares, y ya hubo un antecedente
 * de esa regla duplicándose y divergiendo:
 *
 * - **preservarse** cuando reconstruimos la fila para escribirla (si la perdemos, el
 *   servidor acepta el PATCH por compatibilidad pero deja de comprobar la frescura, y no
 *   nos enteramos);
 * - **excluirse** cuando decidimos si la fila está vacía (es un número, así que sin esto
 *   toda fila vacía parece tener contenido y los avisos de datos incompletos callan).
 *
 * Se nombra el campo en vez de adivinar una convención de prefijo: el servidor también lo
 * trata por nombre —filtra `VERSION_FIELD` del body antes de escribir— y sus otras dos
 * claves de metadata, `ref_id` y `authors`, no llevan guion bajo. Cuando aparezca la
 * segunda, se agrega a esta lista y los cinco sitios la heredan.
 */

export const VERSION_FIELD = '_v'

export const ITEM_METADATA_KEYS = [VERSION_FIELD]

const METADATA_SET = new Set(ITEM_METADATA_KEYS)

/**
 * True si el valor es una versión que el servidor va a aceptar: entero, no negativo, y
 * no un booleano (que en JS pasaría por número igual que en Python pasa por `int`).
 */
function isValidVersion (value) {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * Copia a `target` las claves de metadata que `source` trae **con un valor utilizable**,
 * y devuelve `target` para poder encadenarlo dentro de un `map`.
 *
 * Se omite tanto la clave ausente como la corrupta, y las dos por la misma razón: el
 * servidor rechaza con `400 invalid_version` un `_v` que no sea entero, a propósito —
 * ignorarlo saltaría la comprobación de frescura en silencio. Reenviar un valor corrupto
 * (un documento viejo, un roundtrip por XLSX que lo devuelve como texto) convertiría esa
 * defensa en un guardado que no se puede completar nunca. Sin la clave, en cambio, la
 * escritura pasa por el camino tolerado: se escribe y queda un warning del lado del
 * servidor. Perder una comprobación es peor que perder el guardado, pero recuperable.
 */
export function copyItemMetadata (target, source) {
  if (!target || !source) return target
  for (const key of ITEM_METADATA_KEYS) {
    if (isValidVersion(source[key])) target[key] = source[key]
  }
  return target
}

/** True cuando la clave es metadata del servidor y no un campo que el usuario escribió. */
export function isItemMetadata (key) {
  return METADATA_SET.has(key)
}

/**
 * Las mismas filas sin la metadata del servidor.
 *
 * Para escribir por una ruta que NO comprueba la versión: la genérica de documento
 * completo persiste los ítems tal como llegan, así que mandarle el contador que teníamos
 * en memoria lo haría retroceder en todas las filas a la vez, y quien estuviera editando
 * con la versión siguiente chocaría 409 en cada tecleo sin más salida que recargar. El
 * contador sólo tiene sentido donde se comprueba: en los PATCH por fila.
 */
export function withoutItemMetadata (items) {
  return (items || []).map(item => {
    if (!item || typeof item !== 'object') return item
    const stripped = {}
    Object.keys(item).forEach(key => {
      if (!isItemMetadata(key)) stripped[key] = item[key]
    })
    return stripped
  })
}

/**
 * Huella de una lista de filas para responder «¿cambiaron los datos?».
 *
 * Ordena las claves y descarta la metadata, porque ninguna de las dos cosas es un cambio:
 * el orden en que Mongo devuelve las claves de un ítem no está garantizado, y el contador
 * de versión se mueve solo cada vez que alguien guarda. Un `JSON.stringify` directo
 * responde que sí a las dos, y quien pregunta esto lo hace para decidir si escribe.
 */
export function itemsFingerprint (items) {
  return JSON.stringify((items || []).map(item => {
    if (!item || typeof item !== 'object') return item
    return Object.keys(item)
      .filter(key => !isItemMetadata(key))
      .sort()
      .map(key => [key, item[key]])
  }))
}
