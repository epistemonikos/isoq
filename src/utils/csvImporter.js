import Papa from 'papaparse'

export function parseCSVData (data, formatErrorMessage) {
  let fields = []
  let items = []
  let fieldsObj = []
  let error = null

  const csvData = Papa.parse(data, { skipEmptyLines: true })

  if (csvData.data.length) {
    if (csvData.data[0].length < 3) {
      error = formatErrorMessage
    } else {
      for (let cnt in csvData.data) {
        if (parseInt(cnt) === 0) {
          let cntI = 0
          for (let i in csvData.data[cnt]) {
            let obj = {}
            if (parseInt(i) === 0) {
              obj.key = 'ref_id'
            }
            if (parseInt(i) === 1) {
              obj.key = 'authors'
            }
            if (parseInt(i) > 1) {
              fieldsObj.push({ 'key': 'column_' + cntI, 'label': csvData.data[cnt][i] })
              obj.key = 'column_' + cntI
              cntI++
            }
            obj.label = csvData.data[cnt][i]
            fields.push(obj)
          }
        } else {
          let cntI = 0
          let obj = {}
          for (let i in csvData.data[cnt]) {
            if (parseInt(i) === 0) {
              obj.ref_id = csvData.data[cnt][i]
            }
            if (parseInt(i) === 1) {
              obj.authors = csvData.data[cnt][i]
            }
            if (parseInt(i) > 1) {
              obj[`column_${cntI}`] = csvData.data[cnt][i]
              cntI++
            }
          }
          items.push(obj)
        }
      }
    }
  }

  return { fields, items, fieldsObj, error }
}
