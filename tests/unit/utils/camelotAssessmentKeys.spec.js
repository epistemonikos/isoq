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
  leafPositionOf,
  leafOf,
  isLeafComplete,
  areFitAssessmentsComplete,
  isOverallAssessmentBlocked,
  OVERALL_ASSESSMENT
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

// El criterio "esta celda está terminada" estaba escrito dos veces —en
// camelotCircleMixin y en AssessmentForm.explanationState— y el recordatorio de la OA
// iba a ser la tercera. Vive acá porque acá vive el direccionamiento de las celdas.
describe('camelotAssessmentKeys — isLeafComplete', () => {
  const itemWith = (option, text) => ({
    stages: [{ options: [{ option, text }] }]
  })

  it('is complete with a judgement and an explanation', () => {
    expect(isLeafComplete(itemWith('A', 'Porque X'), 0, 0)).toBe(true)
  })

  it('is not complete without a judgement, however long the text', () => {
    expect(isLeafComplete(itemWith(null, 'Porque X'), 0, 0)).toBe(false)
  })

  it('is not complete with an empty explanation', () => {
    expect(isLeafComplete(itemWith('A', ''), 0, 0)).toBe(false)
  })

  // Whitespace is not an explanation: the textarea makes it far too easy to leave.
  it('does not accept whitespace as an explanation', () => {
    expect(isLeafComplete(itemWith('A', '  \n\t '), 0, 0)).toBe(false)
  })

  // Legacy documents were seeded with {option, text} only, and some rows reached
  // the client without `text` at all.
  it('does not accept a missing or non-string explanation', () => {
    expect(isLeafComplete(itemWith('A', undefined), 0, 0)).toBe(false)
    expect(isLeafComplete(itemWith('A', 42), 0, 0)).toBe(false)
  })

  it('is not complete when the cell is not there to read', () => {
    expect(isLeafComplete(null, 3, 0)).toBe(false)
    expect(isLeafComplete({}, 3, 0)).toBe(false)
    expect(isLeafComplete(itemWith('A', 'Porque X'), 3, 0)).toBe(false)
    expect(isLeafComplete(itemWith('A', 'Porque X'), 0, 7)).toBe(false)
  })
})

describe('camelotAssessmentKeys — leafOf', () => {
  it('reads the leaf at a position', () => {
    const item = emptyAssessmentItem('R1')
    item.stages[3].options[0].option = 'C'

    expect(leafOf(item, 3, 0)).toEqual({ option: 'C', text: '', notes: '' })
  })

  it('returns null instead of throwing on a half-loaded item', () => {
    expect(leafOf(null, 0, 0)).toBeNull()
    expect(leafOf({ stages: [] }, 0, 0)).toBeNull()
    expect(leafOf(emptyAssessmentItem('R1'), 2, 3)).toBeNull()
  })
})

describe('camelotAssessmentKeys — OVERALL_ASSESSMENT', () => {
  // Derivada, no escrita: un literal 3 repartido por los componentes es la clase de dato
  // que sobrevive a que la grilla cambie de forma.
  it('is the position of the OA cell in the grid', () => {
    expect(OVERALL_ASSESSMENT).toEqual({ stage: 3, option: 0 })
    expect(OVERALL_ASSESSMENT).toEqual(stageOptionOf('oa'))
  })
})


/**
 * La overall assessment se emite «tomando en consideración» los nueve fit assessments.
 * Estos dos predicados son los que deciden si el editor de la OA se puede abrir; viven
 * en el util y no en los componentes porque hay tres puertas al mismo editor, y una
 * regla contestada por separado en cada una es una que deja entrar donde otra frenó.
 */

const FIT_ASSESSMENTS = ASSESSMENT_CELLS.filter(cell => cell.key !== 'oa')

/** Un estudio con las celdas que diga `only` juzgadas Y explicadas. */
function study (only = () => true) {
  const item = emptyAssessmentItem('R1', 'Autor 2020')
  ASSESSMENT_CELLS.filter(only).forEach(({ stage, option }) => {
    item.stages[stage].options[option] = { option: 'B', text: 'porque X', notes: '' }
  })
  return item
}

const isFa = cell => cell.key !== 'oa'

describe('camelotAssessmentKeys — areFitAssessmentsComplete', () => {
  it('es verdadero con los nueve FA juzgados y explicados, aunque la OA esté vacía', () => {
    expect(areFitAssessmentsComplete(study(isFa))).toBe(true)
  })

  // Uno por cada FA ausente: si el hueco cayera siempre en el mismo lado de la grilla,
  // un predicado que mirara sólo una etapa pasaría igual.
  it.each(FIT_ASSESSMENTS.map(cell => [cell.key, cell]))(
    'es falso cuando falta %s y los otros ocho están',
    (_key, missing) => {
      const item = study(cell => isFa(cell) && cell.key !== missing.key)
      expect(areFitAssessmentsComplete(item)).toBe(false)
    }
  )

  it('es falso con los nueve juzgados pero sin explicación', () => {
    const item = emptyAssessmentItem('R1', 'Autor 2020')
    FIT_ASSESSMENTS.forEach(({ stage, option }) => {
      item.stages[stage].options[option].option = 'B'
    })
    expect(areFitAssessmentsComplete(item)).toBe(false)
  })

  it('es falso cuando una explicación es sólo espacios en blanco', () => {
    const item = study(isFa)
    item.stages[1].options[0].text = '  \n\t '
    expect(areFitAssessmentsComplete(item)).toBe(false)
  })

  // Documentos viejos que nunca escribieron `text`: no hay campo que mirar.
  it('es falso cuando una hoja legada no trae el campo text', () => {
    const item = study(isFa)
    delete item.stages[2].options[0].text
    expect(areFitAssessmentsComplete(item)).toBe(false)
  })

  it.each([[null], [undefined], [{}], [{ stages: [] }]])(
    'es falso y no lanza con un ítem que no cargó (%p)',
    (item) => {
      expect(areFitAssessmentsComplete(item)).toBe(false)
    }
  )
})

describe('camelotAssessmentKeys — isOverallAssessmentBlocked', () => {
  const oaOf = item => item.stages[OVERALL_ASSESSMENT.stage].options[OVERALL_ASSESSMENT.option]

  it('bloquea un estudio vacío', () => {
    expect(isOverallAssessmentBlocked(emptyAssessmentItem('R1', 'A'))).toBe(true)
  })

  it('bloquea con ocho de los nueve FA listos', () => {
    const item = study(cell => isFa(cell) && cell.key !== 'fa9')
    expect(isOverallAssessmentBlocked(item)).toBe(true)
  })

  it('abre con los nueve FA listos y la OA todavía vacía', () => {
    expect(isOverallAssessmentBlocked(study(isFa))).toBe(false)
  })

  // El gate ordena el trabajo; no encierra un dato que alguien ya escribió.
  it('abre una OA ya emitida aunque no haya un solo FA hecho', () => {
    const item = emptyAssessmentItem('R1', 'A')
    Object.assign(oaOf(item), { option: 'C', text: 'ya la escribí' })
    expect(isOverallAssessmentBlocked(item)).toBe(false)
  })

  /**
   * El caso del encierro. Elegir el nivel de la OA y salir con «hacerlo más tarde» deja
   * esta hoja persistida por el autoguardado. Bloquearla sería reclamar la explicación
   * cerrando la única puerta para escribirla: la celda diría «Explicación no agregada»
   * y no dejaría entrar a agregarla.
   */
  it('abre una OA con juicio y SIN explicación, con los FA incompletos', () => {
    const item = emptyAssessmentItem('R1', 'A')
    oaOf(item).option = 'C'
    expect(isOverallAssessmentBlocked(item)).toBe(false)
  })

  it('bloquea cuando el ítem todavía no cargó', () => {
    expect(isOverallAssessmentBlocked(null)).toBe(true)
  })
})
