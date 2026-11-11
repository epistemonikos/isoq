import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import CharacteristicsTable from '@/components/camelot/characteristics/CharacteristicsTable.vue'
import TableColumnFilter from '@/components/common/TableColumnFilter.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Etiquetas que entrega el camelotMixin con $t identidad.
const RESEARCH = 'camelot.step_four.camelot_mixin.meta_domain_1'
const STAKEHOLDERS = 'camelot.step_four.camelot_mixin.meta_domain_2'

function makeChars () {
  return {
    fields: [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'column_a', label: 'Country' },
      { key: 'research_extractedData', label: 'Research' },
      { key: 'research_comments', label: 'Research comments' },
      { key: 'stakeholders_extractedData', label: 'Stakeholders' },
      { key: 'stakeholders_comments', label: 'Stakeholders comments' }
    ],
    items: [{
      ref_id: 'r1',
      authors: 'Chen 2021',
      column_a: 'Chile',
      research_extractedData: 'research-data',
      research_comments: 'research-comment',
      stakeholders_extractedData: 'stake-data',
      stakeholders_comments: 'stake-comment'
    }]
  }
}

function mountTable (charsOfStudies = makeChars()) {
  return mount(CharacteristicsTable, {
    localVue,
    propsData: { charsOfStudies },
    mocks: { $t: (key) => key },
    stubs: { 'font-awesome-icon': true }
  })
}

const headerTexts = (wrapper) => wrapper.findAll('thead th').wrappers.map(w => w.text())
const cellTexts = (wrapper) => wrapper.findAll('tbody td').wrappers.map(w => w.text())

// Like a person does it: open the filter, (un)check the column, press Apply (#412).
async function setColumnVisible (wrapper, label, visible) {
  const filter = wrapper.findComponent(TableColumnFilter)
  filter.findComponent({ name: 'BDropdown' }).vm.visible = true
  await wrapper.vm.$nextTick()
  const box = filter.findAll('.custom-checkbox').wrappers.find(w => w.text() === label)
  if (!box) throw new Error(`No "${label}" checkbox in the filter`)
  await box.find('input').setChecked(visible)
  await filter.find('[data-testid="column-filter-apply"]').trigger('click')
}

describe('CharacteristicsTable.vue — filtro de columnas', () => {
  it('pone el filtro a la izquierda del botón de comentarios, en una barra que no se imprime', () => {
    const wrapper = mountTable()
    const toolbar = wrapper.find('[data-testid="chars-toolbar"]')

    expect(toolbar.classes()).toContain('d-print-none')
    const children = toolbar.element.children
    expect(children[0].classList.contains('table-column-filter')).toBe(true)
    expect(children[1].getAttribute('data-testid')).toBe('toggle-comments')
  })

  it('ofrece las columnas propias y un dominio CAMELOT por entrada, sin authors ni comments', () => {
    const wrapper = mountTable()
    const labels = wrapper.findComponent(TableColumnFilter).props('allColumns').map(c => c.label)

    expect(labels).toEqual(['Country', RESEARCH, STAKEHOLDERS])
  })

  it('arranca con todo visible', () => {
    const wrapper = mountTable()

    expect(headerTexts(wrapper)).toEqual(expect.arrayContaining(['Country', RESEARCH, STAKEHOLDERS]))
    expect(cellTexts(wrapper)).toEqual(['Chen 2021', 'Chile', 'research-data', 'stake-data'])
  })

  it('leaves the table as it is until Apply is pressed (#412)', async () => {
    const wrapper = mountTable()
    const filter = wrapper.findComponent(TableColumnFilter)
    filter.findComponent({ name: 'BDropdown' }).vm.visible = true
    await wrapper.vm.$nextTick()
    const country = filter.findAll('.custom-checkbox').wrappers.find(w => w.text() === 'Country')

    await country.find('input').setChecked(false)
    expect(headerTexts(wrapper)).toContain('Country')
    expect(cellTexts(wrapper)).toContain('Chile')

    await filter.find('[data-testid="column-filter-apply"]').trigger('click')
    expect(headerTexts(wrapper)).not.toContain('Country')
    expect(cellTexts(wrapper)).not.toContain('Chile')
  })

  it('ocultar una columna propia saca su encabezado y su celda', async () => {
    const wrapper = mountTable()
    await setColumnVisible(wrapper, 'Country', false)

    expect(headerTexts(wrapper)).not.toContain('Country')
    expect(cellTexts(wrapper)).not.toContain('Chile')
  })

  it('ocultar un dominio saca su extracted data y sus comments', async () => {
    const wrapper = mountTable()
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    expect(cellTexts(wrapper)).toContain('research-comment')

    await setColumnVisible(wrapper, RESEARCH, false)

    expect(headerTexts(wrapper)).not.toContain(RESEARCH)
    expect(cellTexts(wrapper)).not.toContain('research-data')
    expect(cellTexts(wrapper)).not.toContain('research-comment')
    // El otro dominio sigue con sus dos subcolumnas.
    expect(cellTexts(wrapper)).toEqual(expect.arrayContaining(['stake-data', 'stake-comment']))
    // Second header row: "Extracted data" under Country, then the visible domain's two sub-columns.
    expect(wrapper.findAll('thead tr').at(1).findAll('th').length).toBe(3)
  })

  it('volver a mostrar el dominio repone sus comments si siguen activos', async () => {
    const wrapper = mountTable()
    await wrapper.find('[data-testid="toggle-comments"]').trigger('click')
    await setColumnVisible(wrapper, RESEARCH, false)
    await setColumnVisible(wrapper, RESEARCH, true)

    expect(cellTexts(wrapper)).toEqual(expect.arrayContaining(['research-data', 'research-comment']))
  })

  it('deshabilita el botón de comentarios cuando no queda ningún dominio visible', async () => {
    const wrapper = mountTable()
    const toggle = () => wrapper.find('[data-testid="toggle-comments"]')
    expect(toggle().attributes('disabled')).toBeUndefined()

    await setColumnVisible(wrapper, RESEARCH, false)
    await setColumnVisible(wrapper, STAKEHOLDERS, false)

    expect(toggle().attributes('disabled')).toBe('disabled')
    // Only the custom column is left, still with "Extracted data" under its name.
    expect(wrapper.findAll('thead tr').length).toBe(2)
    expect(wrapper.findAll('thead tr').at(1).findAll('th').wrappers.map(th => th.text()))
      .toEqual(['camelot.step_four.camelot_mixin.extracted_data'])
  })

  it('una columna que aparece con la tabla abierta entra visible', async () => {
    const chars = makeChars()
    const wrapper = mountTable(chars)
    await setColumnVisible(wrapper, 'Country', false)

    await wrapper.setProps({
      charsOfStudies: {
        fields: [...chars.fields, { key: 'column_b', label: 'Setting' }],
        items: [{ ...chars.items[0], column_b: 'Rural' }]
      }
    })

    expect(headerTexts(wrapper)).toContain('Setting')
    expect(cellTexts(wrapper)).toContain('Rural')
    // Lo que el usuario ocultó sigue oculto.
    expect(headerTexts(wrapper)).not.toContain('Country')
  })
})
