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

export default {
  isCustomField,
  extractCustomFields,
  processCustomFields
}
