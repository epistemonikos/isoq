import { shallowMount } from '@vue/test-utils'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'

// Mock Api
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

const $t = (key) => key

describe('EditReferenceModal.vue', () => {
  let wrapper
  const mockCamelot = {
    fields: [{ key: 'field1', label: 'Field 1' }],
    categories: [
      {
        key: 'cat1',
        label: 'Category 1',
        options: [{ key: 'field1', label: 'Field 1' }]
      }
    ]
  }
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
  const mockReference = {
    id: 'ref1',
    authors: ['Smith, J'],
    publication_year: '2020',
    column_1: 'Custom Value',
    design_extractedData: 'Data Value',
    design_comments: 'Concern Value'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(EditReferenceModal, {
      propsData: {
        reference: mockReference,
        charsData: mockCharsData,
        camelot: mockCamelot
      },
      mocks: {
        $t,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: {
          show: jest.fn(),
          hide: jest.fn()
        }
      },
      stubs: {
        'b-modal': true,
        'b-row': true,
        'b-col': true,
        'b-card': true,
        'b-card-body': true,
        'b-form-textarea': true,
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

  it('initializes editForm and localReference from reference prop', () => {
    expect(wrapper.vm.localReference.id).toBe('ref1')
    expect(wrapper.vm.editForm.id).toBe('ref1')
  })

  it('calls Api.patch when handleModalOk is triggered', async () => {
    await wrapper.vm.handleModalOk()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/char1/',
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            ref_id: 'ref1',
            authors: 'Smith 2020',
            column_1: 'Custom Value',
            design_extractedData: 'Data Value',
            design_comments: 'Concern Value'
          })
        ])
      })
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })

  describe('hasInvalidCustomFields', () => {
    it('returns false when all non-Camelot fields have labels', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: 'My column' },
          { isCamelot: true, locked: true, label: 'Camelot field' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })

    it('returns true when a non-Camelot field has an empty label', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: '' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(true)
    })

    it('returns true when a non-Camelot field has a whitespace-only label', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: false, locked: false, label: '   ' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(true)
    })

    it('ignores Camelot fields with empty labels', async () => {
      await wrapper.setData({
        customFields: [
          { isCamelot: true, locked: true, label: '' }
        ]
      })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })

    it('returns false when there are no custom fields', async () => {
      await wrapper.setData({ customFields: [] })
      expect(wrapper.vm.hasInvalidCustomFields).toBe(false)
    })
  })
})
