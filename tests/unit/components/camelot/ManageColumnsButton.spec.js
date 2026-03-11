import { shallowMount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import Api from '@/utils/Api'

// Mock Api
jest.mock('@/utils/Api', () => ({
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

const $t = (key) => key

describe('ManageColumnsButton.vue', () => {
  let wrapper
  const mockCharsData = {
    id: 'char1',
    fields: [
      { key: 'authors', label: 'Authors' },
      { key: 'column_1', label: 'Custom Field 1' },
      { key: 'design_extractedData', label: 'Study Design' },
      { key: 'design_concerns', label: 'Concerns' }
    ],
    items: []
  }
  const mockVisibleKeys = ['authors', 'column_1', 'design_extractedData']

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: mockCharsData,
        visibleColumnKeys: mockVisibleKeys
      },
      mocks: {
        $t,
        $route: {
          params: { org_id: 'org1', id: 'proj1' }
        },
        $bvModal: {
          show: jest.fn(),
          hide: jest.fn()
        },
        $bvToast: {
          toast: jest.fn()
        }
      },
      stubs: {
        'b-button': true,
        'b-modal': true,
        'b-spinner': true,
        'font-awesome-icon': true,
        'CustomFieldsManager': true
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('initializes columnDefinitions when opening modal with both custom and camelot fields', () => {
    wrapper.vm.openColumnsModal()
    
    expect(wrapper.vm.columnDefinitions).toHaveLength(2)
    expect(wrapper.vm.columnDefinitions[0].label).toBe('Custom Field 1')
    expect(wrapper.vm.columnDefinitions[0].isCamelot).toBeFalsy()
    expect(wrapper.vm.columnDefinitions[1].label).toBe('Study Design')
    expect(wrapper.vm.columnDefinitions[1].isCamelot).toBe(true)
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('modal-manage-columns')
  })

  it('calls Api.patch when saving existing characteristics and maintains pairs', async () => {
    wrapper.setData({
      columnDefinitions: [
        { key: 'design_extractedData', label: 'Study Design', isCamelot: true },
        { key: 'column_1', label: 'Updated Label' }
      ]
    })
    
    await wrapper.vm.handleSaveColumns()
    
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/char1',
      expect.objectContaining({
        fields: [
          { key: 'authors', label: 'Authors' }, // System field
          { key: 'design_extractedData', label: 'Study Design' }, // Camelot parent
          { key: 'design_concerns', label: 'Concerns' }, // Camelot pair automatically included
          { key: 'column_1', label: 'Updated Label' } // Custom field
        ]
      })
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })
})
