import { mount, createLocalVue } from '@vue/test-utils'
import CamelotAssessmentSummaryTable from '@/components/camelot/assessment/CamelotAssessmentSummaryTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// #424: the table lives both in the Step 2 tab and in the evidence profile modal.
// A fixed sidebar id made the help button open both sidebars, stacked.
describe('CamelotAssessmentSummaryTable — help sidebar (#424)', () => {
  const opts = {
    localVue,
    propsData: { assessments: { items: [] } },
    mocks: { $t: k => k },
    stubs: { 'font-awesome-icon': true, 'b-table': true },
    attachTo: document.body
  }

  it('gives each instance its own sidebar, and the button targets only its own', () => {
    const a = mount(CamelotAssessmentSummaryTable, opts)
    const b = mount(CamelotAssessmentSummaryTable, opts)
    const idA = a.find('.b-sidebar').attributes('id')
    const idB = b.find('.b-sidebar').attributes('id')
    expect(idA).toBeTruthy()
    expect(idA).not.toBe(idB)
    expect(a.find('button.btn-link').attributes('aria-controls')).toBe(idA)
    expect(b.find('button.btn-link').attributes('aria-controls')).toBe(idB)
    a.destroy(); b.destroy()
  })
})
