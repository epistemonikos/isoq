import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import CamelotAssessmentsTablePreview from '@/components/camelot/preview/CamelotAssessmentsTablePreview.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const buildItem = (fa1Option, fa1Text) => ({
  ref_id: '1',
  stages: [
    {
      options: [
        { option: fa1Option, text: fa1Text },
        { option: null, text: '' },
        { option: null, text: '' },
        { option: null, text: '' }
      ]
    },
    { options: Array.from({ length: 4 }, () => ({ option: null, text: '' })) },
    { options: [{ option: null, text: '' }] },
    { options: [{ option: null, text: '' }] }
  ]
})

const build = (item) => mount(CamelotAssessmentsTablePreview, {
  localVue,
  propsData: {
    methodologicalTableRefs: { items: [item] },
    references: []
  },
  mocks: { $t: (msg) => msg },
  stubs: { 'font-awesome-icon': { template: '<i class="fa-stub"></i>' } }
})

describe('CamelotAssessmentsTablePreview.vue', () => {
  it('flags an assessment without an explanation in the shared view', () => {
    const circle = build(buildItem('A', '')).find('.assessment-circle.circle-incomplete')
    expect(circle.exists()).toBe(true)
    expect(circle.find('.fa-stub').exists()).toBe(true)
  })

  it('leaves a complete assessment filled', () => {
    const wrapper = build(buildItem('A', 'Because of X'))
    expect(wrapper.find('.assessment-circle.circle-incomplete').exists()).toBe(false)
    expect(wrapper.find('.assessment-circle.circle-filled').exists()).toBe(true)
  })
})
