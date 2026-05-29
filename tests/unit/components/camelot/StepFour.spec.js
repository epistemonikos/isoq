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
    await new Promise(resolve => setTimeout(resolve, 0))

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
    await new Promise(resolve => setTimeout(resolve, 0))

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

  describe('getAssessments synchronization', () => {
    const flush = () => new Promise(resolve => setTimeout(resolve, 0))

    const mountWithRefs = (references, apiResponse) => {
      Api.get.mockResolvedValue({ data: apiResponse })
      return shallowMount(StepFour, {
        localVue,
        propsData: { type: 'camelot', references },
        mocks: { $t: (msg) => msg, $route: { params: { org_id: 'org1', id: 'proj1' } } },
        stubs: { 'font-awesome-icon': true, 'b-modal': true, 'b-table': true, 'b-tabs': true, 'b-tab': true, 'b-row': true, 'b-col': true, 'b-collapse': true, 'assessmentForm': true, 'responses': true }
      })
    }

    const emptyStages = () => [
      { key: 0, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
      { key: 1, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
      { key: 2, options: [{ option: null, text: '' }] },
      { key: 3, options: [{ option: null, text: '' }] }
    ]

    it('adds items for references not yet in the server document', async () => {
      const references = [
        { id: 'ref1', authors: 'Author A' },
        { id: 'ref2', authors: 'Author B' }
      ]
      const w = mountWithRefs(references, [{ id: 'assess1', items: [{ ref_id: 'ref1', authors: 'Author A', stages: emptyStages() }] }])
      await flush()

      expect(w.vm.assessments.items).toHaveLength(2)
      const added = w.vm.assessments.items.find(i => i.ref_id === 'ref2')
      expect(added).toBeDefined()
      expect(added.stages).toHaveLength(4)
      w.destroy()
    })

    it('filters out orphan items whose ref_id no longer exists in active references', async () => {
      // Bug scenario: server has items for ref3 (a deleted reference) alongside ref1 and ref2.
      // Only ref1 and ref2 are active — ref3 items must not appear in the table.
      const references = [
        { id: 'ref1', authors: 'Author A' },
        { id: 'ref2', authors: 'Author B' }
      ]
      const w = mountWithRefs(references, [{
        id: 'assess1',
        items: [
          { ref_id: 'ref1', authors: 'Author A', stages: emptyStages() },
          { ref_id: 'ref2', authors: 'Author B', stages: emptyStages() },
          { ref_id: 'ref3', authors: 'Deleted Author', stages: emptyStages() }
        ]
      }])
      await flush()

      expect(w.vm.assessments.items).toHaveLength(2)
      expect(w.vm.assessments.items.find(i => i.ref_id === 'ref3')).toBeUndefined()
      w.destroy()
    })

    it('merges items from multiple assessment documents when each doc has different refs', async () => {
      // Bug scenario: two assessment documents exist (created by duplicate POSTs).
      // doc1 has the item for ref1, doc2 has the item for ref2. Both must be shown.
      const references = [
        { id: 'ref1', authors: 'Author A' },
        { id: 'ref2', authors: 'Author B' }
      ]
      const w = mountWithRefs(references, [
        { id: 'doc1', items: [{ ref_id: 'ref1', authors: 'Author A', stages: emptyStages() }] },
        { id: 'doc2', items: [{ ref_id: 'ref2', authors: 'Author B', stages: emptyStages() }] }
      ])
      await flush()

      expect(w.vm.assessments.items).toHaveLength(2)
      expect(w.vm.assessments.items.find(i => i.ref_id === 'ref1')).toBeDefined()
      expect(w.vm.assessments.items.find(i => i.ref_id === 'ref2')).toBeDefined()
      w.destroy()
    })

    it('prefers the item with more non-null votes when the same ref_id appears in multiple documents', async () => {
      const references = [{ id: 'ref1', authors: 'Author A' }]
      const stagesWithVotes = () => [
        { key: 0, options: [{ option: 'A', text: '' }, { option: null, text: '' }, { option: null, text: '' }, { option: null, text: '' }] },
        { key: 1, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
        { key: 2, options: [{ option: null, text: '' }] },
        { key: 3, options: [{ option: null, text: '' }] }
      ]
      const w = mountWithRefs(references, [
        { id: 'doc1', items: [{ ref_id: 'ref1', stages: emptyStages() }] },
        { id: 'doc2', items: [{ ref_id: 'ref1', stages: stagesWithVotes() }] }
      ])
      await flush()

      expect(w.vm.assessments.items).toHaveLength(1)
      // Should use the item from doc2 (has 1 vote) over doc1 (0 votes)
      expect(w.vm.assessments.items[0].stages[0].options[0].option).toBe('A')
      w.destroy()
    })

    it('uses the document with the most matching items as primary (for PATCH saves)', async () => {
      const references = [
        { id: 'ref1', authors: 'Author A' },
        { id: 'ref2', authors: 'Author B' }
      ]
      const w = mountWithRefs(references, [
        { id: 'stale-doc', items: [{ ref_id: 'ref1', stages: emptyStages() }] },
        { id: 'best-doc', items: [{ ref_id: 'ref1', stages: emptyStages() }, { ref_id: 'ref2', stages: emptyStages() }] }
      ])
      await flush()

      // best-doc has 2 matches; stale-doc has 1. Primary should be best-doc.
      expect(w.vm.assessments.id).toBe('best-doc')
      w.destroy()
    })

    it('does not call the API when references prop is empty', async () => {
      Api.get.mockClear()
      const w = mountWithRefs([], [])
      await flush()

      expect(Api.get).not.toHaveBeenCalledWith('/isoqf_assessments', expect.anything())
      w.destroy()
    })
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
