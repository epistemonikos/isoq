
import Commons from '@/utils/commons'

// Mock i18n
jest.mock('@/plugins/i18n', () => ({
  i18n: {
    t: (key) => {
      const translations = {
        'common.et_al': ' et al. ',
        'common.and': ' and ',
        'common.author_not_found': 'author(s) not found'
      }
      return translations[key] || key
    }
  }
}))

describe('Author formatting reproduction', () => {
  it('should return "CaCao C et al. 2023" for ["CaCao C", "Author 2", "Author 3"]', () => {
    const reference = {
      authors: ['CaCao C', 'Author 2', 'Author 3'],
      publication_year: '2023'
    }
    const result = Commons.parseReference(reference, true, false)
    expect(result).toBe('CaCao C et al. 2023')
  })

  it('now returns "CaCao C et al. 2023" for ["CaCao, C", "Author 2", "Author 3"]', () => {
    const reference = {
      authors: ['CaCao, C', 'Author 2', 'Author 3'],
      publication_year: '2023'
    }
    const result = Commons.parseReference(reference, true, false)
    expect(result).toBe('CaCao C et al. 2023')
  })

  it('handles already formatted string by returning it as-is', () => {
    const reference = {
      authors: 'CaCao C et al. 2023', // ALREADY a string
      publication_year: '2023'
    }
    const result = Commons.parseReference(reference, true, false)
    expect(result).toBe('CaCao C et al. 2023')
  })
})
