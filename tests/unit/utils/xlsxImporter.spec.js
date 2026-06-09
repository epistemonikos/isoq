import readXlsxFile from 'read-excel-file'
import { parseXLSXData } from '@/utils/xlsxImporter'

jest.mock('read-excel-file', () => ({
  __esModule: true,
  default: jest.fn()
}))

describe('parseXLSXData', () => {
  beforeEach(() => jest.clearAllMocks())

  it('parses header and data rows correctly', async () => {
    readXlsxFile.mockResolvedValue([
      ['Ref ID', 'Author', 'Country'],
      ['1', 'Smith 2020', 'Chile'],
      ['2', 'Jones 2021', 'Argentina']
    ])
    const result = await parseXLSXData(new File([''], 'test.xlsx'), 'Format error')
    expect(result.error).toBeNull()
    expect(result.fields).toHaveLength(3)
    expect(result.fieldsObj).toEqual([{ key: 'column_0', label: 'Country' }])
    expect(result.items).toHaveLength(2)
    expect(result.items[0]).toEqual({ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' })
  })

  it('converts numeric cell values to strings', async () => {
    readXlsxFile.mockResolvedValue([
      ['Ref ID', 'Author', 'Year'],
      [1, 'Smith 2020', 2020]
    ])
    const result = await parseXLSXData(new File([''], 'test.xlsx'), 'Format error')
    expect(result.items[0].ref_id).toBe('1')
    expect(result.items[0].column_0).toBe('2020')
  })

  it('converts null cells to empty string', async () => {
    readXlsxFile.mockResolvedValue([
      ['Ref ID', 'Author', 'Country'],
      ['1', 'Smith 2020', null]
    ])
    const result = await parseXLSXData(new File([''], 'test.xlsx'), 'Format error')
    expect(result.items[0].column_0).toBe('')
  })

  it('returns format error when fewer than 3 columns', async () => {
    readXlsxFile.mockResolvedValue([
      ['Ref ID', 'Author'],
      ['1', 'Smith 2020']
    ])
    const result = await parseXLSXData(new File([''], 'test.xlsx'), 'Format error')
    expect(result.error).toBe('Format error')
    expect(result.items).toEqual([])
  })

  it('returns format error when read-excel-file throws', async () => {
    readXlsxFile.mockRejectedValue(new Error('Not a valid xlsx'))
    const result = await parseXLSXData(new File([''], 'bad.xlsx'), 'Format error')
    expect(result.error).toBe('Format error')
    expect(result.fields).toEqual([])
    expect(result.items).toEqual([])
  })

  it('handles Date cell values by converting to string', async () => {
    const d = new Date('2020-01-01')
    readXlsxFile.mockResolvedValue([
      ['Ref ID', 'Author', 'Date'],
      ['1', 'Smith', d]
    ])
    const result = await parseXLSXData(new File([''], 'test.xlsx'), 'Format error')
    expect(typeof result.items[0].column_0).toBe('string')
    expect(result.items[0].column_0).not.toBe('')
  })
})
