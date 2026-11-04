import cases from '../fixtures/publish_rules_cases.json'
import {
  SPACE_CLASS,
  hasMinLetters,
  countLetters,
  asAnswer,
  validEmail,
  validUrlOrDoi,
  projectMissingFields,
  isFindingComplete,
  effectiveLicense,
  isProjectPublic,
  isFindingVisible
} from '@/utils/publishRules'

// Same case table as the server (isoq_server_py310 tests/fixtures/publish_rules_cases.json).
const table = [
  ['has_min_letters', hasMinLetters],
  ['as_answer', asAnswer],
  ['valid_email', validEmail],
  ['valid_url_or_doi', validUrlOrDoi],
  ['project_missing_fields', projectMissingFields],
  ['is_finding_complete', isFindingComplete]
]

describe('publishRules shared case table', () => {
  test('every key of the table is covered', () => {
    const keys = Object.keys(cases).filter(k => k !== '_comment').sort()
    expect(keys).toEqual(table.map(([k]) => k).sort())
  })

  table.forEach(([key, fn]) => {
    describe(key, () => {
      it.each(cases[key].map(c => [JSON.stringify(c.input), c]))('%s', (_label, c) => {
        expect(fn(c.input)).toEqual(c.expected)
      })
    })
  })
})

describe('publishRules JS-side', () => {
  test('the space class is the server one', () => {
    expect(SPACE_CLASS).toBe(
      ' \t\n\r\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'
    )
  })

  test('effectiveLicense falls back to the default', () => {
    expect(effectiveLicense('')).toBe('CC-BY-NC-ND')
    expect(effectiveLicense('\ufeff')).toBe('CC-BY-NC-ND')
    expect(effectiveLicense(null)).toBe('CC-BY-NC-ND')
    expect(effectiveLicense('CC-BY')).toBe('CC-BY')
  })

  test('isProjectPublic', () => {
    expect(isProjectPublic({ public_type: 'fully' })).toBe(true)
    expect(isProjectPublic({ public_type: 'private', private: false })).toBe(false)
    expect(isProjectPublic({ private: 'false' })).toBe(true)
    expect(isProjectPublic({})).toBe(false)
    expect(isProjectPublic(null)).toBe(false)
  })

  test('letters are counted by code point', () => {
    const emoji = '\u{1F600}\u{1F600}\u{1F600}'
    expect(countLetters(emoji)).toBe(3)
    expect(hasMinLetters(emoji)).toBe(true)
  })

  test('isProjectPublic mirrors the server _as_bool for private (public_type absent)', () => {
    const pub = v => isProjectPublic({ private: v })
    expect(pub('False')).toBe(true)
    expect(pub(' false ')).toBe(true)
    expect(pub('')).toBe(true)
    expect(pub('no')).toBe(true)
    expect(pub('TRUE')).toBe(false)
    expect(pub(' true ')).toBe(false)
    expect(pub(1)).toBe(false)
    expect(pub(null)).toBe(false)
    expect(pub(true)).toBe(false)
    expect(pub(false)).toBe(true)
  })

  describe('isFindingVisible', () => {
    const F = { id: 'L1', name: 'F', cerqual: { option: 1, explanation: 'x' }, references: ['r'] }
    test('no snapshot or an empty one means every complete list', () => {
      expect(isFindingVisible(F, {})).toBe(true)
      expect(isFindingVisible(F, { published_list_ids: [] })).toBe(true)
    })
    test('snapshot restricts to its ids', () => {
      expect(isFindingVisible(F, { published_list_ids: ['L1'] })).toBe(true)
      expect(isFindingVisible(F, { published_list_ids: ['L2'] })).toBe(false)
    })
    test('an incomplete list is never visible', () => {
      const incomplete = { ...F, references: [] }
      expect(isFindingVisible(incomplete, { published_list_ids: ['L1'] })).toBe(false)
      expect(isFindingVisible(incomplete, {})).toBe(false)
    })
  })
})
