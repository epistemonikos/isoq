import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListCharsOfStudies from '@/components/list/editListCharsOfStudies.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

// #416 sin CAMELOT: lo que se exporta es lo que se ve. La búsqueda filtra filas; la tabla
// avisa cuáles muestra (las que entrega el propio b-table, sin reimplementar su búsqueda) y
// dice en pantalla —y en el PDF— que la vista está filtrada.
const items = [
  { ref_id: 'r1', authors: 'Smith 2020;', column_0: 'Chile' },
  { ref_id: 'r2', authors: 'Lee 2021;', column_0: 'Korea' },
  { ref_id: 'r3', authors: 'Rojas 2019;', column_0: 'Chile' }
]

function mountTable () {
  return mount(editListCharsOfStudies, {
    localVue,
    propsData: {
      ui: { adequacy: { chars_of_studies: { display_warning: false } } },
      show: { selected: ['cs'] },
      mode: 'edit',
      list: { organization: 'o', project_id: 'p' },
      permission: true,
      charsOfStudies: {
        fields: [{ key: 'authors' }, { key: 'column_0', label: 'Country' }],
        fieldsObj: [{ key: 'authors', label: 'Author(s)' }, { key: 'column_0', label: 'Country' }],
        items,
        tableTop: []
      },
      refsWithTitle: [],
      useCamelot: false
    },
    mocks: { $t: (k, p) => k + (p ? JSON.stringify(p) : '') },
    stubs: { 'bc-filters': true, 'back-to-top': true, 'font-awesome-icon': true }
  })
}

const last = w => { const e = w.emitted('table-view') || []; return e.length ? e[e.length - 1][0] : undefined }
const note = w => w.find('[data-testid="filtered-view-note"]')

describe('editListCharsOfStudies — search (#416)', () => {
  it('a search sends the rows the table shows, and how many of all', async () => {
    const wrapper = mountTable()
    wrapper.vm.characteristics_studies_table_settings.filter = 'Chile'
    await flush(); await wrapper.vm.$nextTick()
    const view = last(wrapper)
    expect(view.table).toBe('characteristics')
    expect(view.search).toBe('Chile')
    expect(view.items.map(i => i.ref_id)).toEqual(['r1', 'r3'])
    expect(view.shown).toBe(2)
    expect(view.total).toBe(3)
  })

  it('says on screen (and on paper) that the view is filtered', async () => {
    const wrapper = mountTable()
    expect(note(wrapper).exists()).toBe(false)
    wrapper.vm.characteristics_studies_table_settings.filter = 'Chile'
    await flush(); await wrapper.vm.$nextTick()
    expect(note(wrapper).text()).toContain('export.filtered_view.search')
    expect(note(wrapper).classes()).not.toContain('d-print-none')
  })

  it('clearing the search goes back to every row and no note', async () => {
    const wrapper = mountTable()
    wrapper.vm.characteristics_studies_table_settings.filter = 'Chile'
    await flush(); await wrapper.vm.$nextTick()
    wrapper.vm.characteristics_studies_table_settings.filter = ''
    await flush(); await wrapper.vm.$nextTick()
    expect(last(wrapper).search).toBe('')
    expect(note(wrapper).exists()).toBe(false)
  })
})
