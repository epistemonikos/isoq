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

  it('keeps all table columns regardless of the selected assessment', async () => {
    expect(wrapper.vm.fields.length).toBe(12)
    await wrapper.setData({ selectedAssessment: '0-0' })
    // The filter narrows the row details, never the columns of the main table.
    expect(wrapper.vm.fields.length).toBe(12)
    const visibleFieldKeys = wrapper.vm.fields.map(f => f.key)
    expect(visibleFieldKeys).toContain('fa2')
    expect(visibleFieldKeys).toContain('fa9')
  })

  it('narrows activeStages in row-details to the selected assessment', async () => {
    await wrapper.setData({ selectedAssessment: '0-0' })
    expect(wrapper.vm.activeStages).toEqual([0])
    await wrapper.setData({ selectedAssessment: '3-0' })
    expect(wrapper.vm.activeStages).toEqual([3])
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

  describe('filter dropdown (#391)', () => {
    const twoStudies = () => ({
      items: [
        { ref_id: '1', authors: 'A1', stages: assessments.items[0].stages },
        { ref_id: '2', authors: 'A2', stages: assessments.items[0].stages }
      ]
    })

    function mountWithFilter (data = twoStudies()) {
      return mount(CamelotAssessmentSummaryTable, {
        localVue,
        propsData: { assessments: data, clickableHeaders: true },
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
    const shown = w => w.vm.tableItems.map(item => item._showDetails)
    const pick = (w, index) => radios(w).at(index).setChecked()
    // Order of the radios: Show all, Hide all, FA 1 … FA 9, OA.
    const FA = n => n + 1
    const OA = 11

    it('offers Show all, Hide all and one radio per assessment, and no checkboxes', () => {
      const w = mountWithFilter()
      expect(radios(w).length).toBe(12)
      expect(w.findAll('#dropdown-filter-assessments input[type="checkbox"]').length).toBe(0)
    })

    it('labels the radios Show all, Hide all, FA 1 to FA 9 and OA, in that order', () => {
      expect(radioLabels(mountWithFilter())).toEqual([
        'common.show_all',
        'common.hide_all',
        ...[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `camelot.step_four.filter_options.fa${n}`),
        'camelot.step_four.filter_options.oa'
      ])
    })

    // Details appear only once the person applies a filter; the radio says so.
    it('starts on Hide all with the details of every study hidden', async () => {
      const w = mountWithFilter()
      await w.vm.$nextTick()
      expect(radios(w).at(1).element.checked).toBe(true)
      expect(shown(w)).toEqual([false, false])
    })

    it('shows every detail once Show all is picked', async () => {
      const w = mountWithFilter()
      await pick(w, 0)
      expect(shown(w)).toEqual([true, true])
      expect(w.vm.activeStages).toEqual([0, 1, 2, 3])
    })

    it('shows only the chosen assessment, in every study, when a radio is picked', async () => {
      const w = mountWithFilter()
      await pick(w, FA(3))
      expect(w.vm.visibleAssessments).toEqual(['0-2'])
      expect(w.vm.activeStages).toEqual([0])
      expect(shown(w)).toEqual([true, true])
    })

    it('maps FA 9 and OA to their stages', async () => {
      const w = mountWithFilter()
      await pick(w, FA(9))
      expect(w.vm.visibleAssessments).toEqual(['2-0'])
      await pick(w, OA)
      expect(w.vm.visibleAssessments).toEqual(['3-0'])
    })

    it('hides the details of every study with Hide all', async () => {
      const w = mountWithFilter()
      await pick(w, FA(2))
      await pick(w, 1)
      expect(shown(w)).toEqual([false, false])
    })

    it('brings every detail back with Show all after Hide all', async () => {
      const w = mountWithFilter()
      await pick(w, 1)
      await pick(w, 0)
      expect(shown(w)).toEqual([true, true])
      expect(w.vm.visibleAssessments).toEqual(w.vm.filterOptions.map(o => o.value))
    })

    // The reported bug: opening the menu toggled every row, so the second opening
    // hid FA 1 while the radio still said FA 1.
    it('keeps the selection and the details when the menu is opened and closed again', async () => {
      // b-dropdown opens on an animation frame (a timer in jsdom) and needs the DOM.
      const frame = () => new Promise(resolve => setTimeout(resolve, 30))
      const w = mount(CamelotAssessmentSummaryTable, {
        localVue,
        attachTo: document.body,
        propsData: { assessments: twoStudies(), clickableHeaders: true },
        mocks: { $t },
        stubs: { 'b-table': { template: '<div></div>', props: ['items', 'fields'] }, 'b-sidebar': true, 'font-awesome-icon': true }
      })
      const dropdown = w.findComponent({ name: 'BDropdown' })
      await pick(w, FA(1))
      for (let i = 0; i < 2; i++) {
        dropdown.vm.show()
        await frame()
        expect(dropdown.vm.visible).toBe(true)
        expect(shown(w)).toEqual([true, true])
        dropdown.vm.hide()
        await frame()
      }
      expect(radios(w).at(FA(1)).element.checked).toBe(true)
      expect(w.vm.visibleAssessments).toEqual(['0-0'])
      expect(shown(w)).toEqual([true, true])
      w.destroy()
    })

    it('checks the matching radio and shows every study when a column header is clicked', async () => {
      const w = mountWithFilter()
      await pick(w, 1) // Hide all
      w.vm.handleHeaderClick('1-0') // FA 5
      await w.vm.$nextTick()
      expect(radios(w).at(FA(5)).element.checked).toBe(true)
      expect(shown(w)).toEqual([true, true])
    })

    it('toggles only its own row with the row button, leaving the selection alone', async () => {
      const w = mountWithFilter()
      await pick(w, FA(2))
      const [first, second] = w.vm.tableItems
      w.vm.handleToggleDetails({ item: first, toggleDetails: () => w.vm.$set(first, '_showDetails', !first._showDetails) })
      await w.vm.$nextTick()
      expect(first._showDetails).toBe(false)
      expect(second._showDetails).toBe(true)
      expect(w.vm.visibleAssessments).toEqual(['0-1'])
    })

    it('shows every assessment in a row opened by hand while Hide all is selected', async () => {
      const w = mountWithFilter()
      await pick(w, 1)
      expect(w.vm.activeStages).toEqual([0, 1, 2, 3])
    })

    it('applies the current selection to studies that arrive later', async () => {
      const w = mountWithFilter()
      await pick(w, 1) // Hide all
      await w.setProps({ assessments: twoStudies() })
      expect(shown(w)).toEqual([false, false])
      await pick(w, FA(1))
      await w.setProps({ assessments: twoStudies() })
      expect(shown(w)).toEqual([true, true])
    })

    // The modal calls this every time it opens.
    it('goes back to Hide all with every detail hidden when the table is reset', async () => {
      const w = mountWithFilter()
      await pick(w, FA(4))
      w.vm.resetTableState()
      await w.vm.$nextTick()
      expect(radios(w).at(1).element.checked).toBe(true)
      expect(shown(w)).toEqual([false, false])
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
