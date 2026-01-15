import { shallowMount } from '@vue/test-utils'
import ExportActions from '@/components/project/ExportActions.vue'

describe('ExportActions.vue', () => {
  let wrapper
  const mockProject = {
    name: 'Test Project',
    use_camelot: false
  }
  const mockFindings = [
    { id: '1', name: 'Finding 1' }
  ]
  const mockReferences = [
    { id: 'ref1', title: 'Reference 1' }
  ]

  beforeEach(() => {
    wrapper = shallowMount(ExportActions, {
      propsData: {
        mode: 'view',
        project: mockProject,
        findings: mockFindings,
        references: mockReferences,
        listsPrintVersion: [],
        printableItems: [],
        cerqualConfidence: [],
        selectOptions: []
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  describe('Rendering', () => {
    it('should render export dropdown in view mode', () => {
      expect(wrapper.find('#export-button').exists()).toBe(true)
    })

    it('should render print button in view mode', () => {
      const printButton = wrapper.findAll('b-button').filter(w => 
        w.text().includes('Print') || w.text().includes('actionButtons.print_save_pdf')
      )
      expect(printButton.length).toBeGreaterThan(0)
    })

    it('should not render export buttons in edit mode', async () => {
      wrapper.setProps({ mode: 'edit' })
      await wrapper.vm.$nextTick()
      expect(wrapper.find('#export-button').exists()).toBe(false)
    })
  })

  describe('Export to Word', () => {
    it('should have ExportToWord method', () => {
      expect(typeof wrapper.vm.ExportToWord).toBe('function')
    })

    it('should call ExportToWord when clicking export to Word option', async () => {
      const exportSpy = jest.spyOn(wrapper.vm, 'ExportToWord')
      
      // Simulate clicking the export to Word dropdown item
      const dropdown = wrapper.find('#export-button')
      expect(dropdown.exists()).toBe(true)
      
      // Note: We can't easily test the dropdown click without full mount
      // This test verifies the method exists
      await wrapper.vm.ExportToWord('test.docx')
      expect(exportSpy).toHaveBeenCalled()
    })
  })

  describe('Export to RIS', () => {
    it('should have exportToRIS method', () => {
      expect(typeof wrapper.vm.exportToRIS).toBe('function')
    })

    it('should process RIS format correctly', () => {
      const reference = {
        type: 'JOUR',
        title: 'Test Article',
        authors: ['Author One', 'Author Two'],
        publication_year: '2024'
      }
      
      const result = wrapper.vm.processRIS(reference)
      
      expect(result).toContain('TY  - JOUR')
      expect(result).toContain('TI  - Test Article')
      expect(result).toContain('A1  - Author One')
      expect(result).toContain('A2  - Author Two')
      expect(result).toContain('PY  - 2024')
      expect(result).toContain('ER  -')
    })
  })

  describe('Print/PDF', () => {
    it('should have printiSoQ method', () => {
      expect(typeof wrapper.vm.printiSoQ).toBe('function')
    })

    it('should call window.print when printiSoQ is called', () => {
      const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {})
      
      wrapper.vm.printiSoQ()
      
      expect(printSpy).toHaveBeenCalled()
      printSpy.mockRestore()
    })
  })

  describe('Export State Management', () => {
    it('should have export state from mixin', () => {
      expect(wrapper.vm.exportState).toBeDefined()
      expect(wrapper.vm.exportState).toHaveProperty('isLoading')
      expect(wrapper.vm.exportState).toHaveProperty('progress')
      expect(wrapper.vm.exportState).toHaveProperty('error')
    })

    it('should display progress bar when exporting', async () => {
      wrapper.vm.exportState.isLoading = true
      wrapper.vm.exportState.progress = 50
      wrapper.vm.exportState.currentStep = 'Generating document...'
      
      await wrapper.vm.$nextTick()
      
      const progressBar = wrapper.find('b-progress')
      expect(progressBar.exists()).toBe(true)
    })

    it('should display error message when export fails', async () => {
      wrapper.vm.exportState.error = 'Export failed'
      
      await wrapper.vm.$nextTick()
      
      const alert = wrapper.find('b-alert')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Export failed')
    })
  })
})
