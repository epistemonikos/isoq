import { shallowMount, createLocalVue } from '@vue/test-utils'
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
})
