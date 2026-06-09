import writeXlsxFile from 'write-excel-file'
import { exportTableToXLSX } from '@/utils/xlsxExporter'

jest.mock('write-excel-file', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}))

describe('exportTableToXLSX', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    writeXlsxFile.mockResolvedValue(undefined)
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

  it('passes headers as bold first row', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = writeXlsxFile.mock.calls[0][0]
    const header = rows[0]
    expect(header).toEqual([
      { value: 'Author(s), Year', fontWeight: 'bold' },
      { value: 'Country', fontWeight: 'bold' },
      { value: 'Year', fontWeight: 'bold' }
    ])
  })

  it('excludes ref_id and id by default', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = writeXlsxFile.mock.calls[0][0]
    const header = rows[0]
    const labels = header.map(c => c.value)
    expect(labels).not.toContain('Reference ID')
  })

  it('maps item values to corresponding rows', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const rows = writeXlsxFile.mock.calls[0][0]
    expect(rows[1]).toEqual([
      { value: 'Smith 2020' },
      { value: 'Chile' },
      { value: '2020' }
    ])
    expect(rows[2]).toEqual([
      { value: 'Jones 2021' },
      { value: 'Argentina' },
      { value: '2021' }
    ])
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

    const rows = writeXlsxFile.mock.calls[0][0]
    const labels = rows[0].map(c => c.value)
    expect(labels).not.toContain('Actions')
  })

  it('uses filename with .xlsx extension', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems, filename: 'my_export' })

    const opts = writeXlsxFile.mock.calls[0][1]
    expect(opts.fileName).toBe('my_export.xlsx')
  })

  it('defaults filename to exportable_table.xlsx', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: sampleItems })

    const opts = writeXlsxFile.mock.calls[0][1]
    expect(opts.fileName).toBe('exportable_table.xlsx')
  })

  it('converts undefined and null values to empty string', async () => {
    const itemsWithMissing = [
      { ref_id: '1', authors: 'Smith 2020', column_0: undefined, column_1: null }
    ]
    await exportTableToXLSX({ fields: sampleFields, items: itemsWithMissing })

    const rows = writeXlsxFile.mock.calls[0][0]
    expect(rows[1]).toEqual([
      { value: 'Smith 2020' },
      { value: '' },
      { value: '' }
    ])
  })

  it('handles empty items array', async () => {
    await exportTableToXLSX({ fields: sampleFields, items: [] })

    const rows = writeXlsxFile.mock.calls[0][0]
    expect(rows).toHaveLength(1)
  })

  it('handles empty fields array', async () => {
    await exportTableToXLSX({ fields: [], items: sampleItems })

    const rows = writeXlsxFile.mock.calls[0][0]
    expect(rows[0]).toEqual([])
  })
})
