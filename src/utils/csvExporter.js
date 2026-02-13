/**
 * Unified CSV export utility for iSoQ tables.
 *
 * Consolidates the CSV export logic previously duplicated across
 * crudTables.vue, Filters.vue, CharacteristicsOfStudiesTable.vue,
 * and tableImportExportMixin.js.
 */
const ExportCSV = require('export-to-csv').ExportToCsv

/**
 * Exports table data to a CSV file download.
 *
 * Headers use the translated field labels so the CSV reflects the user's
 * selected language. Custom fields keep their user-defined labels.
 * Items are keyed by those same labels because the export-to-csv library
 * uses header values as property keys to access row data.
 *
 * @param {Object} params
 * @param {Array<{key: string, label: string}>} params.fields - Column definitions
 * @param {Array<Object>} params.items - Row data objects
 * @param {string} [params.filename='exportable_table'] - Output filename
 * @param {Array<string>} [params.excludeKeys=['ref_id', 'id']] - Keys to exclude from export
 */
export function exportTableToCSV ({ fields, items, filename = 'exportable_table', excludeKeys = ['ref_id', 'id'] }) {
  const headers = []
  const keys = []

  for (const field of fields) {
    if (!excludeKeys.includes(field.key)) {
      // Wrap in double quotes to prevent commas in labels from splitting columns
      headers.push(`"${field.label}"`)
      keys.push(field.key)
    }
  }

  // Items must be keyed by header labels because export-to-csv uses
  // headers as property keys to access row data (this._data[i][header])
  const mappedItems = items.map(item => {
    const row = {}
    for (let i = 0; i < keys.length; i++) {
      const val = Object.prototype.hasOwnProperty.call(item, keys[i]) ? item[keys[i]] : ''
      row[headers[i]] = (val !== undefined && val !== null) ? val : ''
    }
    return row
  })

  const options = {
    filename,
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalSeparator: '.',
    showLabels: true,
    useBom: true,
    headers
  }

  const csvExporter = new ExportCSV(options)
  csvExporter.generateCsv(mappedItems)
}

export default { exportTableToCSV }
