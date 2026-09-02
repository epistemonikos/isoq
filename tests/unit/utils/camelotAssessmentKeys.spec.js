import {
  ASSESSMENT_CELLS,
  ASSESSMENT_STAGE_OPTION_COUNTS,
  stageOptionOf,
  cellKeyOf,
  canonicalIndex,
  canonicalStageKey,
  leafLockKey,
  baseRefOf,
  ASSESSMENT_POSITION_KEYS,
  positionKeyOf,
  emptyAssessmentItem,
  leafPositionOf
} from '@/utils/camelotAssessmentKeys'

describe('camelotAssessmentKeys — the FA/OA grid', () => {
  it('declares the 10 cells of Step 4 in reading order', () => {
    expect(ASSESSMENT_CELLS.map(c => c.key)).toEqual([
      'fa1', 'fa2', 'fa3', 'fa4', 'fa5', 'fa6', 'fa7', 'fa8', 'fa9', 'oa'
    ])
  })

  // The positions are the API contract of endpoint D, not just table headers.
  it.each([
    ['fa1', 0, 0], ['fa2', 0, 1], ['fa3', 0, 2], ['fa4', 0, 3],
    ['fa5', 1, 0], ['fa6', 1, 1], ['fa7', 1, 2], ['fa8', 1, 3],
    ['fa9', 2, 0],
    ['oa', 3, 0]
  ])('maps %s to stage %i / option %i', (key, stage, option) => {
    expect(stageOptionOf(key)).toEqual({ stage, option })
  })

  it('mirrors the backend stage sizes (4, 4, 1, 1)', () => {
    expect(ASSESSMENT_STAGE_OPTION_COUNTS).toEqual([4, 4, 1, 1])
  })

  it('resolves a position back to its cell key', () => {
    expect(cellKeyOf(1, 2)).toBe('fa7')
    expect(cellKeyOf(3, 0)).toBe('oa')
  })

  it('returns null for positions outside the grid', () => {
    expect(stageOptionOf('fa10')).toBeNull()
    expect(cellKeyOf(2, 1)).toBeNull()
    expect(cellKeyOf(4, 0)).toBeNull()
  })

  // The summary table identifies its columns as 'stage-option' strings.
  it('exposes the same grid in stage-option form, in the same order', () => {
    expect(ASSESSMENT_POSITION_KEYS).toEqual([
      '0-0', '0-1', '0-2', '0-3', '1-0', '1-1', '1-2', '1-3', '2-0', '3-0'
    ])
  })

  it('translates a cell key to its stage-option form', () => {
    expect(positionKeyOf('fa7')).toBe('1-2')
    expect(positionKeyOf('oa')).toBe('3-0')
    expect(positionKeyOf('nope')).toBeNull()
  })
})

describe('camelotAssessmentKeys — canonicalIndex', () => {
  it('accepts numbers and their canonical string form', () => {
    expect(canonicalIndex(0)).toBe('0')
    expect(canonicalIndex(3)).toBe('3')
    expect(canonicalIndex('2')).toBe('2')
  })

  // Not cosmetic: the lock key is built from the RAW path strings, so '00'
  // would yield `…::s00::o0` — a different key than the one we acquired.
  it.each(['00', '+1', ' 1', '1.0', '-1', 'abc', '', null, undefined, 1.5, NaN])(
    'rejects the non-canonical spelling %p',
    (value) => {
      expect(canonicalIndex(value)).toBeNull()
    }
  )
})

describe('camelotAssessmentKeys — canonicalStageKey', () => {
  it('accepts a numeric stage key', () => {
    expect(canonicalStageKey({ key: 1 }, 0)).toBe('1')
  })

  // Legacy documents store stages[].key as a string.
  it('accepts a stage key stored as a string', () => {
    expect(canonicalStageKey({ key: '2' }, 0)).toBe('2')
  })

  it('falls back to the array index when the stored key is unusable', () => {
    expect(canonicalStageKey({ key: '01' }, 3)).toBe('3')
    expect(canonicalStageKey({}, 2)).toBe('2')
    expect(canonicalStageKey(null, 1)).toBe('1')
  })

  it('returns null when neither the key nor the fallback is canonical', () => {
    expect(canonicalStageKey({ key: 'x' }, 'x')).toBeNull()
  })
})

describe('camelotAssessmentKeys — leafLockKey', () => {
  it('builds the composite key the backend expects', () => {
    expect(leafLockKey('6642af0000000000000000aa', 0, 2))
      .toBe('6642af0000000000000000aa::s0::o2')
  })

  it('accepts canonical string positions', () => {
    expect(leafLockKey('R1', '3', '0')).toBe('R1::s3::o0')
  })

  it('refuses to build a key from a non-canonical position', () => {
    expect(leafLockKey('R1', '00', 0)).toBeNull()
    expect(leafLockKey('R1', 0, '01')).toBeNull()
  })

  it('refuses a position outside the stage size', () => {
    expect(leafLockKey('R1', 2, 1)).toBeNull()
    expect(leafLockKey('R1', 3, 1)).toBeNull()
    expect(leafLockKey('R1', 4, 0)).toBeNull()
  })

  it('refuses an empty ref id', () => {
    expect(leafLockKey('', 0, 0)).toBeNull()
    expect(leafLockKey(null, 0, 0)).toBeNull()
  })
})

describe('camelotAssessmentKeys — baseRefOf', () => {
  it('extracts the study a leaf key belongs to', () => {
    expect(baseRefOf('R1::s0::o0')).toBe('R1')
    expect(baseRefOf('6642af0000000000000000aa::s1::o3'))
      .toBe('6642af0000000000000000aa')
  })

  it('returns null for a bare study key', () => {
    expect(baseRefOf('R1')).toBeNull()
  })

  // The regex is greedy on purpose: matching by prefix would make R1X a child
  // of R1 and manufacture conflicts that do not exist.
  it('does not treat a study whose id merely starts with another as its leaf', () => {
    expect(baseRefOf('R1X::s0::o0')).toBe('R1X')
    expect(baseRefOf('R1X::s0::o0')).not.toBe('R1')
  })

  it('survives malformed input', () => {
    expect(baseRefOf('')).toBeNull()
    expect(baseRefOf(null)).toBeNull()
    expect(baseRefOf('R1::s0')).toBeNull()
    expect(baseRefOf('R1::sX::o0')).toBeNull()
  })

  it('round-trips with leafLockKey', () => {
    expect(baseRefOf(leafLockKey('R1', 1, 3))).toBe('R1')
  })
})

describe('camelotAssessmentKeys — leafPositionOf', () => {
  it('extracts the stage-option position of a leaf key', () => {
    expect(leafPositionOf('R1::s0::o2')).toBe('0-2')
    expect(leafPositionOf('R1::s3::o0')).toBe('3-0')
  })

  it('returns null for anything that is not a leaf key', () => {
    expect(leafPositionOf('R1')).toBeNull()
    expect(leafPositionOf('')).toBeNull()
    expect(leafPositionOf(null)).toBeNull()
  })

  it('agrees with ASSESSMENT_POSITION_KEYS for every cell', () => {
    ASSESSMENT_CELLS.forEach(cell => {
      const key = leafLockKey('R1', cell.stage, cell.option)
      expect(leafPositionOf(key)).toBe(positionKeyOf(cell.key))
    })
  })
})

describe('camelotAssessmentKeys — emptyAssessmentItem', () => {
  it('builds the canonical 4/4/1/1 skeleton', () => {
    const item = emptyAssessmentItem('R1', 'Autor 2024')

    expect(item.ref_id).toBe('R1')
    expect(item.authors).toBe('Autor 2024')
    expect(item.stages.map(s => s.key)).toEqual([0, 1, 2, 3])
    expect(item.stages.map(s => s.options.length)).toEqual([4, 4, 1, 1])
  })

  // Documents seeded by the old client only had {option, text}; the backend
  // normalizes to three keys, so the skeleton has to match.
  it('gives every leaf the three canonical keys', () => {
    const item = emptyAssessmentItem('R1')

    item.stages.forEach(stage => stage.options.forEach(option => {
      expect(option).toEqual({ option: null, text: '', notes: '' })
    }))
  })

  it('has one leaf per cell of the grid', () => {
    const item = emptyAssessmentItem('R1')
    const leaves = item.stages.reduce((n, s) => n + s.options.length, 0)

    expect(leaves).toBe(ASSESSMENT_CELLS.length)
  })

  it('does not share leaf objects between stages', () => {
    const item = emptyAssessmentItem('R1')
    item.stages[0].options[0].option = 'A'

    expect(item.stages[0].options[1].option).toBeNull()
    expect(item.stages[1].options[0].option).toBeNull()
  })
})
