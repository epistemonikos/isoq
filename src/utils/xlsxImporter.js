import readXlsxFile from 'read-excel-file'
import { parseTableRows } from '@/utils/csvImporter'

export async function parseXLSXData (file, formatErrorMessage) {
  try {
    const rawRows = await readXlsxFile(file)
    const rows = rawRows.map(row =>
      row.map(cell => (cell === null || cell === undefined) ? '' : String(cell))
    )
    return parseTableRows(rows, formatErrorMessage)
  } catch (e) {
    return { fields: [], items: [], fieldsObj: [], error: formatErrorMessage }
  }
}
