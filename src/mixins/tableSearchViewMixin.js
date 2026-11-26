import { filteredViewNote } from '@/utils/filteredViewNote'

/**
 * Una tabla de la worksheet con buscador (#416): lo exportado es lo que se ve.
 *
 * - Guarda las filas que su <b-table> muestra (evento `filtered`, sin reimplementar la
 *   búsqueda) y las pasa a su «Export to Excel» (`shownItems`).
 * - Emite `table-view` con `{ table, search, items, shown, total }` para el Word.
 * - `filteredNote`: la nota de «vista filtrada», en pantalla y en el PDF.
 * - `searchShowEmpty` / `searchEmptyText`: si la búsqueda no encontró nada, la tabla lo dice
 *   (sólo con una búsqueda activa: sin ella, una tabla vacía no es un resultado de búsqueda).
 *
 * Contrato con el anfitrión: `searchTableName()`, `searchSettings()` (el objeto con
 * `filter`), `searchTotal()` (cuántas filas tiene la tabla sin filtrar). En el <b-table>:
 * `@filtered="onTableFiltered" :show-empty="searchShowEmpty" :empty-filtered-text="searchEmptyText"`.
 */
export default {
  data () {
    return {
      shownItems: null,
      shownRows: 0
    }
  },
  computed: {
    searchTerm () {
      const settings = this.searchSettings()
      return (settings && settings.filter) || ''
    },
    filteredNote () {
      return filteredViewNote({ search: this.searchTerm, shown: this.shownRows, total: this.searchTotal() },
        (k, p) => this.$t(k, p))
    },
    searchShowEmpty () {
      return !!this.searchTerm.trim()
    },
    searchEmptyText () {
      return this.$t('export.filtered_view.no_results')
    }
  },
  methods: {
    onTableFiltered (items) {
      const search = this.searchTerm
      this.shownRows = items.length
      this.shownItems = search ? items : null
      this.$emit('table-view', {
        table: this.searchTableName(),
        search,
        items,
        shown: items.length,
        total: this.searchTotal()
      })
    }
  }
}
