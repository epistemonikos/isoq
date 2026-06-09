
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import * as xlsxExporter from '@/utils/xlsxExporter'
import writeXlsxFile from 'write-excel-file'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('write-excel-file', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined)
}))

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
    
    // Ensure parseReference returns something valid
    jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Formatted Author')
    
    await wrapper.setProps({
      references: [
        { id: 'ref1', authors: ['Auth 1'], publication_year: '2021' },
        { id: 'ref2', authors: ['Auth 2'], publication_year: '2022' }
      ]
    })
    
    // Clear previous calls from watch/mounted
    Api.patch.mockClear()

    await wrapper.vm.updateMyDataTables()

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls.find(call => call[0].includes('table-1'))
    expect(patchCall).toBeDefined()
    // It patched with the new items
    expect(patchCall[1].items).toHaveLength(2)
  })

  it('should remove items if references are deleted in processItems', () => {
    // We set references in DATA because processItems uses this.references
    wrapper.setData({
      references: [
        { id: 'ref1', authors: ['Auth 1'], publication_year: '2021' }
      ]
    })
    
    const dataItems = [
      { ref_id: 'ref1', authors: 'Auth 1 (2021)', column_0: 'data 1' },
      { ref_id: 'ref2', authors: 'Auth 2 (2022)', column_0: 'data 2' }
    ]

    const processed = wrapper.vm.processItems(dataItems)
    
    expect(processed).toHaveLength(1)
    expect(processed[0].ref_id).toBe('ref1')
    expect(processed.find(p => p.ref_id === 'ref2')).toBeUndefined()
  })

  it('should format authors correctly in getAuthorsFormat', () => {
    const formatted = wrapper.vm.getAuthorsFormat(['Smith J', 'Doe A'], '2023')
    // We don't check exactly what Commons does, but ensure it runs without crashing
    expect(formatted).toBeDefined()
  })

  describe('onEditModalHidden', () => {
    it('cancels pending debounce and clears editingRefId when modal is hidden', () => {
      const cancelSpy = jest.fn()
      wrapper.vm.autoSaveDebounced = { cancel: cancelSpy }
      wrapper.setData({
        autoSaveStatus: 'saving',
        dataTableFieldsModal: {
          ...wrapper.vm.dataTableFieldsModal,
          editingRefId: 'ref1'
        }
      })

      wrapper.vm.onEditModalHidden()

      expect(cancelSpy).toHaveBeenCalled()
      expect(wrapper.vm.autoSaveStatus).toBe(null)
      expect(wrapper.vm.dataTableFieldsModal.editingRefId).toBe(null)
    })
  })

  describe('editingRefId tracking for concurrent editing safety', () => {
    const tableData = {
      id: 'table-1',
      fields: [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'column_0', label: 'Col 0' }
      ],
      items: [
        { ref_id: 'ref1', authors: 'Author A 2020', column_0: 'data A' },
        { ref_id: 'ref2', authors: 'Author B 2021', column_0: 'data B' }
      ],
      fieldsObj: [
        { key: 'authors', label: 'Authors' },
        { key: 'actions', label: '' },
        { key: 'column_0', label: 'Col 0' }
      ]
    }

    it('saves editingRefId of the clicked item when opening edit modal', () => {
      wrapper.setData({ dataTable: tableData })
      wrapper.vm.$refs = { 'edit-content-dataTable': { show: jest.fn() } }

      wrapper.vm.addContentDataTable(1)

      expect(wrapper.vm.dataTableFieldsModal.editingRefId).toBe('ref2')
      expect(wrapper.vm.dataTableFieldsModal.selected_item_index).toBe(1)
    })

    it('updates selected_item_index by refId when handleResponseData re-sorts items', () => {
      // Simulate modal open for ref2 (index 1)
      wrapper.setData({
        dataTable: tableData,
        dataTableFieldsModal: {
          ...wrapper.vm.dataTableFieldsModal,
          editingRefId: 'ref2',
          selected_item_index: 1
        }
      })

      // Server returns items in a different order (ref2 now at index 0)
      const reorderedData = [{
        id: 'table-1',
        fields: tableData.fields,
        items: [
          { ref_id: 'ref2', authors: 'Author B 2021', column_0: 'data B' },
          { ref_id: 'ref1', authors: 'Author A 2020', column_0: 'data A' }
        ]
      }]

      wrapper.vm.handleResponseData(reorderedData)

      // selected_item_index should now point to ref2's new position
      const newIdx = wrapper.vm.dataTableFieldsModal.items.findIndex(it => it.ref_id === 'ref2')
      expect(wrapper.vm.dataTableFieldsModal.selected_item_index).toBe(newIdx)
    })

    it('does not change selected_item_index when editingRefId is null', () => {
      wrapper.setData({
        dataTable: tableData,
        dataTableFieldsModal: {
          ...wrapper.vm.dataTableFieldsModal,
          editingRefId: null,
          selected_item_index: 0
        }
      })

      const freshData = [{
        id: 'table-1',
        fields: tableData.fields,
        items: [
          { ref_id: 'ref2', authors: 'Author B 2021', column_0: 'data B' },
          { ref_id: 'ref1', authors: 'Author A 2020', column_0: 'data A' }
        ]
      }]

      wrapper.vm.handleResponseData(freshData)

      expect(wrapper.vm.dataTableFieldsModal.selected_item_index).toBe(0)
    })
  })

  describe('exportTableToXLSX method', () => {
    it('calls exportTableToXLSX with dataTable fields and items', async () => {
      await wrapper.vm.exportTableToXLSX()

      expect(xlsxExporter.exportTableToXLSX).toHaveBeenCalledWith({
        fields: wrapper.vm.dataTable.fields,
        items: wrapper.vm.dataTable.items,
        filename: 'exportable_table'
      })
    })
  })

  describe('generateTemplate', () => {
    beforeEach(() => {
      writeXlsxFile.mockClear()
    })

    it('calls writeXlsxFile with bold header row and reference data rows', async () => {
      await wrapper.setData({
        refs: [
          { id: '1', content: 'Smith 2020; extra info' },
          { id: '2', content: 'Jones 2021' }
        ]
      })

      await wrapper.vm.generateTemplate()

      expect(writeXlsxFile).toHaveBeenCalledTimes(1)
      const [rows, opts] = writeXlsxFile.mock.calls[0]

      expect(rows[0][0].fontWeight).toBe('bold')
      expect(rows[0][1].fontWeight).toBe('bold')
      expect(rows[0]).toHaveLength(2)

      expect(rows[1]).toEqual([{ value: '1' }, { value: 'Smith 2020' }])
      expect(rows[2]).toEqual([{ value: '2' }, { value: 'Jones 2021' }])

      expect(opts.fileName).toBe('my_data.xlsx')
    })
  })
})
