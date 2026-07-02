import { shallowMount, mount } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import Api from '@/utils/Api'
import * as xlsxExporter from '@/utils/xlsxExporter'

// Mock Api
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

// Mock xlsxExporter
jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn()
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
        type: 'isoqf_characteristics',
        canEdit: true
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
          props: ['charsData', 'visibleColumnKeys', 'camelot']
        },
        'ToggleConcernsButton': {
          name: 'ToggleConcernsButton',
          template: '<div />',
          props: ['value', 'hasVisibleCamelotFields', 'visibleColumnKeys', 'camelot']
        },
        'EditReferenceModal': {
          name: 'EditReferenceModal',
          template: '<div />',
          props: ['reference', 'charsData', 'camelot', 'visibleColumnKeys'],
          methods: { show: jest.fn() }
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

  describe('handleReferenceSaved()', () => {
    it('replaces charsData when updatedData has items', async () => {
      const initialCharsData = {
        id: 'ch1',
        fields: [{ key: 'authors', label: 'Authors' }],
        items: [
          { ref_id: 'ref1', authors: 'Smith 2020' },
          { ref_id: 'ref2', authors: 'Doe 2021' }
        ]
      }
      const updatedCharsData = {
        ...initialCharsData,
        items: [
          { ref_id: 'ref1', authors: 'Smith 2020', column_1: 'Updated' },
          { ref_id: 'ref2', authors: 'Doe 2021' }
        ]
      }
      await wrapper.setData({ charsData: initialCharsData })

      wrapper.vm.handleReferenceSaved(updatedCharsData)

      expect(wrapper.vm.charsData.items).toHaveLength(2)
      expect(wrapper.vm.charsData.items[0].column_1).toBe('Updated')
      expect(wrapper.vm.charsData.items[1].ref_id).toBe('ref2')
    })

    it('merges metadata without wiping items when updatedData has no items', async () => {
      const initialCharsData = {
        id: 'ch1',
        fields: [{ key: 'authors', label: 'Authors' }],
        items: [
          { ref_id: 'ref1', authors: 'Smith 2020' },
          { ref_id: 'ref2', authors: 'Doe 2021' }
        ]
      }
      await wrapper.setData({ charsData: initialCharsData })

      wrapper.vm.handleReferenceSaved({ id: 'ch1', _id: 'ch1-new' })

      expect(wrapper.vm.charsData.items).toHaveLength(2)
      expect(wrapper.vm.charsData._id).toBe('ch1-new')
    })
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

  describe('canEdit gating (read-only user protection)', () => {
    it('defaults canEdit to false when not provided', () => {
      const readOnlyWrapper = shallowMount(StepThree, {
        propsData: { references: mockReferences, type: 'isoqf_characteristics' },
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } } }
      })
      expect(readOnlyWrapper.vm.canEdit).toBe(false)
    })

    it('editReference does nothing when canEdit is false', async () => {
      await wrapper.setProps({ canEdit: false })
      wrapper.vm.editReference(mockReferences[0])
      expect(wrapper.vm.currentItem).toBe(null)
    })

    it('editReference sets currentItem when canEdit is true (regression)', async () => {
      await wrapper.setProps({ canEdit: true })
      wrapper.vm.editReference(mockReferences[0])
      expect(wrapper.vm.currentItem).toEqual(mockReferences[0])
    })

    it('deleteReference does not emit delete-reference when canEdit is false', async () => {
      await wrapper.setProps({ canEdit: false })
      wrapper.vm.deleteReference(mockReferences[0])
      expect(wrapper.emitted('delete-reference')).toBeFalsy()
    })

    it('deleteReference emits delete-reference when canEdit is true (regression)', async () => {
      await wrapper.setProps({ canEdit: true })
      wrapper.vm.deleteReference(mockReferences[0])
      expect(wrapper.emitted('delete-reference')).toBeTruthy()
    })
  })
})
