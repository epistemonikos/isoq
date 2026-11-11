import * as XLSX from 'xlsx'
import { parseTableRows } from '@/utils/csvImporter'

export async function parseXLSXData (file, formatErrorMessage) {
  try {
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
    const rows = rawRows.map(row =>
      row.map(cell => (cell === null || cell === undefined) ? '' : String(cell))
    )
    return parseTableRows(rows, formatErrorMessage)
  } catch (e) {
    return { fields: [], items: [], fieldsObj: [], error: formatErrorMessage }
  }
}
