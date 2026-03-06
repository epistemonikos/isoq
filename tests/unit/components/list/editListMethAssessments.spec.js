import { shallowMount, createLocalVue } from '@vue/test-utils'
import editListMethAssessments from '@/components/list/editListMethAssessments.vue'
import BootstrapVue from 'bootstrap-vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.component('font-awesome-icon', FontAwesomeIcon)

describe('editListMethAssessments.vue', () => {
  let wrapper
  const propsData = {
    ui: {
      methodological_assessments: {
        display_warning: false
      }
    },
    show: {
      selected: ['ma']
    },
    mode: 'edit',
    list: {
      organization: 'org1',
      project_id: 'proj1',
      references: ['ref1', 'ref2']
    },
    permission: true,
    methAssessments: {
      fields: [],
      items: [],
      fieldsObj: []
    },
    refsWithTitle: [],
    showParagraph: true,
    useCamelot: true
  }

  const $t = (key) => key

  beforeEach(() => {
    wrapper = shallowMount(editListMethAssessments, {
      localVue,
      propsData,
      mocks: { $t },
      stubs: {
        'back-to-top': true,
        'bc-filters': true,
        // Al principio este stub representará el componente antiguo
        'assessment-table': { name: 'AssessmentTable', template: '<div />' },
        // Y el nuevo
        'camelot-assessment-summary-table': { 
          name: 'CamelotAssessmentSummaryTable', 
          template: '<div />',
          props: ['assessments', 'references', 'hideActions']
        }
      }
    })
  })

  it('renders the correct camelot summary table when useCamelot is true', () => {
    // Este test debería fallar inicialmente porque el código aún usa AssessmentTable
    expect(wrapper.findComponent({ name: 'CamelotAssessmentSummaryTable' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'AssessmentTable' }).exists()).toBe(false)
  })

  it('passes the correct props to CamelotAssessmentSummaryTable', () => {
    const table = wrapper.findComponent({ name: 'CamelotAssessmentSummaryTable' })
    if (table.exists()) {
      expect(table.props('assessments')).toEqual(propsData.methAssessments)
      expect(table.props('references')).toEqual(propsData.list.references)
      expect(table.props('hideActions')).toBe(true)
    }
  })
})
