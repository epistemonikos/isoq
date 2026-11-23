import { shallowMount } from '@vue/test-utils'
import editListActionButtons from '@/components/list/editListActionButtons.vue'
import { exportToWord } from '@/services/wordExportService'

// El Word del Worksheet desde el proyecto (/worksheet/:id/edit). Sin CAMELOT caía en la
// estrategia iSoQ (SoQf + EP, sin Pasos 3/4 ni datos extraídos) y mandaba el Paso 3 como
// `characteristicStudies`, que la estrategia Worksheet no lee.
jest.mock('@/services/wordExportService', () => ({ exportToWord: jest.fn().mockResolvedValue(true) }))

const tables = {
  characteristicStudies: { fields: [{ key: 'column_0' }], items: [{ column_0: 'c' }] },
  methodologicalAssessments: { fields: [{ key: 'column_0' }], items: [{ column_0: 'm' }] },
  extractedData: { fields: [{ key: 'column_0' }], items: [{ column_0: 'e' }] }
}

function mountWith (useCamelot, extra = {}) {
  return shallowMount(editListActionButtons, {
    propsData: {
      mode: 'view',
      permission: true,
      project: { name: 'P', use_camelot: useCamelot, public_type: 'private' },
      evidenceProfile: [{ name: 'F' }],
      selectOptions: [],
      levelConfidence: [],
      references: [],
      list: { name: 'F', fullreferences: [{ id: 'r1' }] },
      license: '',
      ...tables,
      ...extra
    },
    mocks: { $t: k => k },
    stubs: ['font-awesome-icon', 'b-button', 'b-row', 'b-col', 'b-dropdown', 'b-dropdown-item']
  })
}

describe('editListActionButtons — Word export', () => {
  beforeEach(() => exportToWord.mockClear())

  it('without CAMELOT: Worksheet strategy, every study table, for the team', async () => {
    await mountWith(false).vm.exportToWord()
    const [, data, options] = exportToWord.mock.calls[0]
    expect(options.strategy).toBe('worksheet')
    expect(data.includeStudyTables).toBe(true)
    expect(data.evidenceProfile).toEqual({ name: 'F' })
    expect(data.characteristicsStudies).toEqual(tables.characteristicStudies)
    expect(data.methodologicalAssessments).toEqual(tables.methodologicalAssessments)
    expect(data.extractedData).toEqual(tables.extractedData)
  })

  it('with CAMELOT: CAMELOT strategy, every study table, for the team', async () => {
    await mountWith(true).vm.exportToWord()
    const [, data, options] = exportToWord.mock.calls[0]
    expect(options.strategy).toBe('camelot')
    expect(Array.isArray(data.evidenceProfile)).toBe(true)
    expect(data.includeStudyTables).toBe(true)
  })

  // #416: el Word sigue el filtro de «Characteristics of Studies», como el PDF.
  it('with CAMELOT: sends the Characteristics filter of the screen', async () => {
    const view = { hiddenColumnKeys: ['column_2'], showComments: true }
    await mountWith(true, { tableViews: { characteristics: view } }).vm.exportToWord()
    const [, data] = exportToWord.mock.calls[0]
    expect(data.characteristicsView).toEqual(view)
  })

  // #416 sin CAMELOT: con una búsqueda activa, el Word lleva las filas que la tabla muestra.
  it('without CAMELOT: a search sends only the rows on screen, and the search itself', async () => {
    const shown = [{ column_0: 'c' }]
    const view = { search: 'c', items: shown, shown: 1, total: 4 }
    await mountWith(false, { tableViews: { characteristics: view } }).vm.exportToWord()
    const [, data] = exportToWord.mock.calls[0]
    expect(data.characteristicsStudies.items).toEqual(shown)
    expect(data.characteristicsStudies.fields).toEqual(tables.characteristicStudies.fields)
    expect(data.characteristicsView).toEqual({ search: 'c', shown: 1, total: 4 })
  })

  it('without CAMELOT and without a search: every row, no view', async () => {
    await mountWith(false, { tableViews: { characteristics: { search: '', items: [], shown: 1, total: 1 } } }).vm.exportToWord()
    const [, data] = exportToWord.mock.calls[0]
    expect(data.characteristicsStudies).toEqual(tables.characteristicStudies)
    expect(data.characteristicsView).toBeNull()
  })

  // #416: las otras dos tablas con buscador, igual que Characteristics.
  it('without CAMELOT: Methodological and Extracted data follow their own search', async () => {
    const meth = { search: 'm', items: [{ column_0: 'm' }], shown: 1, total: 3 }
    const extracted = { search: 'z', items: [], shown: 0, total: 2 }
    await mountWith(false, { tableViews: { methodological: meth, extracted } }).vm.exportToWord()
    const [, data] = exportToWord.mock.calls[0]
    expect(data.methodologicalAssessments.items).toEqual(meth.items)
    expect(data.methodologicalView).toEqual({ search: 'm', shown: 1, total: 3 })
    expect(data.extractedData.items).toEqual([])
    expect(data.extractedView).toEqual({ search: 'z', shown: 0, total: 2 })
  })

  it('with CAMELOT: Extracted data follows its search too', async () => {
    const extracted = { search: 'z', items: [{ column_0: 'e' }], shown: 1, total: 2 }
    await mountWith(true, { tableViews: { extracted } }).vm.exportToWord()
    const [, data] = exportToWord.mock.calls[0]
    expect(data.extractedData.items).toEqual(extracted.items)
    expect(data.extractedView).toEqual({ search: 'z', shown: 1, total: 2 })
  })
})
