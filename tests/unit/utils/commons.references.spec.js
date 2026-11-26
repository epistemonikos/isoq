
import Commons from '@/utils/commons'

// Mock i18n
jest.mock('@/plugins/i18n', () => ({
  i18n: {
    t: jest.fn((key) => {
      const translations = {
        'common.et_al': ' et al. ',
        'common.and': ' and ',
        'common.author_not_found': 'author(s) not found'
      }
      return translations[key] || key
    })
  }
}))

describe('Commons.parseReference formatting', () => {
  const ref1 = { authors: ['Doe, J.'], publication_year: '2020', title: 'Title 1' }
  const ref2 = { authors: ['Doe, J.', 'Smith, A.'], publication_year: '2021', title: 'Title 2' }
  const ref3 = { authors: ['Doe, J.', 'Smith, A.', 'Brown, L.'], publication_year: '2022', title: 'Title 3' }

  describe('Scenario 1: Single Author', () => {
    it('returns "Doe, 2020; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref1, true)
      expect(result).toBe('Doe 2020; ')
    })

    it('returns "Doe, 2020; Title 1" when onlyAuthors is false', () => {
      const result = Commons.parseReference(ref1, false)
      expect(result).toBe('Doe 2020; Title 1')
    })
  })

  describe('Scenario 2: Two Authors', () => {
    it('returns "Doe & Smith, 2021; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref2, true)
      expect(result).toBe('Doe & Smith 2021; ')
    })
  })

  describe('Scenario 3: More than Two Authors', () => {
    it('returns "Doe et al. 2022; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref3, true)
      expect(result).toBe('Doe et al. 2022; ')
    })
  })

  describe('Global Options', () => {
    it('respects hasSemicolon = false', () => {
      const result = Commons.parseReference(ref1, true, false)
      expect(result).toBe('Doe 2020')
    })

    it('handles empty authors array', () => {
      const result = Commons.parseReference({ authors: [], publication_year: '2020' }, true)
      expect(result).toBe('author(s) not found')
    })
  })
})

// La impresión del perfil de evidencia lista las citas con `referencesWithNames`. Ordenaba
// con `.sort()` por código de carácter: una minúscula inicial («de Vries») o un acento
// («Álvarez») se iban detrás de la Z. El criterio es el mismo de todas las tablas.
describe('Commons.referencesWithNames — orden', () => {
  const references = [
    { id: 'rZ', authors: ['Zhang, L.'], publication_year: '2018' },
    { id: 'rV', authors: ['de Vries, J.'], publication_year: '2017' },
    { id: 'rA', authors: ['Álvarez, M.'], publication_year: '2016' },
    { id: 'rB', authors: ['Brown, K.'], publication_year: '2015' }
  ]

  it('ordena alfabéticamente sin mandar minúsculas ni acentos al final', () => {
    const result = Commons.referencesWithNames(['rZ', 'rV', 'rA', 'rB'], references)
    const surnames = result.split('; ').filter(Boolean).map(s => s.replace(/ \d{4}$/, ''))
    expect(surnames).toEqual(['Álvarez', 'Brown', 'de Vries', 'Zhang'])
  })
})
