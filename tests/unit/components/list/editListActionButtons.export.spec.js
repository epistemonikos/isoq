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

function mountWith (useCamelot) {
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
      ...tables
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
})
