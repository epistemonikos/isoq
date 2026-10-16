import { shallowMount, mount, createLocalVue } from '@vue/test-utils'
import CamelotAssessmentSummaryTable from '@/components/camelot/assessment/CamelotAssessmentSummaryTable.vue'
import BootstrapVue from 'bootstrap-vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.component('font-awesome-icon', FontAwesomeIcon)

describe('CamelotAssessmentSummaryTable.vue', () => {
  let wrapper
  const assessments = {
    items: [
      {
        ref_id: '1',
        authors: 'Author 1',
        stages: [
          { options: [{ option: 'A', text: 'T1' }, { option: 'B', text: 'T2' }, { option: 'C', text: 'T3' }, { option: 'D', text: 'T4' }] },
          { options: [{ option: 'A', text: 'T5' }, { option: 'B', text: 'T6' }, { option: 'C', text: 'T7' }, { option: 'D', text: 'T8' }] },
          { options: [{ option: 'A', text: 'T9' }] },
          { options: [{ option: 'A', text: 'Overall' }] }
        ]
      }
    ]
  }

  const $t = (key) => key

  beforeEach(() => {
    wrapper = shallowMount(CamelotAssessmentSummaryTable, {
      localVue,
      propsData: { assessments },
      mocks: { $t },
      stubs: {
        'b-table': {
          template: '<div><slot name="cell(actions)" :item="items[0]" :toggleDetails="toggleDetails" :detailsShowing="false" /><slot name="row-details" :item="items[0]" /></div>',
          props: ['items', 'fields'],
          methods: {
            toggleDetails: jest.fn()
          }
        },
        'b-table-simple': true,
        'b-tbody': true,
        'b-tr': true,
        'b-td': true
      }
    })
  })

  it('keeps all table columns regardless of visibleAssessments', async () => {
    // Inicialmente todos están visibles
    expect(wrapper.vm.fields.length).toBe(12)

    // Filtramos
    await wrapper.setData({ visibleAssessments: ['0-0'] })
    
    // Las columnas de la tabla principal NO deben cambiar
    expect(wrapper.vm.fields.length).toBe(12)
    const visibleFieldKeys = wrapper.vm.fields.map(f => f.key)
    expect(visibleFieldKeys).toContain('fa2')
    expect(visibleFieldKeys).toContain('fa9')
  })

  it('filters activeStages in row-details based on visibleAssessments', async () => {
    // Filtramos para ver solo una evaluación del primer grupo (0-0)
    await wrapper.setData({ visibleAssessments: ['0-0'] })
    
    // activeStages debe contener solo el índice 0
    expect(wrapper.vm.activeStages).toEqual([0])

    // Filtramos para ver una del grupo 0 y otra del grupo 3
    await wrapper.setData({ visibleAssessments: ['0-0', '3-0'] })
    expect(wrapper.vm.activeStages).toEqual([0, 3])
  })

  it('resets filters and closes other rows when individual Show button is clicked', async () => {
    // Simulamos que hay filtros activos y varios ítems
    const items = [
      { ref_id: '1', authors: 'A1', _showDetails: true },
      { ref_id: '2', authors: 'A2', _showDetails: false }
    ]
    await wrapper.setProps({ assessments: { items } })
    await wrapper.setData({ visibleAssessments: ['0-0'], allVisible: false })
    
    // Obtenemos el botón de toggle para el SEGUNDO ítem
    const dataMock = { 
      item: items[1], 
      toggleDetails: jest.fn(),
      detailsShowing: false 
    }
    
    wrapper.vm.handleToggleDetails(dataMock)
    await wrapper.vm.$nextTick()
    
    // Debe resetear filtros
    expect(wrapper.vm.allVisible).toBe(true)
    
    // Debe cerrar el primer ítem
    expect(items[0]._showDetails).toBe(false)
    
    // Debe llamar al toggle del ítem actual
    expect(dataMock.toggleDetails).toHaveBeenCalled()
  })

  it('toggles all rows when global filter dropdown is clicked', async () => {
    const items = [
      { ref_id: '1', _showDetails: false },
      { ref_id: '2', _showDetails: false }
    ]
    await wrapper.setProps({ assessments: { items } })
    
    // Al abrir el dropdown por primera vez (ninguno abierto) -> debe abrir todos
    wrapper.vm.handleFilterDropdownShow()
    expect(items[0]._showDetails).toBe(true)
    expect(items[1]._showDetails).toBe(true)
    
    // Al abrir el dropdown cuando ya hay abiertos -> debe cerrar todos
    wrapper.vm.handleFilterDropdownShow()
    expect(items[0]._showDetails).toBe(false)
    expect(items[1]._showDetails).toBe(false)
  })

  it('hides header and actions column when hideActions prop is true', async () => {
    await wrapper.setProps({ hideActions: true })
    
    // Header section should be hidden
    expect(wrapper.find('.d-flex.justify-content-between.align-items-center.mb-3').exists()).toBe(false)
    
    // Actions column should be removed from fields
    const visibleFieldKeys = wrapper.vm.fields.map(f => f.key)
    expect(visibleFieldKeys).not.toContain('actions')
    
    // Top row should not have the extra empty th
    expect(wrapper.find('th.border-bottom-0.bg-grey-light[v-if="!hideActions"]').exists()).toBe(false)
  })

  it('filters and expands all rows when a header is clicked and clickableHeaders is true', async () => {
    await wrapper.setProps({ clickableHeaders: true })
    
    // Simular clic en la cabecera FA1 (assessmentKey '0-0')
    wrapper.vm.handleHeaderClick('0-0')
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.visibleAssessments).toEqual(['0-0'])
    expect(wrapper.vm.allVisible).toBe(false)
    expect(wrapper.vm.tableItems.every(item => item._showDetails)).toBe(true)
  })

  it('resets table state correctly using resetTableState method', async () => {
    // Estado alterado
    await wrapper.setData({ visibleAssessments: ['0-0'], allVisible: false })
    wrapper.vm.expandAllDetails(true)

    wrapper.vm.resetTableState()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.allVisible).toBe(true)
    expect(wrapper.vm.visibleAssessments.length).toBe(wrapper.vm.allAssessmentValues.length)
    expect(wrapper.vm.tableItems.every(item => !item._showDetails)).toBe(true)
  })

  describe('filter dropdown (#391)', () => {
    function mountWithFilter () {
      return mount(CamelotAssessmentSummaryTable, {
        localVue,
        propsData: { assessments: JSON.parse(JSON.stringify(assessments)), clickableHeaders: true },
        mocks: { $t },
        stubs: {
          'b-table': { template: '<div></div>', props: ['items', 'fields'] },
          'b-sidebar': true,
          'font-awesome-icon': true
        }
      })
    }

    const radios = w => w.findAll('#dropdown-filter-assessments input[type="radio"]')
    const radioLabels = w => w.findAll('#dropdown-filter-assessments .custom-radio label')
      .wrappers.map(l => l.text())

    it('offers one radio per assessment plus Show all, and no checkboxes', () => {
      const w = mountWithFilter()
      expect(radios(w).length).toBe(11)
      expect(w.findAll('#dropdown-filter-assessments input[type="checkbox"]').length).toBe(0)
    })

    it('labels the radios Show all, FA 1 to FA 9 and OA, in that order', () => {
      expect(radioLabels(mountWithFilter())).toEqual([
        'common.show_all',
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `camelot.step_four.filter_options.fa${n}`),
        'camelot.step_four.filter_options.oa'
      ])
    })

    it('starts on Show all', () => {
      const w = mountWithFilter()
      expect(radios(w).at(0).element.checked).toBe(true)
    })

    it('shows only the chosen assessment when a radio is picked', async () => {
      const w = mountWithFilter()
      await radios(w).at(3).setChecked() // FA 3
      expect(w.vm.visibleAssessments).toEqual(['0-2'])
      expect(w.vm.activeStages).toEqual([0])
    })

    it('maps FA 9 and OA to their stages', async () => {
      const w = mountWithFilter()
      await radios(w).at(9).setChecked()
      expect(w.vm.visibleAssessments).toEqual(['2-0'])
      await radios(w).at(10).setChecked()
      expect(w.vm.visibleAssessments).toEqual(['3-0'])
    })

    it('goes back to every assessment when Show all is picked', async () => {
      const w = mountWithFilter()
      await radios(w).at(5).setChecked()
      await radios(w).at(0).setChecked()
      expect(w.vm.visibleAssessments).toEqual(w.vm.allAssessmentValues)
    })

    it('checks the matching radio when a column header is clicked', async () => {
      const w = mountWithFilter()
      w.vm.handleHeaderClick('1-0') // FA 5
      await w.vm.$nextTick()
      expect(radios(w).at(5).element.checked).toBe(true)
      expect(radios(w).at(0).element.checked).toBe(false)
    })

    it('positions the menu against the visible viewport so the scrollable modal body cannot clip it', () => {
      const dropdown = mountWithFilter().findComponent({ name: 'BDropdown' })
      expect(dropdown.props('boundary')).toBe('viewport')
      expect(dropdown.props('popperOpts')).toEqual(expect.objectContaining({ positionFixed: true }))
    })

    // Popper measures the menu while it still sits in the narrow modal; without a
    // width of its own the menu widened after being placed and ran off the right edge.
    it('gives the menu a width that does not depend on where it is positioned', () => {
      const menu = mountWithFilter().find('#dropdown-filter-assessments .dropdown-menu')
      expect(menu.classes()).toContain('modal-safe-menu')
    })
  })

  describe('empty explanation feedback in row-details', () => {
    function createWrapperWithSlotContent (assessmentData) {
      return shallowMount(CamelotAssessmentSummaryTable, {
        localVue,
        propsData: { assessments: assessmentData },
        mocks: { $t: key => key },
        stubs: {
          'b-table': {
            template: '<div><slot name="row-details" :item="items[0]" /></div>',
            props: ['items', 'fields']
          },
          'b-table-simple': { template: '<table><slot /></table>' },
          'b-tbody': { template: '<tbody><slot /></tbody>' },
          'b-tr': { template: '<tr><slot /></tr>' },
          'b-td': { template: '<td><slot /></td>' },
          'b-sidebar': true
        }
      })
    }

    it('shows explanation text when option.text is present', () => {
      const w = createWrapperWithSlotContent({
        items: [{
          ref_id: '1',
          authors: 'A',
          stages: [{ options: [{ option: 'B', text: 'My explanation' }] }]
        }]
      })
      expect(w.html()).toContain('My explanation')
      expect(w.html()).not.toContain('worksheet.labels.explanation_not_added')
    })

    it('shows warning when option is selected but text is empty', () => {
      const w = createWrapperWithSlotContent({
        items: [{
          ref_id: '1',
          authors: 'A',
          stages: [{ options: [{ option: 'B', text: '' }] }]
        }]
      })
      expect(w.html()).toContain('worksheet.labels.explanation_not_added')
    })

    it('does not show warning when option is not selected', () => {
      const w = createWrapperWithSlotContent({
        items: [{
          ref_id: '1',
          authors: 'A',
          stages: [{ options: [{ option: null, text: '' }] }]
        }]
      })
      expect(w.html()).not.toContain('worksheet.labels.explanation_not_added')
    })
  })

  describe('missing-explanation circle', () => {
    function mountWithCell (option, text) {
      const items = JSON.parse(JSON.stringify(assessments))
      items.items[0].stages[0].options[0] = { option, text }
      // mount, not shallowMount: the circle is a child component now, and a
      // stubbed child renders nothing to assert on.
      return mount(CamelotAssessmentSummaryTable, {
        localVue,
        propsData: { assessments: items },
        mocks: { $t },
        stubs: {
          'b-table': {
            template: '<div><slot name="cell(fa1)" :item="items[0]" /></div>',
            props: ['items', 'fields']
          },
          'font-awesome-icon': { template: '<i class="fa-stub"></i>' }
        }
      })
    }

    it('flags an assessment without an explanation', () => {
      const circle = mountWithCell('A', '').find('.assessment-circle.circle-incomplete')
      expect(circle.exists()).toBe(true)
      expect(circle.find('.fa-stub').exists()).toBe(true)
    })

    it('keeps the response text in the tooltip and appends the warning', () => {
      expect(mountWithCell('A', '').find('.assessment-circle').attributes('title'))
        .toBe('camelot.responses.no_minimal — camelot.step_four.no_explanation')
    })

    it('leaves a complete assessment filled', () => {
      expect(mountWithCell('A', 'why').find('.assessment-circle.circle-incomplete').exists()).toBe(false)
    })
  })
})
