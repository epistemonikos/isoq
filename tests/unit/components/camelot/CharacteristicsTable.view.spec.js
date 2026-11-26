import fs from 'fs'
import path from 'path'
import { mount, createLocalVue } from '@vue/test-utils'
import CharacteristicsTable from '@/components/camelot/characteristics/CharacteristicsTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// #416: el Word sigue el filtro de la tabla, así que la tabla avisa qué está mostrando.
function mountTable () {
  return mount(CharacteristicsTable, {
    localVue,
    propsData: {
      charsOfStudies: {
        fields: [{ key: 'column_1', label: 'Country' }, { key: 'research_extractedData', label: 'R' }],
        items: [{ ref_id: '1', authors: 'A', column_1: 'x', research_extractedData: 'y' }]
      }
    },
    mocks: { $t: k => k }
  })
}

const last = wrapper => { const e = wrapper.emitted('view-change'); return e[e.length - 1][0] }

describe('CharacteristicsTable — view-change', () => {
  it('announces its starting view: nothing hidden, comments off', () => {
    expect(last(mountTable())).toEqual({ hiddenColumnKeys: [], showComments: false })
  })

  it('announces a hidden column', async () => {
    const wrapper = mountTable()
    wrapper.vm.visibleColumnKeys = ['research_extractedData']
    await wrapper.vm.$nextTick()
    expect(last(wrapper)).toEqual({ hiddenColumnKeys: ['column_1'], showComments: false })
  })

  it('announces the comments toggle', async () => {
    const wrapper = mountTable()
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    expect(last(wrapper).showComments).toBe(true)
  })
})

// #416: con columnas ocultas la tabla lo dice, en pantalla y en el papel (no es d-print-none).
describe('CharacteristicsTable — filtered view note', () => {
  const note = wrapper => wrapper.find('[data-testid="filtered-view-note"]')

  it('no note while nothing is hidden', () => {
    expect(note(mountTable()).exists()).toBe(false)
  })

  it('names the hidden columns, and prints', async () => {
    const wrapper = mountTable()
    wrapper.vm.visibleColumnKeys = ['research_extractedData']
    await wrapper.vm.$nextTick()
    expect(note(wrapper).text()).toBe('export.filtered_view.title — export.filtered_view.hidden_columns')
    expect(note(wrapper).classes()).not.toContain('d-print-none')
  })
})

// El camino de la pantalla al Word: la tabla → editListCharsOfStudies → editList → botones.
describe('the Characteristics view reaches the Word export', () => {
  const read = f => fs.readFileSync(path.resolve(f), 'utf8')

  it('editListCharsOfStudies relays it as the characteristics table view', () => {
    expect(read('src/components/list/editListCharsOfStudies.vue'))
      .toMatch(/<camelot-characteristics-table[^>]*@view-change="\$emit\('table-view', \{ table: 'characteristics', \.\.\.\$event \}\)"/)
  })

  // Las tres tablas de la worksheet: una sola vía hasta los botones (#416).
  it.each(['table-chars-of-studies', 'table-meth-assessments', 'table-extracted-data'])(
    'editList keeps the view of <%s> and hands it to the action buttons', (tag) => {
      const src = read('src/components/list/editList.vue')
      expect(src).toMatch(new RegExp(`<${tag}[^>]*@table-view="setTableView"`))
      expect(src).toMatch(/<edit-list-actions-buttons[^>]*:tableViews="tableViews"/)
      expect(src).toMatch(/tableViews: \{ characteristics: null, methodological: null, extracted: null \}/)
    })
})
