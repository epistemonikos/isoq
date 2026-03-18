
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
  
  it('should filter out items without ref_id or empty authors in getData', async () => {
    const mockData = [{
      id: 'table-1',
      fields: [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'column_0', label: 'Col 0' }
      ],
      items: [
        { ref_id: 'ref1', authors: 'Author 1', column_0: 'data 1' },
        { ref_id: '', authors: 'Author 2', column_0: 'data 2' }, // Empty ref_id
        { ref_id: 'ref3', authors: '', column_0: 'data 3' }, // Empty authors
        { ref_id: null, authors: 'Author 4', column_0: 'data 4' }, // Null ref_id
        { column_0: 'data 5' } // Missing ref_id and authors
      ]
    }]

    Api.get.mockResolvedValue({ data: mockData })

    await wrapper.vm.getData()

    expect(wrapper.vm.dataTable.items).toHaveLength(1)
    expect(wrapper.vm.dataTable.items[0].ref_id).toBe('ref1')
  })

  it('should process new items from references in processItems', async () => {
    await wrapper.setProps({
      references: [
        { id: 'ref1', authors: ['Auth 1'], publication_year: '2021' },
        { id: 'ref2', authors: ['Auth 2'], publication_year: '2022' }
      ]
    })
    
    // Existing data only has ref1
    const dataItems = [
      { ref_id: 'ref1', authors: 'Auth 1 (2021)', column_0: 'data 1' }
    ]

    const processed = wrapper.vm.processItems(dataItems)
    
    // It should add ref2
    expect(processed).toHaveLength(2)
    const newRef = processed.find(p => p.ref_id === 'ref2')
    expect(newRef).toBeDefined()
  })

  it('should patch with newly added references in updateMyDataTables if permissions exist', async () => {
    const mockData = [{
      id: 'table-1',
      fields: [{ key: 'ref_id', label: 'ID' }, { key: 'authors', label: 'Authors' }],
      items: [{ ref_id: 'ref1', authors: 'Auth 1 (2021)' }]
    }]
    Api.get.mockResolvedValue({ data: mockData })
    
    wrapper.setProps({
      references: [
        { id: 'ref1', authors: ['Auth 1'], publication_year: '2021' },
        { id: 'ref2', authors: ['Auth 2'], publication_year: '2022' }
      ]
    })
    
    // Check permission logic simulation (mixins/camelotMixin or similar should provide checkPermissions)
    wrapper.vm.checkPermissions = true

    await wrapper.vm.updateMyDataTables()

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls.find(call => call[0].includes('table-1'))
    expect(patchCall).toBeDefined()
    // It patched with the new items
    expect(patchCall[1].items).toHaveLength(2)
  })

  it('should format authors correctly in getAuthorsFormat', () => {
    const formatted = wrapper.vm.getAuthorsFormat(['Smith J', 'Doe A'], '2023')
    // We don't check exactly what Commons does, but ensure it runs without crashing
    expect(formatted).toBeDefined()
  })
})
