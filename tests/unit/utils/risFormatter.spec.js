import { formatReference, formatReferences, formatField } from '@/utils/risFormatter'

describe('risFormatter', () => {
  describe('formatField', () => {
    it('should format a simple field correctly', () => {
      const result = formatField('TI', 'Test Title')
      expect(result).toBe('TI  - Test Title\r\n')
    })

    it('should handle empty values', () => {
      const result = formatField('TI', '')
      expect(result).toBe('')
    })

    it('should handle null values', () => {
      const result = formatField('TI', null)
      expect(result).toBe('')
    })

    it('should handle undefined values', () => {
      const result = formatField('TI', undefined)
      expect(result).toBe('')
    })
  })

  describe('formatReference', () => {
    it('should format a complete reference with all fields', () => {
      const reference = {
        type: 'JOUR',
        title: 'Test Article',
        abstract: 'This is a test abstract',
        authors: ['Smith, J.', 'Doe, A.'],
        publication_year: '2024',
        database: 'PubMed',
        volume_number: '10',
        url: 'https://example.com',
        start_page: '123',
        isbn_issn: '1234-5678',
        date: '2024-01-15',
        user_definable: ['Custom field 1', 'Custom field 2']
      }

      const result = formatReference(reference)

      expect(result).toContain('TY  - JOUR\r\n')
      expect(result).toContain('TI  - Test Article\r\n')
      expect(result).toContain('AB  - This is a test abstract\r\n')
      expect(result).toContain('A1  - Smith, J.\r\n')
      expect(result).toContain('A2  - Doe, A.\r\n')
      expect(result).toContain('PY  - 2024\r\n')
      expect(result).toContain('DB  - PubMed\r\n')
      expect(result).toContain('VL  - 10\r\n')
      expect(result).toContain('UR  - https://example.com\r\n')
      expect(result).toContain('SP  - 123\r\n')
      expect(result).toContain('SN  - 1234-5678\r\n')
      expect(result).toContain('DA  - 2024-01-15\r\n')
      expect(result).toContain('C1  - Custom field 1\r\n')
      expect(result).toContain('C2  - Custom field 2\r\n')
      expect(result).toContain('ER  - \r\n')
    })

    it('should format a minimal reference with only required fields', () => {
      const reference = {
        type: 'JOUR',
        title: 'Minimal Article'
      }

      const result = formatReference(reference)

      expect(result).toContain('TY  - JOUR\r\n')
      expect(result).toContain('TI  - Minimal Article\r\n')
      expect(result).toContain('ER  - \r\n')
      expect(result).not.toContain('AB  -')
      expect(result).not.toContain('A1  -')
    })

    it('should handle reference with no authors', () => {
      const reference = {
        type: 'JOUR',
        title: 'No Author Article',
        authors: []
      }

      const result = formatReference(reference)

      expect(result).toContain('TY  - JOUR\r\n')
      expect(result).toContain('TI  - No Author Article\r\n')
      expect(result).not.toContain('A1  -')
      expect(result).toContain('ER  - \r\n')
    })

    it('should format multiple authors correctly', () => {
      const reference = {
        type: 'JOUR',
        title: 'Multi-Author Article',
        authors: ['Author One', 'Author Two', 'Author Three']
      }

      const result = formatReference(reference)

      expect(result).toContain('A1  - Author One\r\n')
      expect(result).toContain('A2  - Author Two\r\n')
      expect(result).toContain('A3  - Author Three\r\n')
    })

    it('should handle empty reference object', () => {
      const reference = {}

      const result = formatReference(reference)

      expect(result).toBe('ER  - \r\n')
    })

    it('should handle null reference', () => {
      const result = formatReference(null)

      expect(result).toBe('ER  - \r\n')
    })

    it('should escape special characters in fields', () => {
      const reference = {
        type: 'JOUR',
        title: 'Title with "quotes" and special chars: <>&'
      }

      const result = formatReference(reference)

      // RIS format doesn't require escaping, but we verify the content is preserved
      expect(result).toContain('TI  - Title with "quotes" and special chars: <>&\r\n')
    })

    it('should handle very long author lists', () => {
      const authors = Array.from({ length: 20 }, (_, i) => `Author ${i + 1}`)
      const reference = {
        type: 'JOUR',
        title: 'Many Authors',
        authors
      }

      const result = formatReference(reference)

      authors.forEach((author, index) => {
        expect(result).toContain(`A${index + 1}  - ${author}\r\n`)
      })
    })

    it('should handle multiple custom fields', () => {
      const reference = {
        type: 'JOUR',
        title: 'Custom Fields Test',
        user_definable: ['Field 1', 'Field 2', 'Field 3', 'Field 4', 'Field 5']
      }

      const result = formatReference(reference)

      expect(result).toContain('C1  - Field 1\r\n')
      expect(result).toContain('C2  - Field 2\r\n')
      expect(result).toContain('C3  - Field 3\r\n')
      expect(result).toContain('C4  - Field 4\r\n')
      expect(result).toContain('C5  - Field 5\r\n')
    })
  })

  describe('formatReferences', () => {
    it('should format multiple references', () => {
      const references = [
        {
          type: 'JOUR',
          title: 'First Article',
          authors: ['Smith, J.']
        },
        {
          type: 'BOOK',
          title: 'Second Book',
          authors: ['Doe, A.']
        }
      ]

      const result = formatReferences(references)

      expect(result).toContain('TY  - JOUR\r\n')
      expect(result).toContain('TI  - First Article\r\n')
      expect(result).toContain('A1  - Smith, J.\r\n')
      expect(result).toContain('TY  - BOOK\r\n')
      expect(result).toContain('TI  - Second Book\r\n')
      expect(result).toContain('A1  - Doe, A.\r\n')
      
      // Should have 2 ER markers
      const erCount = (result.match(/ER  - \r\n/g) || []).length
      expect(erCount).toBe(2)
    })

    it('should handle empty array', () => {
      const result = formatReferences([])
      expect(result).toBe('')
    })

    it('should handle null input', () => {
      const result = formatReferences(null)
      expect(result).toBe('')
    })

    it('should handle undefined input', () => {
      const result = formatReferences(undefined)
      expect(result).toBe('')
    })

    it('should format single reference in array', () => {
      const references = [
        {
          type: 'JOUR',
          title: 'Single Article'
        }
      ]

      const result = formatReferences(references)

      expect(result).toContain('TY  - JOUR\r\n')
      expect(result).toContain('TI  - Single Article\r\n')
      expect(result).toContain('ER  - \r\n')
    })
  })
})
