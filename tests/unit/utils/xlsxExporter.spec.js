import * as XLSX from 'xlsx'
import { exportTableToXLSX, exportAOAToXLSX } from '@/utils/xlsxExporter'

jest.mock('xlsx', () => ({
  utils: {
    aoa_to_sheet: jest.fn().mockReturnValue({}),
    book_new: jest.fn().mockReturnValue({ SheetNames: [], Sheets: {} }),
    book_append_sheet: jest.fn()
  },
  writeFile: jest.fn()
}))

describe('exportTableToXLSX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const sampleFields = [
    { key: 'ref_id', label: 'Reference ID' },
    { key: 'authors', label: 'Author(s), Year' },
    { key: 'column_0', label: 'Country' },
    { key: 'column_1', label: 'Year' }
  ]

  const sampleItems = [
    { ref_id: '1', authors: 'Smith 2020', column_0: 'Chile', column_1: '2020' },
    { ref_id: '2', authors: 'Jones 2021', column_0: 'Argentina', column_1: '2021' }
  ]

  it('passes visible field labels as first row', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[0]).toEqual(['Author(s), Year', 'Country', 'Year'])
  })

  it('excludes ref_id and id by default', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[0]).not.toContain('Reference ID')
  })

  it('maps item values to corresponding rows', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[1]).toEqual(['Smith 2020', 'Chile', '2020'])
    expect(rows[2]).toEqual(['Jones 2021', 'Argentina', '2021'])
  })

  it('excludes custom keys via excludeKeys param', async () => {
    const fieldsWithActions = [
      ...sampleFields,
      { key: 'actions', label: 'Actions' }
    ]
    await exportTableToXLSX({
      fields: fieldsWithActions,
      items: sampleItems,
      excludeKeys: ['ref_id', 'id', 'actions', 'edit']
    })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[0]).not.toContain('Actions')
  })

  it('calls writeFile with given filename and .xlsx extension', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems, filename: 'my_export' })

    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'my_export.xlsx')
  })

  it('defaults filename to exportable_table.xlsx', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'exportable_table.xlsx')
  })

  it('converts undefined and null values to empty string', async () => {
    const itemsWithMissing = [
      { ref_id: '1', authors: 'Smith 2020', column_0: undefined, column_1: null }
    ]
    await exportTableToXLSX({ fields: sampleFields, items: itemsWithMissing })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[1]).toEqual(['Smith 2020', '', ''])
  })

  it('handles empty items array', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: [] })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows).toHaveLength(1)
  })

  it('handles empty fields array', async () => {
    await exportTableToXLSX({ fields: [], items: sampleItems })

    const rows = XLSX.utils.aoa_to_sheet.mock.calls[0][0]
    expect(rows[0]).toEqual([])
  })
})

describe('exportAOAToXLSX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('writes aoa rows to file with given filename and .xlsx extension', async () => {
    const rows = [['Col A', 'Col B'], ['val1', 'val2']]
    await exportAOAToXLSX(rows, 'my_template')

    expect(XLSX.utils.aoa_to_sheet).toHaveBeenCalledWith(rows)
    expect(XLSX.writeFile).toHaveBeenCalledWith(expect.anything(), 'my_template.xlsx')
  })
})
