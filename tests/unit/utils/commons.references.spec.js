
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
    it('returns "Doe J. 2020; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref1, true)
      expect(result).toBe('Doe J. 2020; ')
    })

    it('returns "Doe J. 2020; Title 1" when onlyAuthors is false', () => {
      const result = Commons.parseReference(ref1, false)
      expect(result).toBe('Doe J. 2020; Title 1')
    })
  })

  describe('Scenario 2: Two Authors', () => {
    it('returns "Doe J. and Smith A. 2021; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref2, true)
      expect(result).toBe('Doe J. and Smith A. 2021; ')
    })
  })

  describe('Scenario 3: More than Two Authors', () => {
    it('returns "Doe J. et al. 2022; " when onlyAuthors is true', () => {
      const result = Commons.parseReference(ref3, true)
      expect(result).toBe('Doe J. et al. 2022; ')
    })
  })

  describe('Global Options', () => {
    it('respects hasSemicolon = false', () => {
      const result = Commons.parseReference(ref1, true, false)
      expect(result).toBe('Doe J. 2020')
    })

    it('handles empty authors array', () => {
      const result = Commons.parseReference({ authors: [], publication_year: '2020' }, true)
      expect(result).toBe('author(s) not found')
    })
  })
})
