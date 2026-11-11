/**
 * Helper con utilidades para trabajar con campos personalizados en ISOQF
 */

/**
 * Comprueba si un campo es personalizado (si comienza con "column_")
 * @param {string} fieldKey - La clave del campo a comprobar
 * @returns {boolean} - True si es un campo personalizado, false en caso contrario
 */
export function isCustomField (fieldKey) {
  return typeof fieldKey === 'string' && fieldKey.startsWith('column_')
}

/**
 * Genera la clave de una columna nueva: `column_` + 24 hex aleatorios.
 *
 * La clave la elige el cliente para que el alta pueda ser un `PATCH` idempotente —así se
 * puede encolar sin conexión, se conoce antes de la respuesta y reproducirla dos veces no
 * crea dos columnas—. El backend lo soporta con una condición: aleatoria de ≥ 12 bytes,
 * nada derivado del contenido ni de un contador. El `column_${max(N)+1}` que se usaba
 * antes colisionaba justamente por eso: dos personas agregando a la vez leían el mismo
 * máximo y una pisaba a la otra.
 *
 * @returns {string} - Clave nueva, dentro de la whitelist `^column_[A-Za-z0-9_-]{1,64}$`
 */
export function newCustomFieldKey () {
  const bytes = new Uint8Array(12)
  const source = (typeof window !== 'undefined' && window.crypto) || global.crypto
  source.getRandomValues(bytes)
  return 'column_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Extrae los campos personalizados de un conjunto de campos
 * @param {Array} fields - Array de objetos con key y label
 * @returns {Array} - Array de objetos con los campos personalizados
 */
export function extractCustomFields (fields) {
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    return []
  }

  return fields
    .filter(field => field && field.key && isCustomField(field.key))
    .map(field => ({
      key: field.key,
      label: field.label || field.key
    }))
}

/**
 * Limpia las llaves huérfanas de campos personalizados de los items.
 * Cuando un campo personalizado se elimina del arreglo fields, las llaves
 * correspondientes (column_X) deben eliminarse también de cada item.
 * @param {Array} items - Array de objetos item (cada uno con ref_id, authors, column_X, etc.)
 * @param {Array} fields - Array de objetos field vigentes (con key y label)
 * @returns {Array} - Array de items limpio, sin llaves huérfanas
 */
export function cleanOrphanedCustomFieldKeys (items, fields) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return items || []
  }

  // Obtener las llaves de campos personalizados vigentes
  const validCustomKeys = new Set(
    (fields || [])
      .filter(field => field && field.key && isCustomField(field.key))
      .map(field => field.key)
  )

  return items.map(item => {
    const cleanedItem = {}
    Object.keys(item).forEach(key => {
      // Si la llave es un campo personalizado, solo la mantenemos si está en los fields vigentes
      if (isCustomField(key)) {
        if (validCustomKeys.has(key)) {
          cleanedItem[key] = item[key]
        }
        // Si no está en validCustomKeys, la descartamos (huérfana)
      } else {
        // Las llaves no-custom (ref_id, authors, etc.) se mantienen siempre
        cleanedItem[key] = item[key]
      }
    })
    return cleanedItem
  })
}

export default {
  isCustomField,
  newCustomFieldKey,
  extractCustomFields,
  cleanOrphanedCustomFieldKeys
}
