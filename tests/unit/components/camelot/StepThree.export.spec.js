import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  releaseRef: jest.fn(),
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  refLocks: new Map()
}))

const CATALOGO = [
  { key: 'research_extractedData', label: 'Extracted data' },
  { key: 'research_comments', label: 'Comments' },
  { key: 'context_extractedData', label: 'Extracted data' },
  { key: 'context_comments', label: 'Comments' }
]

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    computed: {
      camelot () {
        return {
          fields: [
            { key: 'research_extractedData', label: 'Extracted data' },
            { key: 'research_comments', label: 'Comments' },
            { key: 'context_extractedData', label: 'Extracted data' },
            { key: 'context_comments', label: 'Comments' }
          ],
          categories: [
            {
              key: 'research',
              label: 'Research question',
              options: [
                { key: 'research_extractedData', label: 'Extracted data' },
                { key: 'research_comments', label: 'Comments' }
              ]
            },
            {
              key: 'context',
              label: 'Context',
              options: [
                { key: 'context_extractedData', label: 'Extracted data' },
                { key: 'context_comments', label: 'Comments' }
              ]
            }
          ]
        }
      }
    },
    methods: {},
    data: () => ({})
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const DOC = {
  id: 'char1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'research_extractedData', label: 'Extracted data' },
    { key: 'research_comments', label: 'Comments' },
    { key: 'context_extractedData', label: 'Extracted data' },
    { key: 'context_comments', label: 'Comments' },
    { key: 'column_98f669e17fe1493c5055fdf8', label: 'My column' }
  ],
  items: [{ ref_id: 'r1', authors: 'Smith 2020' }]
}

function createWrapper () {
  return shallowMount(StepThree, {
    localVue,
    propsData: { references: [{ id: 'r1', authors: 'Smith', publication_year: 2020 }], type: 'isoqf_characteristics' },
    mocks: { $t: key => key, $route: { params: { id: 'proj1', org_id: 'org1' } } },
    // The real component (it is lazy-loaded): its `fields` prop is what gets exported.
    stubs: { ExportCSVButton: { name: 'ExportCSVButton', props: ['fields', 'items'], template: '<div class="export-stub"></div>' } }
  })
}
const exported = w => w.findComponent({ name: 'ExportCSVButton' }).props('fields')
const exportedKeys = w => exported(w).map(f => f.key)
// Como ToggleConcernsButton: enciende los comentarios y suma sus columnas a las visibles.
const commentsOn = w => w.setData({
  showComments: true,
  visibleColumnKeys: [...w.vm.visibleColumnKeys, 'research_comments', 'context_comments']
})

// #416 (reemplaza a #394): todo exportable es lo que la persona ve. #394 había pedido
// exportar la tabla entera; se cambió para que Excel, Word y PDF sigan la misma regla.
describe('StepThree — the export is what is on screen (#416)', () => {
  let wrapper
  beforeEach(async () => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    wrapper = createWrapper()
    wrapper.vm.loadCharacteristicsData()
    await flushPromises()
    wrapper.vm.applyServerChars(DOC)
    await wrapper.vm.$nextTick()
  })
  afterEach(() => wrapper.destroy())

  it('does not export the columns the filter hides', async () => {
    await wrapper.setData({ visibleColumnKeys: ['research_extractedData'], showComments: false })
    expect(exportedKeys(wrapper)).toEqual(['authors', 'research_extractedData'])
  })

  it('does not export the comment columns while comments are not shown', async () => {
    await wrapper.setData({ showComments: false })
    expect(exportedKeys(wrapper)).not.toEqual(expect.arrayContaining(['research_comments']))
    expect(exportedKeys(wrapper)).not.toContain('context_comments')
  })

  it('exports them when they are shown', async () => {
    await commentsOn(wrapper)
    expect(exportedKeys(wrapper)).toEqual(expect.arrayContaining(['research_comments', 'context_comments']))
  })

  it('never exports the edit or actions columns', async () => {
    await commentsOn(wrapper)
    expect(exportedKeys(wrapper)).not.toContain('edit')
    expect(exportedKeys(wrapper)).not.toContain('actions')
  })

  it('names each comment column after its domain, since a spreadsheet has no grouped headers', async () => {
    await commentsOn(wrapper)
    const byKey = Object.fromEntries(exported(wrapper).map(f => [f.key, f.label]))
    expect(byKey.research_comments).toBe('Comments - Research question')
    expect(byKey.context_comments).toBe('Comments - Context')
    expect(byKey.research_extractedData).toBe('Research question')
  })

  it('keeps each comment column next to its extracted data', async () => {
    await commentsOn(wrapper)
    const keys = exportedKeys(wrapper)
    expect(keys.indexOf('research_comments')).toBe(keys.indexOf('research_extractedData') + 1)
  })

  it('leaves the table on screen as filtered', async () => {
    await wrapper.setData({ visibleColumnKeys: ['research_extractedData'], showComments: false })
    const tableKeys = wrapper.vm.tableFields.map(f => f.key)
    expect(tableKeys).not.toContain('context_extractedData')
    expect(tableKeys).not.toContain('research_comments')
  })
})
