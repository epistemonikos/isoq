import fs from 'fs'
import path from 'path'
import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import TruncatedCell from '@/components/common/TruncatedCell.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// #416: en pantalla, resumen + «read more»; en papel, el texto entero y sin enlaces.
const LONG = 'Lorem ipsum dolor sit amet '.repeat(20).trim()
const cell = text => mount(TruncatedCell, { localVue, propsData: { text }, mocks: { $t: k => k } })

describe('TruncatedCell', () => {
  it('short text: just the text', () => {
    const w = cell('short')
    expect(w.text()).toBe('short')
    expect(w.find('a').exists()).toBe(false)
  })

  it('long text on screen: summary and «read more», hidden on paper', () => {
    const screen = cell(LONG).find('.d-print-none')
    expect(screen.text()).toContain('common.read_more')
    expect(screen.text()).not.toContain(LONG)
  })

  it('long text on paper: all of it, hidden on screen, no link', () => {
    const paper = cell(LONG).find('.d-none.d-print-block')
    expect(paper.text()).toBe(LONG)
    expect(paper.find('a').exists()).toBe(false)
  })

  it('«read more» expands; «read less» does not print', async () => {
    const w = cell(LONG)
    await w.find('a').trigger('click')
    expect(w.text()).toContain(LONG)
    const less = w.findAll('a').wrappers.find(a => a.text() === 'common.read_less')
    expect(less.element.closest('.d-print-none')).not.toBeNull()
  })

  it('numbers and empty values render as text', () => {
    expect(cell(15).text()).toBe('15')
    expect(cell(null).text()).toBe('')
  })
})

// Las vistas que se imprimen no escriben su propio «read more»: usan TruncatedCell.
describe('print views truncate only through TruncatedCell', () => {
  it.each([
    'src/components/list/editListCharsOfStudies.vue',
    'src/components/list/editListMethAssessments.vue',
    'src/components/camelot/characteristics/CharacteristicsTable.vue',
    'src/components/camelot/preview/CamelotCharacteristicsTablePreview.vue'
  ])('%s', (file) => {
    const src = fs.readFileSync(path.resolve(file), 'utf8')
    expect(src).not.toMatch(/common\.read_more/)
    expect(src).toMatch(/<truncated-cell /)
  })
})
