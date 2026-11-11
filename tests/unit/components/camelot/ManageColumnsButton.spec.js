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
      { key: 'design_comments', label: 'Concerns' }
    ],
    items: []
  }
  const mockVisibleKeys = ['authors', 'column_1', 'design_extractedData']

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: mockCharsData,
        visibleColumnKeys: mockVisibleKeys,
        canEdit: true
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

  // Los dos tests que había acá —que el PATCH mandaba `fields` completo conservando el par
  // CAMELOT, y que no mandaba `items[]`— desaparecieron con `handleSaveColumns`. Ya no hay
  // un guardado en bloque: cada operación va por su endpoint granular, así que `fields`
  // nunca se reescribe y el par `_comments` no se puede perder por construcción. La
  // cobertura de las rutas nuevas está en ManageColumnsButton.granular.spec.js.

  describe('canEdit gating (read-only user protection)', () => {
    it('defaults canEdit to false when not provided', () => {
      const readOnlyWrapper = shallowMount(ManageColumnsButton, {
        propsData: { charsData: mockCharsData, visibleColumnKeys: mockVisibleKeys },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal: { show: jest.fn(), hide: jest.fn() } },
        stubs: { 'b-button': true, 'b-modal': true, 'b-spinner': true, 'font-awesome-icon': true, CustomFieldsManager: true }
      })
      expect(readOnlyWrapper.vm.canEdit).toBe(false)
      readOnlyWrapper.destroy()
    })

    it('does not render the trigger button when canEdit is false', async () => {
      await wrapper.setProps({ canEdit: false })
      expect(wrapper.find('b-button-stub').exists()).toBe(false)
    })

    it('renders the trigger button when canEdit is true (regression)', () => {
      expect(wrapper.find('b-button-stub').exists()).toBe(true)
    })

    it('openColumnsModal does not open the modal when canEdit is false', async () => {
      await wrapper.setProps({ canEdit: false })
      wrapper.vm.openColumnsModal()
      expect(wrapper.vm.$bvModal.show).not.toHaveBeenCalled()
      expect(wrapper.vm.columnDefinitions).toEqual([])
    })
  })
})
