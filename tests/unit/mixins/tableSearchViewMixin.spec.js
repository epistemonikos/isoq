import { mount } from '@vue/test-utils'
import tableSearchViewMixin from '@/mixins/tableSearchViewMixin'

// #416: lo exportado es lo que se ve. Una tabla con buscador avisa qué filas muestra, dice
// en pantalla (y en el PDF) que está filtrada, y avisa si la búsqueda no encontró nada.
function host (items) {
  return mount({
    mixins: [tableSearchViewMixin],
    template: '<div><p v-if="filteredNote" class="note">{{ filteredNote }}</p></div>',
    data: () => ({ settings: { filter: '' }, rows: items }),
    methods: {
      searchTableName: () => 'methodological',
      searchSettings () { return this.settings },
      searchTotal () { return this.rows.length }
    }
  }, { mocks: { $t: (k, p) => k + (p ? JSON.stringify(p) : '') } })
}

const last = w => { const e = w.emitted('table-view'); return e[e.length - 1][0] }
const ROWS = [{ a: 1 }, { a: 2 }, { a: 3 }]

describe('tableSearchViewMixin', () => {
  it('a search: the rows shown, how many of all, and which table', async () => {
    const w = host(ROWS)
    w.vm.settings.filter = 'x'
    w.vm.onTableFiltered([ROWS[1]])
    await w.vm.$nextTick()
    expect(last(w)).toEqual({ table: 'methodological', search: 'x', items: [ROWS[1]], shown: 1, total: 3 })
    expect(w.vm.shownItems).toEqual([ROWS[1]])
    expect(w.find('.note').text()).toContain('export.filtered_view.search')
  })

  it('no search: every row, no shown subset, no note', async () => {
    const w = host(ROWS)
    w.vm.onTableFiltered(ROWS)
    await w.vm.$nextTick()
    expect(last(w).search).toBe('')
    expect(w.vm.shownItems).toBeNull()
    expect(w.find('.note').exists()).toBe(false)
  })

  it('a search that finds nothing: shown 0, and the table says so', async () => {
    const w = host(ROWS)
    w.vm.settings.filter = 'zzz'
    w.vm.onTableFiltered([])
    await w.vm.$nextTick()
    expect(last(w)).toEqual(expect.objectContaining({ shown: 0, items: [] }))
    expect(w.vm.searchEmptyText).toBe('export.filtered_view.no_results')
    expect(w.vm.searchShowEmpty).toBe(true)
  })

  it('without a search the empty message never shows', () => {
    expect(host([]).vm.searchShowEmpty).toBe(false)
  })
})
