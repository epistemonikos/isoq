
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'

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
  })

  describe('Missing Method Fix (deleteFieldFromCharsSudies)', () => {
    it('should exist in the component', () => {
      expect(typeof wrapper.vm.deleteFieldFromCharsSudies).toBe('function')
    })

    it('should correctly update modal state when a field is deleted', async () => {
      // Setup initial state for modal
      await wrapper.setData({
        dataTableFieldsModal: {
          fields: ['Col 1', 'Col 2', 'Col 3'],
          touched: [true, true, true],
          nroColumns: 3
        },
        dataTable: { id: 'table-123' }
      })

      // Mock Api.patch to avoid actual network call
      const Api = require('@/utils/Api').default
      jest.spyOn(Api, 'patch').mockResolvedValue({ data: {} })

      // Delete "Col 2" (index 1)
      await wrapper.vm.deleteFieldFromCharsSudies(1)

      expect(wrapper.vm.dataTableFieldsModal.fields).toEqual(['Col 1', 'Col 3'])
      expect(wrapper.vm.dataTableFieldsModal.touched).toEqual([true, true])
      expect(wrapper.vm.dataTableFieldsModal.nroColumns).toBe(2)
    })
  })

  describe('dataTableNewColumn', () => {
    it('should initialize touched flag for the new column', async () => {
      await wrapper.setData({
        dataTableFieldsModalEdit: {
          fields: [{ key: 'column_0', label: 'First' }],
          touched: [true]
        }
      })

      wrapper.vm.dataTableNewColumn()

      expect(wrapper.vm.dataTableFieldsModalEdit.fields).toHaveLength(2)
      expect(wrapper.vm.dataTableFieldsModalEdit.touched).toHaveLength(2)
      expect(wrapper.vm.dataTableFieldsModalEdit.touched[1]).toBe(false)
    })
  })
})
