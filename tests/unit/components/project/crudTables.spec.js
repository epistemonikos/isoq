
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: { '$set': { fields: [] } } })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

describe('crudTables.vue', () => {
  let wrapper
  let mocks

  beforeEach(() => {
    jest.clearAllMocks()
    
    mocks = {
      $t: (msg) => msg,
      $route: {
        params: {
          id: 'project-123',
          org_id: 'org-456'
        }
      },
      $bvModal: {
        msgBoxConfirm: jest.fn(() => Promise.resolve(true))
      }
    }

    wrapper = shallowMount(crudTables, {
      localVue,
      propsData: {
        type: 'isoqf_characteristics',
        prefix: 'chars',
        canEdit: true,
        project: { is_public: false },
        references: [],
        refs: [],
        lists: [],
        useCamelot: false
      },
      mocks,
      stubs: {
        'font-awesome-icon': true,
        'videoHelp': true,
        'BackToTop': true,
        'draggable': true
      }
    })
  })

  it('should ensure items only have attributes present in fields after updateDataTableFields', async () => {
    // Setup initial state
    const initialFields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'column_0', label: 'Col 0' },
      { key: 'column_1', label: 'Col 1' }
    ]
    const initialItems = [
      { ref_id: '1', authors: 'Author 1', column_0: 'data 0', column_1: 'data 1', orphan_col: 'I should be gone' }
    ]
    
    wrapper.setData({
      dataTable: {
        id: 'table-1',
        fields: initialFields,
        items: initialItems
      },
      dataTableFieldsModalEdit: {
        fields: [
          { key: 'column_0', label: 'Col 0' } // We removed column_1
        ]
      }
    })

    await wrapper.vm.updateDataTableFields()

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0]
    const sentParams = patchCall[1]

    // Fields should have ref_id, authors, and column_0
    expect(sentParams.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    
    // Items should ONLY have ref_id, authors, and column_0. column_1 and orphan_col should be gone.
    const sentItem = sentParams.items[0]
    expect(Object.keys(sentItem).sort()).toEqual(['ref_id', 'authors', 'column_0'].sort())
  })

  it('should ensure items only have attributes present in fields after saveDataTableFields', async () => {
    // Setup initial state
    await wrapper.setProps({
      references: [
        { id: 'ref1', authors: ['Auth1, Name'], publication_year: '2020' }
      ]
    })
    
    wrapper.setData({
      dataTable: { id: 'table-1' }, // Existing table for PATCH
      dataTableFieldsModal: {
        fields: ['New Col 0'], // This will become column_0
        nroColumns: 1
      }
    })

    await wrapper.vm.saveDataTableFields()

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0]
    const sentParams = patchCall[1]

    expect(sentParams.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    
    const sentItem = sentParams.items[0]
    expect(sentItem).toBeDefined()
    expect(Object.keys(sentItem).sort()).toEqual(['ref_id', 'authors', 'column_0'].sort())
  })
  
  it('should preserve camelot fields if useCamelot is true during updateDataTableFields', async () => {
    await wrapper.setProps({ useCamelot: true })
    
    // Setup initial state with some camelot data
    const initialFields = [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'column_0', label: 'Col 0' }
    ]
    const initialItems = [
      { 
        ref_id: '1', 
        authors: 'Author 1', 
        column_0: 'data 0', 
        research_extractedData: 'camelot data', // Camelot field
        orphan_col: 'I should be gone' 
      }
    ]
    
    wrapper.setData({
      dataTable: {
        id: 'table-1',
        fields: initialFields,
        items: initialItems
      },
      dataTableFieldsModalEdit: {
        fields: [
          { key: 'column_0', label: 'Col 0' }
        ]
      }
    })

    await wrapper.vm.updateDataTableFields()

    expect(Api.patch).toHaveBeenCalled()
    const sentItem = Api.patch.mock.calls[0][1].items[0]
    
    expect(sentItem.research_extractedData).toBe('camelot data')
    expect(sentItem.orphan_col).toBeUndefined()
  })
})
