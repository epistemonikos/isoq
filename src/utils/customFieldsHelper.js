/**
 * Helper con utilidades para trabajar con campos personalizados en ISOQF
 */

/**
 * Comprueba si un campo es personalizado (si comienza con "column_")
 * @param {string} fieldKey - La clave del campo a comprobar
 * @returns {boolean} - True si es un campo personalizado, false en caso contrario
 */
export function isCustomField(fieldKey) {
  return typeof fieldKey === 'string' && fieldKey.startsWith('column_')
}

/**
 * Extrae los campos personalizados de un conjunto de campos
 * @param {Array} fields - Array de objetos con key y label
 * @returns {Array} - Array de objetos con los campos personalizados
 */
export function extractCustomFields(fields) {
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
 * Procesa los campos personalizados para tener una estructura uniforme
 * @param {Array} customFields - Array de objetos con los campos personalizados
 * @returns {Array} - Array de objetos con key y label
 */
export function processCustomFields(customFields) {
  if (!customFields || !Array.isArray(customFields)) {
    return []
  }

  return customFields
    .filter(field => field.title && field.title.trim() !== '')
    .map((field, index) => ({
      key: `column_${index}`,
      label: field.title
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
export function cleanOrphanedCustomFieldKeys(items, fields) {
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
  extractCustomFields,
  processCustomFields,
  cleanOrphanedCustomFieldKeys
}
