import { parseTableRows, parseCSVData } from '@/utils/csvImporter'

describe('parseTableRows', () => {
  it('maps header row to fields and fieldsObj', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country'],
      ['1', 'Smith 2020', 'Chile']
    ]
    const result = parseTableRows(rows, 'Format error')

    expect(result.error).toBeNull()
    expect(result.fields).toEqual([
      { key: 'ref_id', label: 'Ref ID' },
      { key: 'authors', label: 'Author' },
      { key: 'column_0', label: 'Country' }
    ])
    expect(result.fieldsObj).toEqual([{ key: 'column_0', label: 'Country' }])
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' })
  })

  it('returns format error when fewer than 3 columns', () => {
    const rows = [['Ref ID', 'Author'], ['1', 'Smith 2020']]
    const result = parseTableRows(rows, 'Format error')
    expect(result.error).toBe('Format error')
    expect(result.items).toEqual([])
  })

  it('returns empty result for empty rows array', () => {
    const result = parseTableRows([], 'Format error')
    expect(result.error).toBeNull()
    expect(result.fields).toEqual([])
    expect(result.items).toEqual([])
  })

  it('handles multiple custom columns', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country', 'Year'],
      ['1', 'Smith 2020', 'Chile', '2020']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.fieldsObj).toEqual([
      { key: 'column_0', label: 'Country' },
      { key: 'column_1', label: 'Year' }
    ])
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile', column_1: '2020' })
  })

  it('handles multiple data rows', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country'],
      ['1', 'Smith 2020', 'Chile'],
      ['2', 'Jones 2021', 'Argentina']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.items).toHaveLength(2)
    expect(result.items[1].ref_id).toBe('2')
  })
})

describe('parseCSVData', () => {
  it('parses comma-separated CSV', () => {
    const csv = 'Ref ID,Author,Country\n1,Smith 2020,Chile'
    const result = parseCSVData(csv, 'Format error')
    expect(result.error).toBeNull()
    expect(result.items[0].column_0).toBe('Chile')
  })

  it('parses semicolon-separated CSV (European locale)', () => {
    const csv = 'Ref ID;Author;Country\n1;Smith 2020;Chile'
    const result = parseCSVData(csv, 'Format error')
    expect(result.error).toBeNull()
    expect(result.items[0].column_0).toBe('Chile')
  })

  it('returns format error when fewer than 3 columns', () => {
    const csv = 'Ref ID,Author\n1,Smith 2020'
    const result = parseCSVData(csv, 'Format error')
    expect(result.error).toBe('Format error')
  })
})

// #163: filas y columnas completamente vacías (p. ej. pegadas desde la tabla original a la
// plantilla) no se importan. Las columnas se filtran con UNA lista de índices para todas las
// filas: una celda vacía en medio de una fila nunca corre los datos a la columna de al lado.
describe('parseTableRows — blank rows and columns (#163)', () => {
  it('drops rows whose cells are all empty or whitespace', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country'],
      ['1', 'Smith 2020', 'Chile'],
      ['', '', ''],
      ['  ', '', ' '],
      ['2', 'Jones 2021', 'Peru']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.items).toEqual([
      { ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' },
      { ref_id: '2', authors: 'Jones 2021', column_0: 'Peru' }
    ])
  })

  it('drops a column with no header and no data, without shifting the others', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country', '', 'Setting'],
      ['1', 'Smith 2020', '', '', 'Rural'],
      ['2', 'Jones 2021', 'Peru', '', '']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.fieldsObj).toEqual([
      { key: 'column_0', label: 'Country' },
      { key: 'column_1', label: 'Setting' }
    ])
    expect(result.fields.map(f => f.label)).toEqual(['Ref ID', 'Author', 'Country', 'Setting'])
    expect(result.items).toEqual([
      { ref_id: '1', authors: 'Smith 2020', column_0: '', column_1: 'Rural' },
      { ref_id: '2', authors: 'Jones 2021', column_0: 'Peru', column_1: '' }
    ])
  })

  it('keeps a column with a header even if no row has data', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country', 'To fill later'],
      ['1', 'Smith 2020', 'Chile', '']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.fieldsObj.map(f => f.label)).toEqual(['Country', 'To fill later'])
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile', column_1: '' })
  })

  it('keeps a column without header when some row has data', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country', ''],
      ['1', 'Smith 2020', 'Chile', 'note']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile', column_1: 'note' })
  })

  it('never drops the Ref ID and Author columns', () => {
    const rows = [
      ['', '', 'Country'],
      ['', '', 'Chile']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(result.items).toEqual([{ ref_id: '', authors: '', column_0: 'Chile' }])
  })

  it('handles ragged rows (shorter than the header)', () => {
    const rows = [
      ['Ref ID', 'Author', 'Country', '', 'Setting'],
      ['1', 'Smith 2020', 'Chile']
    ]
    const result = parseTableRows(rows, 'Format error')
    expect(result.fieldsObj.map(f => f.label)).toEqual(['Country', 'Setting'])
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' })
  })
})

describe('parseCSVData — blank rows from Excel (#163)', () => {
  it('drops rows made only of separators', () => {
    const result = parseCSVData('Ref ID,Author,Country\n1,Smith 2020,Chile\n,,\n', 'Format error')
    expect(result.items).toEqual([{ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' }])
  })
})
