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
      { key: 'column_1', label: 'Custom Field 1' }
    ],
    items: []
  }
  const mockVisibleKeys = ['authors', 'column_1']

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

  it('initializes columnDefinitions when opening modal', () => {
    wrapper.vm.openColumnsModal()
    
    expect(wrapper.vm.columnDefinitions).toHaveLength(1)
    expect(wrapper.vm.columnDefinitions[0].label).toBe('Custom Field 1')
    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('modal-manage-columns')
  })

  it('calls Api.patch when saving existing characteristics', async () => {
    wrapper.setData({
      columnDefinitions: [{ key: 'column_1', label: 'Updated Label' }]
    })
    
    await wrapper.vm.handleSaveColumns()
    
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/char1',
      expect.objectContaining({
        fields: expect.arrayContaining([
          expect.objectContaining({ key: 'column_1', label: 'Updated Label' })
        ])
      })
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })
})
