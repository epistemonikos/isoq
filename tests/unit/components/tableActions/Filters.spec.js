import { shallowMount } from '@vue/test-utils'
import Filters from '@/components/tableActions/Filters.vue'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/commons.js', () => ({
  orderKeys: jest.fn(obj => obj)
}))

// Import after mocks so we get the mocked version
const { exportTableToXLSX } = require('@/utils/xlsxExporter')

const defaultProps = {
  tableSettings: { filter: '' },
  idname: 'test-table',
  type: 'chars_of_studies',
  fields: [{ key: 'title', label: 'Title' }],
  items: [{ title: 'Item 1', ref_id: 42 }]
}

function createWrapper (propsData = {}) {
  return shallowMount(Filters, {
    propsData: { ...defaultProps, ...propsData },
    mocks: {
      $t: key => key
    }
  })
}

describe('Filters.vue — toCSV', () => {
  beforeEach(() => {
    exportTableToXLSX.mockClear()
  })

  it('calls exportTableToXLSX with filename "Characteristics of studies" for chars_of_studies', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.toCSV('chars_of_studies')
    expect(exportTableToXLSX).toHaveBeenCalledTimes(1)
    expect(exportTableToXLSX).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'Characteristics of studies' })
    )
  })

  it('calls exportTableToXLSX with filename "Methodological assessments" for meth_assessments', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.toCSV('meth_assessments')
    expect(exportTableToXLSX).toHaveBeenCalledTimes(1)
    expect(exportTableToXLSX).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'Methodological assessments' })
    )
  })

  it('calls exportTableToXLSX with filename "Extracted data" for extracted_data', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.toCSV('extracted_data')
    expect(exportTableToXLSX).toHaveBeenCalledTimes(1)
    expect(exportTableToXLSX).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'Extracted data' })
    )
  })

  it('calls exportTableToXLSX with filename "exportable_table" for unknown type', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.toCSV('unknown')
    expect(exportTableToXLSX).toHaveBeenCalledTimes(1)
    expect(exportTableToXLSX).toHaveBeenCalledWith(
      expect.objectContaining({ filename: 'exportable_table' })
    )
  })

  it('calls exportTableToXLSX with excludeKeys: ["ref_id"]', async () => {
    const wrapper = createWrapper()
    await wrapper.vm.toCSV('chars_of_studies')
    expect(exportTableToXLSX).toHaveBeenCalledWith(
      expect.objectContaining({ excludeKeys: ['ref_id'] })
    )
  })
})
