import { filteredViewNote } from '@/utils/filteredViewNote'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

// #416: lo exportado es lo que se ve, y si lo que se ve está filtrado el documento lo dice.
// Sin filtro no hay nota: el documento queda como siempre.
const t = (key, params = {}) => key + (Object.keys(params).length ? JSON.stringify(params) : '')

describe('filteredViewNote', () => {
  it('nothing filtered: no note', () => {
    expect(filteredViewNote({ hiddenLabels: [] }, t)).toBe('')
    expect(filteredViewNote({ search: '', shown: 5, total: 5 }, t)).toBe('')
  })

  it('hidden columns are named', () => {
    expect(filteredViewNote({ hiddenLabels: ['Setting', 'Theory'] }, t)).toBe(
      'export.filtered_view.title — export.filtered_view.hidden_columns{"columns":"Setting, Theory"}')
  })

  it('a search says how many studies are shown', () => {
    expect(filteredViewNote({ search: 'clinic', shown: 3, total: 5 }, t)).toBe(
      'export.filtered_view.title — export.filtered_view.search{"term":"clinic","shown":3,"total":5}')
  })

  it('both, in that order', () => {
    expect(filteredViewNote({ hiddenLabels: ['Setting'], search: 'x', shown: 1, total: 2 }, t))
      .toMatch(/hidden_columns.*; export\.filtered_view\.search/)
  })

  it.each([['en', en], ['es', es], ['pt', pt]])('%s has the texts', (_l, dict) => {
    const fv = dict.export && dict.export.filtered_view
    expect(typeof fv.title).toBe('string')
    expect(fv.hidden_columns).toContain('{columns}')
    expect(fv.search).toEqual(expect.stringContaining('{term}'))
    expect(fv.search).toEqual(expect.stringContaining('{shown}'))
    expect(fv.search).toEqual(expect.stringContaining('{total}'))
  })
})
