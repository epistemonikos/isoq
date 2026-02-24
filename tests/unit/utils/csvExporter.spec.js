import { exportTableToCSV } from '@/utils/csvExporter'

// Mock export-to-csv module
jest.mock('export-to-csv', () => ({
  ExportToCsv: jest.fn().mockImplementation(() => ({
    generateCsv: jest.fn()
  }))
}))

const { ExportToCsv } = require('export-to-csv')

describe('csvExporter', () => {
  let mockGenerateCsv

  beforeEach(() => {
    jest.clearAllMocks()
    mockGenerateCsv = jest.fn()
    ExportToCsv.mockImplementation(() => ({
      generateCsv: mockGenerateCsv
    }))
  })

  describe('exportTableToCSV', () => {
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

    it('uses translated labels wrapped in double quotes as headers', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual(['"Author(s), Year"', '"Country"', '"Year"'])
    })

    it('keys items by quoted header labels for library compatibility', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems })

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems).toEqual([
        { '"Author(s), Year"': 'Smith 2020', '"Country"': 'Chile', '"Year"': '2020' },
        { '"Author(s), Year"': 'Jones 2021', '"Country"': 'Argentina', '"Year"': '2021' }
      ])
    })

    it('excludes ref_id by default', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).not.toContain('"Reference ID"')
    })

    it('uses default filename "exportable_table"', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.filename).toBe('exportable_table')
    })

    it('uses custom filename when provided', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems, filename: 'my_export' })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.filename).toBe('my_export')
    })

    it('excludes custom keys via excludeKeys parameter', () => {
      const fieldsWithActions = [
        ...sampleFields,
        { key: 'actions', label: 'Actions' }
      ]
      exportTableToCSV({
        fields: fieldsWithActions,
        items: sampleItems,
        excludeKeys: ['ref_id', 'id', 'actions']
      })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual(['"Author(s), Year"', '"Country"', '"Year"'])
      expect(options.headers).not.toContain('"Actions"')
    })

    it('fills missing item values with empty string', () => {
      const itemsWithMissing = [
        { ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' }
      ]
      exportTableToCSV({ fields: sampleFields, items: itemsWithMissing })

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]['"Year"']).toBe('')
    })

    it('converts undefined and null values to empty string', () => {
      const itemsWithUndefined = [
        { ref_id: '1', authors: 'Smith 2020', column_0: undefined, column_1: null }
      ]
      exportTableToCSV({ fields: sampleFields, items: itemsWithUndefined })

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]['"Country"']).toBe('')
      expect(exportedItems[0]['"Year"']).toBe('')
    })

    it('handles empty fields array gracefully', () => {
      exportTableToCSV({ fields: [], items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual([])
      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems).toEqual([{}, {}])
    })

    it('handles empty items array gracefully', () => {
      exportTableToCSV({ fields: sampleFields, items: [] })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual(['"Author(s), Year"', '"Country"', '"Year"'])
      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems).toEqual([])
    })

    it('exports only filtered columns (StepThree filter scenario)', () => {
      const filteredFields = [
        { key: 'authors', label: 'Author(s), Year' },
        { key: 'column_0', label: 'Country' }
      ]
      exportTableToCSV({ fields: filteredFields, items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual(['"Author(s), Year"', '"Country"'])

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]).toEqual({ '"Author(s), Year"': 'Smith 2020', '"Country"': 'Chile' })
      expect(exportedItems[0]).not.toHaveProperty('"Year"')
    })

    it('sets correct CSV options (BOM, separator, quotes)', () => {
      exportTableToCSV({ fields: sampleFields, items: sampleItems })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.fieldSeparator).toBe(',')
      expect(options.quoteStrings).toBe('"')
      expect(options.decimalSeparator).toBe('.')
      expect(options.showLabels).toBe(true)
      expect(options.useBom).toBe(true)
    })

    it('excludes both ref_id and id by default', () => {
      const fieldsWithId = [
        { key: 'id', label: 'ID' },
        { key: 'ref_id', label: 'Reference ID' },
        { key: 'authors', label: 'Author(s), Year' }
      ]
      const itemsWithId = [
        { id: 'abc', ref_id: '1', authors: 'Smith 2020' }
      ]
      exportTableToCSV({ fields: fieldsWithId, items: itemsWithId })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual(['"Author(s), Year"'])

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]).toEqual({ '"Author(s), Year"': 'Smith 2020' })
    })

    it('correctly maps real StepThree CAMELOT data with translated labels', () => {
      const camelotFields = [
        { key: 'authors', label: 'Autor(es), Año' },
        { key: 'research_extractedData', label: 'Dominio Meta 1 - Investigación' },
        { key: 'stakeholders_extractedData', label: 'Dominio Meta 2 - Partes interesadas' }
      ]
      const camelotItems = [
        {
          authors: 'CaCao C et al. 2023',
          research_extractedData: 'test de',
          stakeholders_extractedData: ''
        }
      ]
      exportTableToCSV({ fields: camelotFields, items: camelotItems, filename: 'characteristics_of_studies' })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers).toEqual([
        '"Autor(es), Año"',
        '"Dominio Meta 1 - Investigación"',
        '"Dominio Meta 2 - Partes interesadas"'
      ])

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]['"Autor(es), Año"']).toBe('CaCao C et al. 2023')
      expect(exportedItems[0]['"Dominio Meta 1 - Investigación"']).toBe('test de')
      expect(exportedItems[0]['"Dominio Meta 2 - Partes interesadas"']).toBe('')
    })

    it('handles commas in header labels without splitting columns', () => {
      // Labels with commas must be wrapped in quotes to prevent CSV column splitting
      const fieldsWithCommas = [
        { key: 'authors', label: 'Author(s), Year' },
        { key: 'column_0', label: 'Country' }
      ]
      const items = [{ authors: 'Smith 2020', column_0: 'Chile' }]
      exportTableToCSV({ fields: fieldsWithCommas, items })

      const options = ExportToCsv.mock.calls[0][0]
      // "Author(s), Year" should be a single quoted header, not split
      expect(options.headers.length).toBe(2)
      expect(options.headers[0]).toBe('"Author(s), Year"')
    })

    it('handles commas in custom field labels without splitting columns', () => {
      // Users can define custom fields with commas in the label
      const fieldsWithCustomComma = [
        { key: 'authors', label: 'Author(s), Year' },
        { key: 'column_0', label: 'País, Ciudad' }
      ]
      const items = [{ authors: 'Smith 2020', column_0: 'Chile, Santiago' }]
      exportTableToCSV({ fields: fieldsWithCustomComma, items })

      const options = ExportToCsv.mock.calls[0][0]
      expect(options.headers.length).toBe(2)
      expect(options.headers[0]).toBe('"Author(s), Year"')
      expect(options.headers[1]).toBe('"País, Ciudad"')

      const exportedItems = mockGenerateCsv.mock.calls[0][0]
      expect(exportedItems[0]['"País, Ciudad"']).toBe('Chile, Santiago')
    })
  })
})
