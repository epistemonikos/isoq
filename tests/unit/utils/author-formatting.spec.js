
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
  it('should return "CaCao et al. 2023" for ["CaCao C", "Author 2", "Author 3"]', () => {
    const reference = {
      authors: ['CaCao C', 'Author 2', 'Author 3'],
      publication_year: '2023'
    }
    const result = Commons.parseReference(reference, true, false)
    expect(result).toBe('CaCao et al. 2023')
  })

  it('returns "CaCao et al. 2023" for ["CaCao, C", "Author 2", "Author 3"]', () => {
    const reference = {
      authors: ['CaCao, C', 'Author 2', 'Author 3'],
      publication_year: '2023'
    }
    const result = Commons.parseReference(reference, true, false)
    expect(result).toBe('CaCao et al. 2023')
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

describe('Commons.getLastName', () => {
  it('extracts first token from "Lastname, Firstname" format', () => {
    expect(Commons.getLastName('Doe, J.')).toBe('Doe')
    expect(Commons.getLastName('Smith, Alice')).toBe('Smith')
  })

  it('extracts first word from space-separated full name format', () => {
    expect(Commons.getLastName('Bicakli Derya Hopanci')).toBe('Bicakli')
    expect(Commons.getLastName('Abukari Alhassan Sibdow')).toBe('Abukari')
  })

  it('handles single-token name', () => {
    expect(Commons.getLastName('Aristotle')).toBe('Aristotle')
  })
})

describe('Commons.getAuthorsFormat', () => {
  it('formats single author as "Lastname, year"', () => {
    expect(Commons.getAuthorsFormat(['Doe, J.'], '2020')).toBe('Doe 2020')
  })

  it('formats two authors as "Lastname1 & Lastname2, year"', () => {
    expect(Commons.getAuthorsFormat(['Abukari Alhassan Sibdow', 'Acheampong Agela Kwartemaa'], '2021')).toBe('Abukari & Acheampong 2021')
  })

  it('formats three or more authors as "Lastname et al. year"', () => {
    expect(Commons.getAuthorsFormat(['Bicakli Derya Hopanci', 'Author 2', 'Author 3'], '2019')).toBe('Bicakli et al. 2019')
  })

  it('returns string authors as-is', () => {
    expect(Commons.getAuthorsFormat('already formatted', '2020')).toBe('already formatted')
  })

  it('returns author_not_found for empty array', () => {
    expect(Commons.getAuthorsFormat([], '2020')).toBe('author(s) not found')
  })
})
