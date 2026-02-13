import { shallowMount } from '@vue/test-utils'
import ExportCSVButton from '@/components/camelot/ExportCSVButton.vue'
import * as csvExporter from '@/utils/csvExporter'

// Mock csvExporter
jest.mock('@/utils/csvExporter', () => ({
  exportTableToCSV: jest.fn()
}))

const $t = (key) => key

describe('ExportCSVButton.vue', () => {
  let wrapper
  const mockFields = [
    { key: 'authors', label: 'Authors' },
    { key: 'column_1', label: 'Field 1' }
  ]
  const mockItems = [
    { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', column_1: 'Value 1' },
    { id: 'ref2', authors: ['Doe, A'], publication_year: '2021', column_1: 'Value 2' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ExportCSVButton, {
      propsData: {
        fields: mockFields,
        items: mockItems,
        filename: 'test_export'
      },
      mocks: {
        $t
      },
      stubs: {
        'b-button': true
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('calls exportTableToCSV with processed items when clicked', async () => {
    wrapper.vm.exportToCSV()
    
    expect(csvExporter.exportTableToCSV).toHaveBeenCalled()
    const callArgs = csvExporter.exportTableToCSV.mock.calls[0][0]
    
    expect(callArgs.filename).toBe('test_export')
    expect(callArgs.fields).toEqual(mockFields)
    expect(callArgs.items).toHaveLength(2)
    
    // Check processed authors
    expect(callArgs.items[0].authors).toContain('Smith 2020')
    expect(callArgs.items[1].authors).toContain('Doe 2021')
    
    // Check other values
    expect(callArgs.items[0].column_1).toBe('Value 1')
  })
})
