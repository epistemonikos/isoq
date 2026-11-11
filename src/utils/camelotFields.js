/**
 * Reconciliación del `fields` de una tabla CAMELOT contra el catálogo de dominios.
 *
 * Las 24 claves CAMELOT (12 dominios × `_extractedData` + `_comments`) son fijas: el modal
 * de columnas las marca `locked`, así que no se crean, no se borran y no se renombran. Pero
 * tienen que EXISTIR en `fields`, por dos razones independientes:
 *
 *   1. La tabla del Paso 3 deriva sus columnas exclusivamente de `charsData.fields`
 *      (`availableTableFields`). Una clave que no esté ahí no se dibuja.
 *   2. El orden que el usuario elige se persiste con `PUT /fields/order`, y el backend
 *      rechaza un `order` que mencione una clave que no esté en `fields`.
 *
 * El documento nace sin ellas —`ensureTableDocument` siembra sólo `ref_id` y `authors`— y
 * la carga sólo inyectaba el catálogo cuando `fields` venía VACÍO, condición que deja de
 * cumplirse para siempre en cuanto nace el documento. De ahí que crear la primera columna
 * hiciera desaparecer las 12 columnas CAMELOT.
 *
 * La regla vive acá y no en cada punto de asignación: `charsData` entra desde el servidor
 * por cuatro puertas distintas en `StepThree`, y una regla duplicada tres veces es una
 * regla que en algún momento va a divergir.
 *
 * @param {Array} fields  `fields` tal como vino del servidor.
 * @param {Array} catalog `camelot.fields` del mixin; vacío en proyectos no-CAMELOT.
 * @returns {Array} Copia con las claves del catálogo que faltaban, agregadas al final.
 */
export function withCamelotFields (fields, catalog) {
  const catalogo = Array.isArray(catalog) ? catalog : []
  const actuales = Array.isArray(fields) ? fields : []

  if (!catalogo.length) return actuales

  // Lo que ya está se deja intacto: su posición es el orden que el usuario eligió y su
  // `label` es el que el servidor considera vigente. Reconciliar agrega, nunca reordena
  // ni reetiqueta.
  const presentes = new Set(actuales.map(field => field && field.key))
  // `virtual` marca lo que existe sólo acá: el documento no lo tiene guardado, así que no
  // puede viajar en `order` —el backend devuelve 400 por clave desconocida— ni contarse
  // como columna que el servidor conozca. Se dibuja igual: la marca es para quien escribe,
  // no para quien pinta.
  const faltantes = catalogo
    .filter(field => field && !presentes.has(field.key))
    .map(field => ({ ...field, virtual: true }))

  return faltantes.length ? [...actuales, ...faltantes] : actuales
}

/**
 * Quita la marca `virtual` antes de mandar `fields` al servidor.
 *
 * La marca dice "esto lo repuso el cliente", y persistirla invierte su significado: al
 * releer el documento, una columna guardada aparecería como no guardada y quedaría fuera
 * de todo `order` — sin error y sin rastro. Sólo la necesita el camino que todavía manda
 * `fields` completo (la creación del documento desde el editor de estudios).
 */
export function withoutVirtualMark (fields) {
  return (Array.isArray(fields) ? fields : []).map(field => {
    if (!field || !field.virtual) return field
    const { virtual, ...resto } = field
    return resto
  })
}

export default { withCamelotFields, withoutVirtualMark }
