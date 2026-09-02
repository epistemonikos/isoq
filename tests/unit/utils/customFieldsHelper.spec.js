import {
  isCustomField,
  extractCustomFields,
  cleanOrphanedCustomFieldKeys
} from '@/utils/customFieldsHelper'

describe('customFieldsHelper', () => {
  describe('isCustomField', () => {
    it('returns true for column_ prefixed keys', () => {
      expect(isCustomField('column_0')).toBe(true)
      expect(isCustomField('column_123')).toBe(true)
    })

    it('returns false for non-custom keys', () => {
      expect(isCustomField('ref_id')).toBe(false)
      expect(isCustomField('authors')).toBe(false)
      expect(isCustomField('actions')).toBe(false)
    })

    it('returns false for non-string values', () => {
      expect(isCustomField(null)).toBe(false)
      expect(isCustomField(undefined)).toBe(false)
      expect(isCustomField(123)).toBe(false)
    })
  })

  describe('extractCustomFields', () => {
    it('extracts only custom fields from an array', () => {
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'column_0', label: 'País' },
        { key: 'column_1', label: 'Año' }
      ]
      const result = extractCustomFields(fields)
      expect(result).toEqual([
        { key: 'column_0', label: 'País' },
        { key: 'column_1', label: 'Año' }
      ])
    })

    it('returns empty array for empty/null input', () => {
      expect(extractCustomFields(null)).toEqual([])
      expect(extractCustomFields([])).toEqual([])
      expect(extractCustomFields(undefined)).toEqual([])
    })
  })

  describe('cleanOrphanedCustomFieldKeys', () => {
    it('removes orphaned custom field keys from items', () => {
      const items = [
        { ref_id: '1', authors: 'Author A', column_0: 'Chile', column_1: '2020' },
        { ref_id: '2', authors: 'Author B', column_0: 'Argentina', column_1: '2021' }
      ]
      // column_0 was deleted, only column_1 remains
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'column_1', label: 'Año' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result).toEqual([
        { ref_id: '1', authors: 'Author A', column_1: '2020' },
        { ref_id: '2', authors: 'Author B', column_1: '2021' }
      ])
      // Ensure column_0 was removed
      expect(result[0]).not.toHaveProperty('column_0')
      expect(result[1]).not.toHaveProperty('column_0')
    })

    it('removes all custom keys when all custom fields are deleted', () => {
      const items = [
        { ref_id: '1', authors: 'Author A', column_0: 'Chile', column_1: '2020' }
      ]
      // No custom fields remain
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result).toEqual([
        { ref_id: '1', authors: 'Author A' }
      ])
      expect(result[0]).not.toHaveProperty('column_0')
      expect(result[0]).not.toHaveProperty('column_1')
    })

    it('preserves all keys when no custom fields were deleted', () => {
      const items = [
        { ref_id: '1', authors: 'Author A', column_0: 'Chile', column_1: '2020' }
      ]
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'column_0', label: 'País' },
        { key: 'column_1', label: 'Año' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result).toEqual([
        { ref_id: '1', authors: 'Author A', column_0: 'Chile', column_1: '2020' }
      ])
    })

    it('handles items without custom field values gracefully', () => {
      const items = [
        { ref_id: '1', authors: 'Author A' },
        { ref_id: '2', authors: 'Author B', column_0: 'Chile' }
      ]
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result).toEqual([
        { ref_id: '1', authors: 'Author A' },
        { ref_id: '2', authors: 'Author B' }
      ])
    })

    it('returns empty array for null/undefined items', () => {
      const fields = [{ key: 'column_0', label: 'Test' }]
      expect(cleanOrphanedCustomFieldKeys(null, fields)).toEqual([])
      expect(cleanOrphanedCustomFieldKeys(undefined, fields)).toEqual([])
      expect(cleanOrphanedCustomFieldKeys([], fields)).toEqual([])
    })

    it('handles null/undefined fields by removing all custom keys', () => {
      const items = [
        { ref_id: '1', column_0: 'Chile' }
      ]

      expect(cleanOrphanedCustomFieldKeys(items, null)).toEqual([
        { ref_id: '1' }
      ])
      expect(cleanOrphanedCustomFieldKeys(items, undefined)).toEqual([
        { ref_id: '1' }
      ])
    })

    it('preserves non-custom keys like camelot domain fields', () => {
      const items = [
        {
          ref_id: '1',
          authors: 'Author A',
          column_0: 'Chile',
          meta_domain_1: 'some value',
          research_design_1: 'another value'
        }
      ]
      // column_0 is deleted
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result[0]).toEqual({
        ref_id: '1',
        authors: 'Author A',
        meta_domain_1: 'some value',
        research_design_1: 'another value'
      })
    })

    it('cleans up previously orphaned keys (legacy data)', () => {
      // Simulates a case where orphaned keys were left from prior bugs
      const items = [
        { ref_id: '1', column_0: 'old orphan', column_1: 'another orphan', column_5: 'valid' }
      ]
      const fields = [
        { key: 'ref_id', label: 'ID' },
        { key: 'column_5', label: 'Active Field' }
      ]

      const result = cleanOrphanedCustomFieldKeys(items, fields)

      expect(result[0]).toEqual({ ref_id: '1', column_5: 'valid' })
      expect(result[0]).not.toHaveProperty('column_0')
      expect(result[0]).not.toHaveProperty('column_1')
    })
  })
})
