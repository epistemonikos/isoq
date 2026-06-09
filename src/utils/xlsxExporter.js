import writeXlsxFile from 'write-excel-file'

export async function exportTableToXLSX ({ fields, items, filename = 'exportable_table', excludeKeys = ['ref_id', 'id'] }) {
  const visibleFields = fields.filter(f => !excludeKeys.includes(f.key))

  const headerRow = visibleFields.map(f => ({ value: f.label, fontWeight: 'bold' }))

  const dataRows = items.map(item =>
    visibleFields.map(f => {
      const val = item[f.key]
      return { value: (val !== undefined && val !== null) ? String(val) : '' }
    })
  )

  await writeXlsxFile([headerRow, ...dataRows], {
    fileName: `${filename}.xlsx`
  })
}

export default { exportTableToXLSX }
