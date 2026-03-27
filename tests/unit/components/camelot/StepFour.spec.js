import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

jest.mock('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

describe('StepFour.vue - TDD for inline editing', () => {
  let wrapper
  const mockReferences = [{ id: 'ref1', authors: 'Author 2024' }]
  const getMockCharacteristics = () => ({
    id: 'char123',
    items: [
      {
        ref_id: 'ref1',
        strategy_extractedData: 'Old data',
        strategy_comments: 'Old comments'
      }
    ]
  })

  beforeEach(() => {
    jest.clearAllMocks()
    const mockCharacteristics = getMockCharacteristics()
    Api.get.mockResolvedValue({ data: [mockCharacteristics] })
    Api.patch.mockResolvedValue({ data: { ...mockCharacteristics } })
    
    wrapper = shallowMount(StepFour, {
      localVue,
      propsData: {
        type: 'camelot',
        references: mockReferences
      },
      mocks: {
        $t: (msg) => msg,
        $route: { params: { org_id: 'org1', id: 'proj1' } }
      },
      stubs: {
        'font-awesome-icon': true,
        'b-modal': true,
        'b-table': true,
        'b-tabs': true,
        'b-tab': true,
        'b-row': true,
        'b-col': true,
        'b-collapse': true,
        'assessmentForm': true,
        'responses': true
      }
    })
  })

  it('should call Api.patch with correct updated data when saveField is called for extractedData', async () => {
    // 1. Setup initial state
    const mockCharacteristics = getMockCharacteristics()
    wrapper.setData({
      characteristics: mockCharacteristics,
      refId: 'ref1',
      editingField: { metaIndex: 1, itemIndex: 0, type: 'extractedData' }, // Strategy
      editValueExtracted: 'New extracted data'
    })

    // 2. Trigger save
    await wrapper.vm.saveField('New extracted data')

    // 3. Assertions
    expect(Api.patch).toHaveBeenCalledWith(
      expect.stringContaining('/isoqf_characteristics/char123'),
      expect.objectContaining({
        id: 'char123',
        items: expect.arrayContaining([
          expect.objectContaining({
            ref_id: 'ref1',
            strategy_extractedData: 'New extracted data',
            strategy_comments: 'Old comments'
          })
        ])
      })
    )
  })

  it('should call Api.patch with correct updated data when saveField is called for comments', async () => {
    // 1. Setup initial state
    const mockCharacteristics = getMockCharacteristics()
    wrapper.setData({
      characteristics: mockCharacteristics,
      refId: 'ref1',
      editingField: { metaIndex: 1, itemIndex: 0, type: 'comments' }, // Strategy
      editValueComments: 'New comments'
    })

    // 2. Trigger save
    await wrapper.vm.saveField('New comments')

    // 3. Assertions
    expect(Api.patch).toHaveBeenCalledWith(
      expect.stringContaining('/isoqf_characteristics/char123'),
      expect.objectContaining({
        id: 'char123',
        items: expect.arrayContaining([
          expect.objectContaining({
            ref_id: 'ref1',
            strategy_extractedData: 'Old data',
            strategy_comments: 'New comments'
          })
        ])
      })
    )
  })

  describe('exportItems computed property', () => {
    it('should correctly map assessment values and comments to export format', () => {
      // Mock some assessments items
      wrapper.setData({
        ui: {
          ...wrapper.vm.ui,
          responses: [
            { text: 'No or minimal concerns', value: 'A' },
            { text: 'Minor concerns', value: 'B' }
          ]
        },
        assessments: {
          items: [{
            ref_id: 'ref1',
            stages: [
              {
                key: 0,
                options: [
                  { option: 'A', text: 'some explanation' }, // FA1
                  { option: null, text: '' },                // FA2
                  { option: 'B', text: '' },                 // FA3
                  { option: null, text: 'only explanation' } // FA4
                ]
              },
              {
                key: 1,
                options: [
                  { option: 'A', text: '' }, // FA5
                  { option: 'A', text: '' }, // FA6
                  { option: 'A', text: '' }, // FA7
                  { option: 'A', text: '' }  // FA8
                ]
              },
              {
                key: 2,
                options: [{ option: 'A', text: '' }] // FA9
              },
              {
                key: 3,
                options: [{ option: 'B', text: 'final comment' }] // OA
              }
            ]
          }]
        }
      })
      
      const exportItems = wrapper.vm.exportItems
      expect(exportItems.length).toBe(1)
      expect(exportItems[0]).toEqual({
        authors: 'Author 2024',
        fa1: 'No or minimal concerns, explanation: some explanation',
        fa2: '',
        fa3: 'Minor concerns',
        fa4: 'explanation: only explanation',
        fa5: 'No or minimal concerns',
        fa6: 'No or minimal concerns',
        fa7: 'No or minimal concerns',
        fa8: 'No or minimal concerns',
        fa9: 'No or minimal concerns',
        oa: 'Minor concerns, explanation: final comment'
      })
    })
  })
})
