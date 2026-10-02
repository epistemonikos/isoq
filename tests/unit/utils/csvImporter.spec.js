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
