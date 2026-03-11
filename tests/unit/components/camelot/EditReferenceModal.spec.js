import { shallowMount } from '@vue/test-utils'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'

// Mock Api
jest.mock('@/utils/Api', () => ({
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
      { key: 'design_concerns', label: 'Concerns' }
    ],
    items: []
  }
  const mockReference = {
    id: 'ref1',
    authors: ['Smith, J'],
    publication_year: '2020',
    column_1: 'Custom Value',
    design_extractedData: 'Data Value',
    design_concerns: 'Concern Value'
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
    
    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/char1/',
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ 
            ref_id: 'ref1',
            column_1: 'Custom Value',
            design_extractedData: 'Data Value',
            design_concerns: 'Concern Value'
          })
        ])
      })
    )
    expect(wrapper.emitted('saved')).toBeTruthy()
  })
})
