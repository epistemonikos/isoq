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

  for (let cnt in rows) {
    if (parseInt(cnt) === 0) {
      let cntI = 0
      for (let i in rows[cnt]) {
        let obj = {}
        if (parseInt(i) === 0) {
          obj.key = 'ref_id'
        }
        if (parseInt(i) === 1) {
          obj.key = 'authors'
        }
        if (parseInt(i) > 1) {
          fieldsObj.push({ 'key': 'column_' + cntI, 'label': rows[cnt][i] })
          obj.key = 'column_' + cntI
          cntI++
        }
        obj.label = rows[cnt][i]
        fields.push(obj)
      }
    } else {
      let cntI = 0
      let obj = {}
      for (let i in rows[cnt]) {
        if (parseInt(i) === 0) {
          obj.ref_id = rows[cnt][i]
        }
        if (parseInt(i) === 1) {
          obj.authors = rows[cnt][i]
        }
        if (parseInt(i) > 1) {
          obj[`column_${cntI}`] = rows[cnt][i]
          cntI++
        }
      }
      items.push(obj)
    }
  }

  return { fields, items, fieldsObj, error }
}

export function parseCSVData (data, formatErrorMessage) {
  const csvData = Papa.parse(data, { skipEmptyLines: true })
  return parseTableRows(csvData.data, formatErrorMessage)
}
