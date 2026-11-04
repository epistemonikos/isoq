// Publishing rules (issue #169) as pure functions.
//
// Mirror of the server's auth_server/libs/publish_rules.py. Both sides are tested against
// the same case table (tests/unit/fixtures/publish_rules_cases.json, a byte-for-byte copy
// of the server's tests/fixtures/publish_rules_cases.json): change both together.
//
// Python and JS must answer identically, so this module never uses \s, \S, \d or trim():
// their Unicode sets differ between the two languages. Spaces come from SPACE_CLASS and
// letters are counted by code point.

// Exactly this set counts as a space (same string as the server).
export const SPACE_CLASS =
  ' \t\n\r\f\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff'

export const DEFAULT_LICENSE = 'CC-BY-NC-ND'

// Order of projectMissingFields results.
export const R1_FIELDS = [
  'name', 'authors', 'author', 'author_email', 'review_question',
  'complete_by_author', 'lists_authors', 'url_doi'
]

const SPACES = new RegExp('[' + SPACE_CLASS + ']', 'g')
const EDGES = new RegExp('^[' + SPACE_CLASS + ']+|[' + SPACE_CLASS + ']+$', 'g')
const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
const URL = /^(http|https):\/\/[^ "]+$/
const DOI = new RegExp('^(doi:)?10\\.[0-9]{4,9}/[^' + SPACE_CLASS + ']+$')

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v)

// Number of non-space characters (by code point); 0 when value is not a string.
export function countLetters (value) {
  if (typeof value !== 'string') return 0
  return Array.from(value.replace(SPACES, '')).length
}

export function hasMinLetters (value, minimum = 3) {
  return countLetters(value) >= minimum
}

// true/'true' -> true, false/'false' -> false, anything else (even 'True') -> null.
export function asAnswer (value) {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return null
}

const stripEdges = value => value.replace(EDGES, '')

export function validEmail (value) {
  if (typeof value !== 'string') return false
  return EMAIL.test(stripEdges(value))
}

export function validUrlOrDoi (value) {
  if (typeof value !== 'string') return false
  const text = stripEdges(value)
  return URL.test(text) || DOI.test(text)
}

export function effectiveLicense (value) {
  if (typeof value !== 'string' || !stripEdges(value)) return DEFAULT_LICENSE
  return value
}

const nonBlank = value => countLetters(value) > 0

// R2: name, cerqual option, cerqual explanation and at least one reference.
// Only the list's own `cerqual` is read, never `evidence_profile`.
export function isFindingComplete (list) {
  if (!isObject(list)) return false
  const cerqual = list.cerqual
  if (!isObject(cerqual)) return false
  return Boolean(
    nonBlank(list.name) &&
    cerqual.option !== undefined && cerqual.option !== null &&
    nonBlank(cerqual.explanation) &&
    // JS needs an array where Python only checks truthiness; Mongo stores an array or nothing.
    Array.isArray(list.references) && list.references.length > 0
  )
}

// R1: ordered subset of R1_FIELDS that the project still lacks.
export function projectMissingFields (project) {
  const p = isObject(project) ? project : {}
  const missing = []
  for (const key of ['name', 'authors', 'author', 'review_question']) {
    if (!hasMinLetters(p[key])) missing.push(key)
  }
  if (!validEmail(p.author_email)) missing.push('author_email')
  const byAuthor = asAnswer(p.complete_by_author)
  if (byAuthor === null) missing.push('complete_by_author')
  if (byAuthor === false && !hasMinLetters(p.lists_authors)) missing.push('lists_authors')
  if (asAnswer(p.published_status) === true && !validUrlOrDoi(p.url_doi)) missing.push('url_doi')
  return R1_FIELDS.filter(f => missing.includes(f))
}

// Mirror of the server's _as_bool(value, default=True) for `private`: a boolean as is,
// any string is private only if it equals 'true' (edges stripped, lower-cased), anything
// else is private.
function privateAsBool (value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return stripEdges(value).toLowerCase() === 'true'
  return true
}

// Mirror of the server's is_project_public: public_type wins; otherwise `private` as boolean.
export function isProjectPublic (project) {
  if (!isObject(project)) return false
  if (project.public_type !== undefined && project.public_type !== null) {
    return project.public_type !== 'private'
  }
  return !privateAsBool(project.private)
}

// R4: visible = complete and in the published snapshot; no snapshot (absent or empty)
// means every complete list.
export function isFindingVisible (list, project) {
  if (!isFindingComplete(list)) return false
  const ids = isObject(project) ? project.published_list_ids : null
  if (!Array.isArray(ids) || ids.length === 0) return true
  return ids.includes(list.id)
}
