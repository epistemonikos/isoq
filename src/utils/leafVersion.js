/**
 * El contador de versión de una celda del Paso 4 (`stages[k].options[i]._v`).
 *
 * El endpoint D lo compara al guardar: si otra persona escribió esa misma celda desde que
 * se leyó, responde 409 `version_conflict` en vez de pisarla. Es el contador de la CELDA y
 * no el de la fila a propósito — dos personas en dos celdas del mismo estudio no se
 * invalidan entre sí, que es la edición en paralelo para la que existe el endpoint D.
 *
 * Contrato del servidor: una celda sin contador está en la versión 0, y lo que no se puede
 * incrementar también cuenta como 0. El cliente manda siempre un entero.
 */
export const VERSION_FIELD = '_v'

export function leafVersionOf (leaf) {
  const value = leaf ? leaf[VERSION_FIELD] : undefined
  return Number.isInteger(value) && value >= 0 ? value : 0
}

/**
 * La celda de un documento de `isoqf_assessments` tal como lo devuelve el servidor, o null.
 *
 * Por `ref_id` y por la `key` de la etapa, no por posición: es como direcciona el
 * servidor, y hay documentos legados con la key guardada como string.
 */
export function leafInDocument (doc, refId, stageKey, optionIndex) {
  const items = doc && Array.isArray(doc.items) ? doc.items : []
  const item = items.find(it => it && it.ref_id === refId)
  const stages = item && Array.isArray(item.stages) ? item.stages : []
  const stage = stages.find(st => st && Number(st.key) === Number(stageKey))
  const options = stage && Array.isArray(stage.options) ? stage.options : []
  return options[optionIndex] || null
}
