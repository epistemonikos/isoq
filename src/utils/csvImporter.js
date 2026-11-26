import Papa from 'papaparse'

export function parseTableRows (rows, formatErrorMessage) {
  let fields = []
  let items = []
  let fieldsObj = []
  let error = null

  if (!rows.length) return { fields, items, fieldsObj, error }

  if (rows[0].length < 3) {
    return { fields, items, fieldsObj, error: formatErrorMessage }
  }

  // #163: filas y columnas completamente vacías no se importan. Las columnas a conservar se
  // deciden UNA vez y se aplican igual al encabezado y a cada fila, para que una celda vacía en
  // medio de una fila no corra los datos. Ref ID y autor (0 y 1) nunca se descartan; una
  // columna se descarta sólo si no tiene ni título ni ningún dato.
  const isBlank = cell => cell === undefined || cell === null || String(cell).trim() === ''
  const header = rows[0]
  const dataRows = rows.slice(1).filter(row => !row.every(isBlank))
  const width = Math.max(header.length, ...dataRows.map(row => row.length))
  const kept = []
  for (let i = 0; i < width; i++) {
    if (i < 2 || !isBlank(header[i]) || dataRows.some(row => !isBlank(row[i]))) kept.push(i)
  }

  const keyFor = {}
  let cntI = 0
  for (const i of kept) {
    let key
    if (i === 0) key = 'ref_id'
    else if (i === 1) key = 'authors'
    else {
      key = 'column_' + cntI++
      if (i < header.length) fieldsObj.push({ 'key': key, 'label': header[i] })
    }
    keyFor[i] = key
    if (i < header.length) fields.push({ key, label: header[i] })
  }

  for (const row of dataRows) {
    const obj = {}
    for (const i of kept) {
      if (i < row.length) obj[keyFor[i]] = row[i]
    }
    items.push(obj)
  }

  return { fields, items, fieldsObj, error }
}

export function parseCSVData (data, formatErrorMessage) {
  const csvData = Papa.parse(data, { skipEmptyLines: true })
  return parseTableRows(csvData.data, formatErrorMessage)
}
