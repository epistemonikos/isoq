
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import * as xlsxExporter from '@/utils/xlsxExporter'
import { parseCSVData } from '@/utils/csvImporter'
import { parseXLSXData } from '@/utils/xlsxImporter'
import { loadFileAsText } from '@/utils/tableDataUtils'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/csvImporter', () => ({
  parseTableRows: jest.fn(),
  parseCSVData: jest.fn()
}))

jest.mock('@/utils/xlsxImporter', () => ({
  parseXLSXData: jest.fn()
}))

jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  // El real excluye ref_id/authors/actions (tableDataUtils.js:1). Un mock identidad
  // hace pasar tests que dependen de esas claves quedando fuera.
  filterDisplayFields: jest.fn(fields =>
    fields.filter(f => !['ref_id', 'authors', 'actions'].includes(f.key)))
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

  // Estos dos tests defendían lo contrario: que el payload de columnas llevara `items`
  // limpiados contra la copia local de `fields`. Eso era justamente el mecanismo de la
  // pérdida de datos — una copia obsoleta borraba la columna de otra persona en todas
  // las filas. Ahora `items` no viaja; la limpieza de claves huérfanas la hace el
  // backend en el DELETE granular. Ver crudTables.columnsPayload.spec.js.
  // Los tests de `updateDataTableFields` que había acá desaparecieron con el método: el modal
  // de edición ya no guarda en bloque, cada columna va por su endpoint granular. Que no se
  // manden `fields` completo ni `items` se cumple por construcción; la cobertura de las rutas
  // nuevas está en crudTables.granularColumns.spec.js.


  // Los tests de `saveDataTableFields` que había acá desaparecieron con el guardado en bloque.
  // El nacimiento del documento —con `fields` de sistema y una fila por referencia— ahora vive
  // en `columnService.ensureTableDocument` y se verifica en su propio spec; las columnas se
  // crean después, de a una, en crudTables.createColumns.spec.js.

  
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

  // Estos dos verificaban que `updateMyDataTables` ESCRIBIERA el documento completo para
  // sincronizar la tabla con las referencias. Esa escritura se eliminó: era la ruta que
  // pisaba la edición ajena y la que el servidor va a cerrar. La intención sigue siendo la
  // misma —que la tabla refleje las referencias— pero ahora se cumple derivando al mostrar.
  it('muestra una fila por referencia, incluida la que el documento no tiene', async () => {
    const mockData = [{
      id: 'table-1',
      fields: [{ key: 'ref_id', label: 'ID' }, { key: 'authors', label: 'Authors' }],
      items: [{ ref_id: 'ref1', authors: 'Auth 1 (2021)' }]
    }]
    Api.get.mockResolvedValue({ data: mockData })
    jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Formatted Author')

    await wrapper.setProps({
      references: [
        { id: 'ref1', authors: ['Auth 1'], publication_year: '2021' },
        { id: 'ref2', authors: ['Auth 2'], publication_year: '2022' }
      ]
    })
    Api.patch.mockClear()

    await wrapper.vm.updateMyDataTables()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.vm.dataTable.items).toHaveLength(2)
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('deja la tabla vacía cuando ya no hay referencias, sin escribir', async () => {
    const mockData = [{
      id: 'table-1',
      fields: [{ key: 'ref_id', label: 'ID' }, { key: 'authors', label: 'Authors' }],
      items: [{ ref_id: 'ref1', authors: 'Auth 1 (2021)' }]
    }]
    Api.get.mockResolvedValue({ data: mockData })
    Api.patch.mockClear()

    // `references` ya viene en [] del propsData por defecto.
    await wrapper.vm.updateMyDataTables()
    await new Promise(resolve => setTimeout(resolve, 0))

    expect(wrapper.vm.dataTable.items).toHaveLength(0)
    expect(Api.patch).not.toHaveBeenCalled()
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

  describe('granular content save (per-row /item/ sub-resource)', () => {
    const editedRow = { ref_id: 'ref2', authors: 'Author B 2021', column_0: 'edited data' }
    const otherRow = { ref_id: 'ref1', authors: 'Author A 2020', column_0: 'untouched' }

    const setupModal = () => wrapper.setData({
      dataTable: { id: 'table-1' },
      dataTableFieldsModal: {
        ...wrapper.vm.dataTableFieldsModal,
        items: [otherRow, editedRow],
        selected_item_index: 1
      }
    })

    it('performAutoSave PATCHes only the edited row to /<type>/<id>/item/<ref_id>', async () => {
      setupModal()
      Api.patch.mockClear()

      await wrapper.vm.performAutoSave()

      expect(Api.patch).toHaveBeenCalledWith(
        '/isoqf_characteristics/table-1/item/ref2',
        expect.objectContaining({ ref_id: 'ref2', column_0: 'edited data' })
      )
    })

    it('saveContentDataTable PATCHes only the edited row to /<type>/<id>/item/<ref_id>', async () => {
      wrapper.vm.$refs = { 'edit-content-dataTable': { hide: jest.fn() } }
      setupModal()
      Api.patch.mockClear()

      await wrapper.vm.saveContentDataTable()

      expect(Api.patch).toHaveBeenCalledWith(
        '/isoqf_characteristics/table-1/item/ref2',
        expect.objectContaining({ ref_id: 'ref2', column_0: 'edited data' })
      )
    })

    it('does not rewrite the whole items array (no Last-Write-Wins on other rows)', async () => {
      setupModal()
      Api.patch.mockClear()

      await wrapper.vm.performAutoSave()

      const payload = Api.patch.mock.calls[0][1]
      expect(payload.items).toBeUndefined()
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
      xlsxExporter.exportAOAToXLSX.mockClear()
    })

    it('calls exportAOAToXLSX with header row and reference data rows', async () => {
      await wrapper.setData({
        refs: [
          { id: '1', content: 'Smith 2020; extra info' },
          { id: '2', content: 'Jones 2021' }
        ]
      })

      await wrapper.vm.generateTemplate()

      expect(xlsxExporter.exportAOAToXLSX).toHaveBeenCalledTimes(1)
      const [rows, filename] = xlsxExporter.exportAOAToXLSX.mock.calls[0]

      expect(rows[0]).toHaveLength(2)
      expect(rows[1]).toEqual(['1', 'Smith 2020'])
      expect(rows[2]).toEqual(['2', 'Jones 2021'])
      expect(filename).toBe('my_data')
    })
  })

  describe('loadTableImportData', () => {
    const parsedResult = {
      error: null,
      fields: [
        { key: 'ref_id', label: 'Ref ID' },
        { key: 'authors', label: 'Author' },
        { key: 'column_0', label: 'Country' }
      ],
      fieldsObj: [{ key: 'column_0', label: 'Country' }],
      items: [{ ref_id: '1', authors: 'Smith 2020', column_0: 'Chile' }]
    }

    function makeEvent (filename) {
      return { target: { files: [new File([''], filename)] } }
    }

    beforeEach(() => {
      parseXLSXData.mockReset()
      parseCSVData.mockReset()
      loadFileAsText.mockReset()
    })

    it('routes .xlsx files to parseXLSXData and updates importDataTable', async () => {
      parseXLSXData.mockResolvedValue(parsedResult)

      await wrapper.vm.loadTableImportData(makeEvent('data.xlsx'))

      expect(parseXLSXData).toHaveBeenCalled()
      expect(parseCSVData).not.toHaveBeenCalled()
      expect(wrapper.vm.importDataTable.items).toEqual(parsedResult.items)
      expect(wrapper.vm.importDataTable.fields).toEqual(parsedResult.fields)
    })

    it('routes .csv files to parseCSVData and updates importDataTable', async () => {
      loadFileAsText.mockResolvedValue('Ref ID,Author,Country\n1,Smith 2020,Chile')
      parseCSVData.mockReturnValue(parsedResult)

      await wrapper.vm.loadTableImportData(makeEvent('data.csv'))

      expect(parseCSVData).toHaveBeenCalled()
      expect(parseXLSXData).not.toHaveBeenCalled()
      expect(wrapper.vm.importDataTable.items).toEqual(parsedResult.items)
    })

    it('sets importDataTable.error when parse returns an error', async () => {
      parseXLSXData.mockResolvedValue({
        error: 'Format error', fields: [], items: [], fieldsObj: []
      })

      await wrapper.vm.loadTableImportData(makeEvent('bad.xlsx'))

      expect(wrapper.vm.importDataTable.error).toBe('Format error')
    })

    it('does nothing when no file is selected', async () => {
      await wrapper.vm.loadTableImportData({ target: { files: [] } })

      expect(parseXLSXData).not.toHaveBeenCalled()
      expect(parseCSVData).not.toHaveBeenCalled()
    })
  })
})
