import fs from 'fs'
import path from 'path'

// #416: todo exportable es lo que la persona ve. Cada tabla de la worksheet con búsqueda
// guarda las filas que su b-table muestra y se las pasa a su botón «Export to Excel».
describe('worksheet tables hand their shown rows to the Excel export', () => {
  it.each([
    'src/components/list/editListCharsOfStudies.vue',
    'src/components/list/editListMethAssessments.vue',
    'src/components/list/editListExtractedData.vue'
  ])('%s', (file) => {
    const src = fs.readFileSync(path.resolve(file), 'utf8')
    expect(src).toMatch(/<b-table[^>]*@filtered="/)
    expect(src).toMatch(/<bc-filters[^>]*:shown-items="/)
  })
})

// Las tres usan la misma regla (tableSearchViewMixin): nota de vista filtrada visible en
// pantalla y en el PDF, y aviso de «sin resultados» cuando la búsqueda no encuentra nada.
describe('worksheet tables share the search view rule', () => {
  it.each([
    'src/components/list/editListCharsOfStudies.vue',
    'src/components/list/editListMethAssessments.vue',
    'src/components/list/editListExtractedData.vue'
  ])('%s', (file) => {
    const src = fs.readFileSync(path.resolve(file), 'utf8')
    expect(src).toMatch(/import tableSearchViewMixin from '@\/mixins\/tableSearchViewMixin'/)
    expect(src).toMatch(/<b-table[^>]*@filtered="onTableFiltered"/)
    expect(src).toMatch(/<b-table[^>]*:show-empty="searchShowEmpty"/)
    expect(src).toMatch(/<b-table[^>]*:empty-filtered-text="searchEmptyText"/)
    expect(src).toMatch(/<p v-if="filteredNote"[^>]*data-testid="filtered-view-note"/)
    expect(src).toMatch(/<p v-if="filteredNote"(?![^>]*d-print-none)[^>]*>/)
  })
})
