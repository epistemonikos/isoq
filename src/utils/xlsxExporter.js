import * as XLSX from 'xlsx'

export async function exportAOAToXLSX (rows, filename) {
  const ws = XLSX.utils.aoa_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export async function exportTableToXLSX ({ fields, items, filename = 'exportable_table', excludeKeys = ['ref_id', 'id'] }) {
  const visibleFields = fields.filter(f => !excludeKeys.includes(f.key))

  const headerRow = visibleFields.map(f => f.label)
  const dataRows = items.map(item =>
    visibleFields.map(f => {
      const val = item[f.key]
      return (val !== undefined && val !== null) ? String(val) : ''
    })
  )

  const ws = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

export default { exportTableToXLSX }
