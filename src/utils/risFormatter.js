/**
 * RIS (Research Information Systems) Format Utility
 * 
 * Converts reference objects to RIS format for export to reference managers.
 * RIS format specification: https://en.wikipedia.org/wiki/RIS_(file_format)
 */

/**
 * Format a single RIS field
 * @param {string} tag - RIS tag (e.g., 'TI', 'AU', 'PY')
 * @param {string|number} value - Field value
 * @returns {string} Formatted RIS field or empty string if value is empty
 */
export function formatField(tag, value) {
  if (value === null || value === undefined || value === '') {
    return ''
  }
  return `${tag}  - ${value}\r\n`
}

/**
 * Format a single reference to RIS format
 * @param {Object} reference - Reference object
 * @returns {string} RIS formatted string
 */
export function formatReference(reference) {
  if (!reference || typeof reference !== 'object') {
    return 'ER  - \r\n'
  }

  let ris = ''

  // Type (required field)
  if (reference.type) {
    ris += formatField('TY', reference.type)
  }

  // Abstract
  if (reference.abstract) {
    ris += formatField('AB', reference.abstract)
  }

  // Title
  if (reference.title) {
    ris += formatField('TI', reference.title)
  }

  // Authors (A1, A2, A3, ...)
  if (reference.authors && Array.isArray(reference.authors) && reference.authors.length > 0) {
    reference.authors.forEach((author, index) => {
      ris += formatField(`A${index + 1}`, author)
    })
  }

  // Publication Year
  if (reference.publication_year) {
    ris += formatField('PY', reference.publication_year)
  }

  // Database
  if (reference.database) {
    ris += formatField('DB', reference.database)
  }

  // Volume Number
  if (reference.volume_number) {
    ris += formatField('VL', reference.volume_number)
  }

  // URL
  if (reference.url) {
    ris += formatField('UR', reference.url)
  }

  // Start Page
  if (reference.start_page) {
    ris += formatField('SP', reference.start_page)
  }

  // ISBN/ISSN
  if (reference.isbn_issn) {
    ris += formatField('SN', reference.isbn_issn)
  }

  // Date
  if (reference.date) {
    ris += formatField('DA', reference.date)
  }

  // User Definable Fields (C1, C2, C3, ...)
  if (reference.user_definable && Array.isArray(reference.user_definable) && reference.user_definable.length > 0) {
    reference.user_definable.forEach((field, index) => {
      ris += formatField(`C${index + 1}`, field)
    })
  }

  // End of Reference (required)
  ris += 'ER  - \r\n'

  return ris
}

/**
 * Format multiple references to RIS format
 * @param {Array} references - Array of reference objects
 * @returns {string} RIS formatted string for all references
 */
export function formatReferences(references) {
  if (!references || !Array.isArray(references) || references.length === 0) {
    return ''
  }

  return references.map(ref => formatReference(ref)).join('')
}
