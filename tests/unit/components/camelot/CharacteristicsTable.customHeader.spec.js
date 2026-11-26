import { mount, createLocalVue } from '@vue/test-utils'
import CharacteristicsTable from '@/components/camelot/characteristics/CharacteristicsTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const EXTRACTED = 'camelot.step_four.camelot_mixin.extracted_data'
const CONCERNS = 'camelot.step_four.camelot_mixin.concerns'

function createWrapper () {
  return mount(CharacteristicsTable, {
    localVue,
    propsData: {
      charsOfStudies: {
        fields: [
          { key: 'ref_id', label: 'ID' },
          { key: 'research_extractedData', label: 'Research' },
          { key: 'column_x', label: 'My column' }
        ],
        items: [{ ref_id: '1', authors: 'Author A 2020', research_extractedData: 'data1', research_comments: 'concern1', column_x: 'custom1' }]
      }
    },
    mocks: { $t: key => key }
  })
}
const headerRows = w => w.findAll('thead tr').wrappers
const texts = row => row.findAll('th').wrappers.map(th => th.text())

// A custom column reads like a CAMELOT domain: its name on top, "Extracted data" below.
describe('CharacteristicsTable — custom column header in the worksheet', () => {
  it('puts the custom column name in the first row, one row tall', () => {
    const wrapper = createWrapper()
    const th = headerRows(wrapper)[0].findAll('th').wrappers.find(t => t.text() === 'My column')
    expect(th).toBeDefined()
    expect(th.attributes('rowspan')).not.toBe('2')
  })

  it('puts "Extracted data" under the custom column, in column order', () => {
    const wrapper = createWrapper()
    expect(texts(headerRows(wrapper)[1])).toEqual([EXTRACTED, EXTRACTED])
  })

  it('gives the custom column no "Comments" when comments are shown', async () => {
    const wrapper = createWrapper()
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    expect(texts(headerRows(wrapper)[1])).toEqual([EXTRACTED, CONCERNS, EXTRACTED])
  })

  it('has one sub-header per data cell, so the header stays aligned', async () => {
    const wrapper = createWrapper()
    const cells = () => wrapper.findAll('tbody tr').at(0).findAll('td').length - 1 // minus authors
    expect(texts(headerRows(wrapper)[1])).toHaveLength(cells())
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    expect(texts(headerRows(wrapper)[1])).toHaveLength(cells())
  })

  // "Extracted data" wrapped onto two lines in some columns and not in others.
  it('keeps every sub-header on one line', async () => {
    const wrapper = createWrapper()
    const nowrap = () => headerRows(wrapper)[1].findAll('th').wrappers.map(th => th.classes('text-nowrap'))
    expect(nowrap()).toEqual([true, true])
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    expect(nowrap()).toEqual([true, true, true])
  })
})
