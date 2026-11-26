import fs from 'fs'
import path from 'path'
import { mount, createLocalVue } from '@vue/test-utils'
import CharacteristicsTable from '@/components/camelot/characteristics/CharacteristicsTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// #416: en el PDF no se puede hacer clic en «read more», así que la celda se imprime entera.
// En pantalla sigue truncada: las dos versiones se dibujan y el CSS de impresión elige.
const LONG = 'Lorem ipsum dolor sit amet '.repeat(20).trim()

function mountTable () {
  return mount(CharacteristicsTable, {
    localVue,
    propsData: {
      charsOfStudies: {
        fields: [{ key: 'ref_id', label: 'ID' }, { key: 'research_extractedData', label: 'Research' }],
        items: [{ ref_id: '1', authors: 'Author A', year: '2020', research_extractedData: LONG }]
      }
    },
    mocks: { $t: k => k }
  })
}

const cell = (wrapper) => wrapper.findAll('tbody td').wrappers.find(td => td.text().includes('Lorem'))

describe('CharacteristicsTable — printing a truncated cell (#416)', () => {
  it('on screen: the truncated text and «read more», both hidden on paper', () => {
    const td = cell(mountTable())
    const screenOnly = td.find('.d-print-none')
    expect(screenOnly.exists()).toBe(true)
    expect(screenOnly.text()).toContain('common.read_more')
    expect(screenOnly.text()).not.toContain(LONG)
  })

  it('on paper: the whole text, hidden on screen, without «read more»', () => {
    const td = cell(mountTable())
    const paperOnly = td.find('.d-none.d-print-block')
    expect(paperOnly.exists()).toBe(true)
    expect(paperOnly.text()).toBe(LONG)
    expect(paperOnly.text()).not.toContain('read_more')
  })

  it('expanded on screen: «read less» does not print either', async () => {
    const wrapper = mountTable()
    await cell(wrapper).find('a').trigger('click')
    const td = cell(wrapper)
    expect(td.text()).toContain(LONG)
    const less = td.findAll('a').wrappers.find(a => a.text() === 'common.read_less')
    expect(less.element.closest('.d-print-none')).not.toBeNull()
  })
})

// La celda OA de la tabla resumen no tenía fondo: su clase de encabezado no tenía regla en
// tema claro (en StepFour y en el tema oscuro sí).
describe('CamelotAssessmentSummaryTable — OA header', () => {
  // Mismo color que FA 1-9, en la web y en el PDF: una sola regla para las dos clases.
  it('gives OA exactly the same background as the FA headers', () => {
    const src = fs.readFileSync(path.resolve('src/components/camelot/assessment/CamelotAssessmentSummaryTable.vue'), 'utf8')
    const style = src.slice(src.indexOf('<style'))
    expect(style).toMatch(/::v-deep \.header-second-row,\s*::v-deep \.header-overall-row\s*\{[^}]*background-color:\s*#D3E9FF\s*!important/)
    expect(style).not.toMatch(/#D8EBF5/)
  })

  it('and the same in the dark theme', () => {
    const scss = fs.readFileSync(path.resolve('src/assets/styles/main.scss'), 'utf8')
    expect(scss).toMatch(/\.camelot-summary-table-container \.header-second-row,\s*\.camelot-summary-table-container \.header-overall-row\s*\{\s*background-color:\s*#2a2a2a/)
  })
})
