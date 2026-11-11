import { shallowMount } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const $t = (key) => key

const componentStubs = {
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

const createWrapper = (references) => shallowMount(StepFour, {
  propsData: { type: 'camelot', references },
  mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } } },
  stubs: componentStubs
})

const makeAssessmentItem = (refId, authorsString) => ({
  ref_id: refId,
  authors: authorsString,
  stages: [
    { key: 0, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
    { key: 1, options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
    { key: 2, options: [{ option: null, text: '' }] },
    { key: 3, options: [{ option: null, text: '' }] }
  ]
})

describe('StepFour.vue - offline authors display', () => {
  afterEach(() => jest.clearAllMocks())

  describe('tableItems with properly-formatted references', () => {
    it('shows non-empty authors when reference has array-format authors', async () => {
      const wrapper = createWrapper([
        { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'Title 1' }
      ])
      await flushPromises()

      wrapper.setData({
        assessments: { items: [makeAssessmentItem('ref1', 'Smith J 2020')] }
      })

      const items = wrapper.vm.tableItems
      expect(items).toHaveLength(1)
      expect(items[0].authors).not.toBe('')
      expect(items[0].authors).toContain('Smith')
      wrapper.destroy()
    })

    it('shows non-empty authors when reference has string-format authors', async () => {
      const wrapper = createWrapper([
        { id: 'ref1', authors: 'Smith J 2020' }
      ])
      await flushPromises()

      wrapper.setData({
        assessments: { items: [makeAssessmentItem('ref1', 'Smith J 2020')] }
      })

      const items = wrapper.vm.tableItems
      expect(items[0].authors).toBe('Smith J 2020')
      wrapper.destroy()
    })

    it('falls back to assessment item authors string when reference is not found', async () => {
      const wrapper = createWrapper([])
      await flushPromises()

      // Assessment has an item with ref_id that doesn't match any reference
      wrapper.setData({
        assessments: { items: [makeAssessmentItem('ref1', 'Fallback Author 2020')] }
      })

      const items = wrapper.vm.tableItems
      expect(items).toHaveLength(1)
      // ref not found → returns item as-is with stored authors string
      expect(items[0].authors).toBe('Fallback Author 2020')
      wrapper.destroy()
    })
  })

  describe('tableItems with raw IndexedDB records (reproduces offline bug)', () => {
    it('returns empty authors when references are raw db records (authors nested under .data)', async () => {
      // Reproduces the offline bug: OfflineStrategies.references.serve() was returning
      // raw IndexedDB records { id, projectId, data, lastSync } instead of reference .data.
      // parseReference(rawRecord) returns '' because rawRecord.authors is undefined.
      const rawDbRefs = [
        {
          id: 'ref1',
          projectId: 'proj1',
          data: { id: 'ref1', authors: ['Smith, J'], publication_year: '2020' },
          lastSync: '2024-01-01T00:00:00.000Z'
        }
      ]
      const wrapper = createWrapper(rawDbRefs)
      await flushPromises()

      wrapper.setData({
        assessments: { items: [makeAssessmentItem('ref1', 'Smith J 2020')] }
      })

      const items = wrapper.vm.tableItems
      // Bug: ref.authors is undefined (it's at ref.data.authors) → parseReference returns ''
      expect(items[0].authors).toBe('')
      wrapper.destroy()
    })
  })
})
