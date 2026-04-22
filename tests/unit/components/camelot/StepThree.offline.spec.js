import { shallowMount } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/utils/csvExporter', () => ({
  exportTableToCSV: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const $t = (key) => key

const componentStubs = {
  'b-alert': true,
  'b-button': true,
  'b-table': true,
  'b-modal': true,
  'font-awesome-icon': true,
  'TableColumnFilter': true,
  'ExportCSVButton': { name: 'ExportCSVButton', template: '<div />', props: ['fields', 'items'] },
  'ManageColumnsButton': { name: 'ManageColumnsButton', template: '<div />', props: ['charsData', 'visibleColumnKeys', 'camelot'] },
  'ToggleConcernsButton': { name: 'ToggleConcernsButton', template: '<div />', props: ['value', 'hasVisibleCamelotFields', 'visibleColumnKeys', 'camelot'] },
  'EditReferenceModal': { name: 'EditReferenceModal', template: '<div />', props: ['reference', 'charsData', 'camelot', 'visibleColumnKeys'] }
}

const createWrapper = (references) => shallowMount(StepThree, {
  propsData: { references, type: 'isoqf_characteristics' },
  mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } } },
  stubs: componentStubs
})

describe('StepThree.vue - offline authors display', () => {
  afterEach(() => jest.clearAllMocks())

  describe('tableItems and formatAuthors with properly-formatted references', () => {
    it('shows non-empty formatted authors when reference has single-element array authors', async () => {
      const wrapper = createWrapper([
        { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'Title 1' }
      ])
      await flushPromises()

      const items = wrapper.vm.tableItems
      expect(items).toHaveLength(1)
      const formatted = wrapper.vm.formatAuthors(items[0])
      expect(formatted).not.toBe('')
      expect(formatted).toContain('Smith')
      wrapper.destroy()
    })

    it('shows non-empty formatted authors for all references', async () => {
      const wrapper = createWrapper([
        { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'T1' },
        { id: 'ref2', authors: ['Doe, A'], publication_year: '2021', title: 'T2' }
      ])
      await flushPromises()

      wrapper.vm.tableItems.forEach(item => {
        expect(wrapper.vm.formatAuthors(item)).not.toBe('')
      })
      wrapper.destroy()
    })

    it('preserves reference authors array when merging with characteristic item', async () => {
      const wrapper = createWrapper([
        { id: 'ref1', authors: ['Smith, J'], publication_year: '2020', title: 'Title 1' }
      ])
      await flushPromises()

      // EditReferenceModal stores authors as an array in charsData.items
      wrapper.setData({
        charsData: {
          id: 'char1', project_id: 'proj1', fields: [],
          items: [{ ref_id: 'ref1', authors: ['Smith, J'], customField: 'value' }]
        }
      })

      const items = wrapper.vm.tableItems
      // tableItems explicitly sets authors: ref.authors — the reference's original array
      expect(items[0].authors).toEqual(['Smith, J'])
      expect(wrapper.vm.formatAuthors(items[0])).toContain('Smith')
      wrapper.destroy()
    })
  })

  describe('tableItems with raw IndexedDB records (reproduces offline bug)', () => {
    it('returns empty formatted authors when references are raw db records (authors nested under .data)', async () => {
      // Reproduces the offline bug: OfflineStrategies.references.serve() was returning
      // raw IndexedDB records { id, projectId, data, lastSync } instead of reference .data.
      // ref.authors is undefined on the raw record → parseReference returns ''
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

      const items = wrapper.vm.tableItems
      // Bug: ref.authors is undefined (it's at ref.data.authors) → returns ''
      expect(wrapper.vm.formatAuthors(items[0])).toBe('')
      wrapper.destroy()
    })
  })
})
