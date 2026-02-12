import { shallowMount, mount } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import Api from '@/utils/Api'
import * as csvExporter from '@/utils/csvExporter'

// Mock Api
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

// Mock csvExporter
jest.mock('@/utils/csvExporter', () => ({
  exportTableToCSV: jest.fn()
}))

// Mock Translation plugin
const $t = (key) => key

describe('StepThree.vue', () => {
  let wrapper
  const mockReferences = [
    { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'Title 1' },
    { id: 'ref2', authors: ['Doe, A'], publication_year: '2021', title: 'Title 2' }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(StepThree, {
      propsData: {
        references: mockReferences,
        type: 'isoqf_characteristics'
      },
      mocks: {
        $t,
        $route: {
          params: {
            org_id: 'org1',
            id: 'proj1'
          }
        }
      },
      stubs: {
        'b-alert': true,
        'b-button': true,
        'b-table': true,
        'b-modal': true,
        'font-awesome-icon': true,
        'TableColumnFilter': true,
        'ExportCSVButton': {
          name: 'ExportCSVButton',
          template: '<div />',
          props: ['fields', 'items']
        },
        'ManageColumnsButton': {
          name: 'ManageColumnsButton',
          template: '<div />',
          props: ['charsData', 'visibleColumnKeys']
        },
        'ToggleConcernsButton': {
          name: 'ToggleConcernsButton',
          template: '<div />',
          props: ['value', 'hasVisibleCamelotFields', 'visibleColumnKeys', 'camelot']
        },
        'EditReferenceModal': {
          name: 'EditReferenceModal',
          template: '<div />',
          props: ['reference', 'charsData', 'camelot', 'visibleColumnKeys']
        }
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('renders all action buttons and modal with correct props', () => {
    // We need to provide some data so tableFields and tableItems are populated
    wrapper.setData({
      isLoading: false,
      charsData: {
        fields: [{ key: 'authors', label: 'Authors' }],
        items: []
      }
    })

    const exportBtn = wrapper.findComponent({ name: 'ExportCSVButton' })
    expect(exportBtn.exists()).toBe(true)
    
    const manageBtn = wrapper.findComponent({ name: 'ManageColumnsButton' })
    expect(manageBtn.exists()).toBe(true)

    const toggleBtn = wrapper.findComponent({ name: 'ToggleConcernsButton' })
    expect(toggleBtn.exists()).toBe(true)

    const editModal = wrapper.findComponent({ name: 'EditReferenceModal' })
    expect(editModal.exists()).toBe(true)
    expect(editModal.props('charsData')).toBeDefined()
  })
})
