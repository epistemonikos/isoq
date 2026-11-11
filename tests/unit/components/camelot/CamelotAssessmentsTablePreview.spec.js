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

// Reporte: un estudio agregado al finding después de los demás salía al final en vez de en
// su lugar alfabético. Acá llegaba por dos caminos: las filas del padre en el orden de
// `list.references`, y las de estudios sin evaluación guardada agregadas al final.
describe('CamelotAssessmentsTablePreview.vue — orden de los estudios', () => {
  const references = [
    { id: 'rS', authors: 'Smith', publication_year: '2020' },
    { id: 'rA', authors: 'Adams', publication_year: '2019' },
    { id: 'rM', authors: 'Moore', publication_year: '2021' }
  ]
  const tableItems = (items) => mount(CamelotAssessmentsTablePreview, {
    localVue,
    propsData: { methodologicalTableRefs: { items }, references },
    mocks: { $t: (msg) => msg },
    stubs: { 'font-awesome-icon': true }
  }).vm.tableItems

  it('ordena las filas que llegan del padre en el orden de las casillas', () => {
    const items = ['rS', 'rA', 'rM'].map(id => ({ ...buildItem(null, ''), ref_id: id }))
    expect(tableItems(items).map(i => i.ref_id)).toEqual(['rA', 'rM', 'rS'])
  })

  it('el estudio sin evaluación guardada no va al final', () => {
    const items = ['rS', 'rA'].map(id => ({ ...buildItem(null, ''), ref_id: id }))
    expect(tableItems(items).map(i => i.ref_id)).toEqual(['rA', 'rM', 'rS'])
  })
})
