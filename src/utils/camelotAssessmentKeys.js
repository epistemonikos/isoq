/**
 * Single source of truth for the Step 4 fit-assessment grid (FA1-FA9 + OA).
 *
 * The FA/OA names do not exist in the database: they are positions inside
 * `isoqf_assessments.items[].stages[].options[]`. Endpoint D puts that position
 * in the URL (`/item/<ref_id>/stage/<k>/option/<i>`) and the ref-lock key is
 * built from the RAW path strings, so this mapping is part of the API contract
 * now — not just a set of table headers.
 */

// Mirrors ASSESSMENT_STAGE_OPTION_COUNTS in the backend's libs/assessments.py.
export const ASSESSMENT_STAGE_OPTION_COUNTS = [4, 4, 1, 1]

export const ASSESSMENT_CELLS = [
  { key: 'fa1', stage: 0, option: 0 },
  { key: 'fa2', stage: 0, option: 1 },
  { key: 'fa3', stage: 0, option: 2 },
  { key: 'fa4', stage: 0, option: 3 },
  { key: 'fa5', stage: 1, option: 0 },
  { key: 'fa6', stage: 1, option: 1 },
  { key: 'fa7', stage: 1, option: 2 },
  { key: 'fa8', stage: 1, option: 3 },
  { key: 'fa9', stage: 2, option: 0 },
  { key: 'oa', stage: 3, option: 0 }
]

// Backend regex, mirrored exactly. Greedy on purpose: 'R1X::s0::o0' must resolve
// to 'R1X', not to 'R1' — matching by prefix would manufacture false conflicts.
const LEAF_KEY_RE = /^(.+)::s\d+::o\d+$/

/**
 * 'stage-option' form of the same positions ('0-0' … '3-0'). The Step 4 summary
 * table identifies its columns this way, in its filters and its visibility
 * toggles — a fourth spelling of the grid that has to stay in step with the
 * other three.
 */
export const ASSESSMENT_POSITION_KEYS = ASSESSMENT_CELLS.map(
  cell => `${cell.stage}-${cell.option}`
)

export function positionKeyOf (cellKey) {
  const position = stageOptionOf(cellKey)
  return position ? `${position.stage}-${position.option}` : null
}

export function stageOptionOf (cellKey) {
  const cell = ASSESSMENT_CELLS.find(c => c.key === cellKey)
  return cell ? { stage: cell.stage, option: cell.option } : null
}

export function cellKeyOf (stage, option) {
  const cell = ASSESSMENT_CELLS.find(c => c.stage === stage && c.option === option)
  return cell ? cell.key : null
}

/**
 * Normalizes a path segment to its canonical spelling, or null if it isn't one.
 * '00', '+1' and ' 1' are rejected even though Number() accepts them: the
 * backend answers 400 for those, and a key built from '00' would read
 * `…::s00::o0` — a different lock than the one the client acquired.
 */
export function canonicalIndex (value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'number' && typeof value !== 'string') return null
  const asNumber = Number(value)
  if (!Number.isInteger(asNumber) || asNumber < 0) return null
  const canonical = String(asNumber)
  // Rejects any spelling Number() would silently accept ('00', ' 1', '+1').
  if (typeof value === 'string' && value !== canonical) return null
  return canonical
}

/**
 * Resolves the stage key to send in the URL. The backend keys stages by
 * `stages[].key`, NOT by array position, and legacy documents store that key as
 * a string — so read the stored key first and only fall back to the index.
 */
export function canonicalStageKey (stage, indexFallback) {
  const fromStage = stage ? canonicalIndex(stage.key) : null
  return fromStage !== null ? fromStage : canonicalIndex(indexFallback)
}

function optionCountOf (stageKey) {
  const index = Number(stageKey)
  return ASSESSMENT_STAGE_OPTION_COUNTS[index]
}

/** 'R1', 0, 2 -> 'R1::s0::o2'   |   null when the position isn't addressable */
export function leafLockKey (refId, stage, option) {
  if (!refId) return null
  const stageKey = canonicalIndex(stage)
  const optionIndex = canonicalIndex(option)
  if (stageKey === null || optionIndex === null) return null

  const count = optionCountOf(stageKey)
  if (count === undefined || Number(optionIndex) >= count) return null

  return `${refId}::s${stageKey}::o${optionIndex}`
}

/** 'R1::s0::o0' -> 'R1'   |   'R1' -> null (not a leaf key) */
export function baseRefOf (lockKey) {
  const match = LEAF_KEY_RE.exec(lockKey || '')
  return match ? match[1] : null
}

const LEAF_POSITION_RE = /::s(\d+)::o(\d+)$/

/** 'R1::s0::o2' -> '0-2', the stage-option form the UI keys its cells by. */
export function leafPositionOf (lockKey) {
  const match = LEAF_POSITION_RE.exec(lockKey || '')
  return match ? `${Number(match[1])}-${Number(match[2])}` : null
}

/**
 * The canonical empty study, mirroring the backend's `empty_item()`. Endpoint D
 * seeds this server-side, so it is only needed for the initial POST of a
 * document and to render rows that have no saved data yet.
 */
export function emptyAssessmentItem (refId, authors = '') {
  return {
    ref_id: refId,
    authors,
    stages: ASSESSMENT_STAGE_OPTION_COUNTS.map((count, stage) => ({
      key: stage,
      options: Array.from({ length: count }, () => ({
        option: null,
        text: '',
        notes: ''
      }))
    }))
  }
}
