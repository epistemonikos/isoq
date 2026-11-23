import { characteristicsColumns } from '@/utils/characteristicsColumns'

// Una sola regla para las columnas de «Characteristics of Studies» (CAMELOT): la usa la
// tabla en pantalla y la usan los exportables, así que el orden, los nombres, las columnas
// ocultas y los comentarios no pueden diferir entre lo que se ve y lo que se exporta (#416).
const labels = { extractedData: 'Extracted data', comments: 'Comments' }
const categories = [
  { key: 'research', label: 'Research', options: [{ key: 'research_extractedData', label: 'Extracted data' }, { key: 'research_comments', label: 'Concerns' }] },
  { key: 'theory', label: 'Theory', options: [{ key: 'theory_extractedData', label: 'Extracted data' }, { key: 'theory_comments', label: 'Concerns' }] }
]
// El orden de `fields` es el que eligió la persona; las claves propias son hex (no números).
const fields = [
  { key: 'authors' }, { key: 'ref_id' },
  { key: 'column_f00d', label: 'Setting' },
  { key: 'theory_extractedData', label: 'T' }, { key: 'theory_comments', label: 'TC' },
  { key: 'column_0a1b', label: 'Country' },
  { key: 'research_extractedData', label: 'R' }, { key: 'research_comments', label: 'RC' }
]
const cols = view => characteristicsColumns({ fields, categories, view, labels })

describe('characteristicsColumns', () => {
  it('keeps the order of `fields`, never sorting by key', () => {
    expect(cols().headers.map(h => h.label)).toEqual(['Setting', 'Theory', 'Country', 'Research'])
  })

  it('every column is filterable, by the key the filter uses', () => {
    expect(cols().filterable).toEqual([
      { key: 'column_f00d', label: 'Setting' }, { key: 'theory_extractedData', label: 'Theory' },
      { key: 'column_0a1b', label: 'Country' }, { key: 'research_extractedData', label: 'Research' }
    ])
  })

  it('comments off (the default): one sub-column per header, «Extracted data» under each', () => {
    const c = cols()
    expect(c.headers.map(h => h.colspan)).toEqual([1, 1, 1, 1])
    expect(c.subHeaders.map(s => s.key)).toEqual(['column_f00d', 'theory_extractedData', 'column_0a1b', 'research_extractedData'])
    expect(c.subHeaders[0].label).toBe('Extracted data')
  })

  it('comments on: each CAMELOT domain spans its two options', () => {
    const c = cols({ hiddenColumnKeys: [], showComments: true })
    expect(c.headers.map(h => h.colspan)).toEqual([1, 2, 1, 2])
    expect(c.cellKeys).toEqual(['column_f00d', 'theory_extractedData', 'theory_comments', 'column_0a1b', 'research_extractedData', 'research_comments'])
  })

  it('hidden columns leave; hiding a domain takes its comments with it', () => {
    const c = cols({ hiddenColumnKeys: ['column_0a1b', 'theory_extractedData'], showComments: true })
    expect(c.headers.map(h => h.label)).toEqual(['Setting', 'Research'])
    expect(c.cellKeys).toEqual(['column_f00d', 'research_extractedData', 'research_comments'])
  })

  it('a domain missing from the catalogue still shows, with its own label', () => {
    const c = characteristicsColumns({ fields: [{ key: 'new_extractedData', label: 'New' }], categories, labels, view: { showComments: true } })
    expect(c.headers[0]).toEqual(expect.objectContaining({ label: 'New', colspan: 2 }))
    expect(c.cellKeys).toEqual(['new_extractedData', 'new_comments'])
  })

  it('counts what is hidden, for the «filtered view» note', () => {
    const c = cols({ hiddenColumnKeys: ['column_0a1b'], showComments: false })
    expect(c.hiddenLabels).toEqual(['Country'])
    expect(cols().hiddenLabels).toEqual([])
  })
})
