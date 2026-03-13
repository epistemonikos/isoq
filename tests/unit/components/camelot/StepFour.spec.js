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
})
