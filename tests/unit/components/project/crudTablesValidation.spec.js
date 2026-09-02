
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/xlsxImporter', () => ({
  parseXLSXData: jest.fn()
}))

jest.mock('@/utils/csvImporter', () => ({
  parseTableRows: jest.fn(),
  parseCSVData: jest.fn()
}))

jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  // El real excluye ref_id/authors/actions (tableDataUtils.js:1). Un mock identidad
  // hace pasar tests que dependen de esas claves quedando fuera.
  filterDisplayFields: jest.fn(fields =>
    fields.filter(f => !['ref_id', 'authors', 'actions'].includes(f.key)))
}))

jest.mock('@/utils/Api', () => {
  const mock = {
    get: jest.fn(() => Promise.resolve({ data: [] })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: { '$set': { fields: [] } } })),
    delete: jest.fn(() => Promise.resolve({ data: {} }))
  }
  mock.default = mock
  return mock
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('crudTables.vue Validation and Fixes', () => {
  let wrapper
  let mocks

  beforeEach(() => {
    mocks = {
      $t: (msg) => msg,
      $route: {
        params: {
          id: 'project-123',
          org_id: 'org-456'
        }
      },
      $set: (obj, key, val) => { obj[key] = val }
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
        lists: []
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

  describe('Validation Logic', () => {
    it('should identify dataTableFieldsModal as invalid if any field is empty', async () => {
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: ['Valid Column', ''],
          nroColumns: 2
        }
      })
      expect(wrapper.vm.isDataTableFieldsModalInvalid).toBe(true)

      await wrapper.setData({
        dataTableFieldsModal: {
          fields: ['Valid Column', 'Another Valid'],
          nroColumns: 2
        }
      })
      expect(wrapper.vm.isDataTableFieldsModalInvalid).toBe(false)

      // nroColumns is 2 but second field was never typed (array slot absent)
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: ['Valid Column'],
          nroColumns: 2
        }
      })
      expect(wrapper.vm.isDataTableFieldsModalInvalid).toBe(true)
    })

    it('should identify dataTableFieldsModalEdit as invalid if any field label is empty', async () => {
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [
            { key: 'column_0', label: 'Valid' },
            { key: 'column_1', label: '' }
          ]
        }
      })
      expect(wrapper.vm.isDataTableFieldsModalEditInvalid).toBe(true)

      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [
            { key: 'column_0', label: 'Valid' },
            { key: 'column_1', label: 'Also Valid' }
          ]
        }
      })
      expect(wrapper.vm.isDataTableFieldsModalEditInvalid).toBe(false)
    })

    it('should return correct fieldState based on touched and value (create mode)', async () => {
      // Not touched yet
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: [''],
          touched: [false]
        }
      })
      expect(wrapper.vm.fieldState('create', 0)).toBe(null)

      // Touched and empty
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: [''],
          touched: [true]
        }
      })
      expect(wrapper.vm.fieldState('create', 0)).toBe(false)

      // Touched and valid
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: ['Some Name'],
          touched: [true]
        }
      })
      expect(wrapper.vm.fieldState('create', 0)).toBe(true)
    })

    it('should return correct fieldState based on touched and value (edit mode)', async () => {
      // Not touched yet
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [{ label: '' }],
          touched: [false]
        }
      })
      expect(wrapper.vm.fieldState('edit', 0)).toBe(null)

      // Touched and empty
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [{ label: '' }],
          touched: [true]
        }
      })
      expect(wrapper.vm.fieldState('edit', 0)).toBe(false)

      // Touched and valid
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [{ label: 'Updated Name' }],
          touched: [true]
        }
      })
      expect(wrapper.vm.fieldState('edit', 0)).toBe(true)
    })

    it('should not throw when value is a non-string (regression: val.trim is not a function)', async () => {
      // Create mode: a numeric column label (e.g. loaded from backend as a number)
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: [2024],
          touched: [true]
        }
      })
      expect(() => wrapper.vm.fieldState('create', 0)).not.toThrow()
      expect(wrapper.vm.fieldState('create', 0)).toBe(false)

      // Edit mode: a field whose label is a number
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [{ label: 2024 }],
          touched: [true]
        }
      })
      expect(() => wrapper.vm.fieldState('edit', 0)).not.toThrow()
      expect(wrapper.vm.fieldState('edit', 0)).toBe(false)
    })
  })

  // Los tests del borrado en bloque (`deleteFieldFromCharsSudies`) se retiraron con el método:
  // el modal de creación ahora borra por clave con `confirmDeleteColumnCreate`, y su cobertura
  // está en crudTables.createColumns.spec.js.

})
