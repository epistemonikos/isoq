/**
 * Reading a lock key out of a request URL. Lives apart from `Api` on purpose: it is a
 * pure string function, and the error helpers that need it must not have to pull in
 * axios, Dexie and i18n (nor be defeated by a test that automocks the HTTP client).
 * `Api` re-exports it so existing importers keep working.
 */
import { leafLockKey } from '@/utils/camelotAssessmentKeys'

// Endpoint D nests the cell position under /item/, so the raw split would yield
// '<ref_id>/stage/0/option/2' — a string that matches no lock the client holds.
// The lock the backend checks is the composite key '<ref_id>::s0::o2'.
const ITEM_LEAF_URL_RE = /\/item\/([^/]+)\/stage\/([^/]+)\/option\/([^/?]+)/
// Endpoint A locks the document, so its lock key is the id in the path, not a ref.
const SECTION_URL_RE = /\/(?:isoqf_findings|isoqf_lists)\/([^/]+)\/section\/[^/?]+/
const ITEM_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments|isoqf_extracted_data)\/[^/]+\/item\//
// The four column endpoints lock the table DOCUMENT rather than a row, so their key is
// `<doc_id>::fields`. Keeping it apart from the row key is the point: whoever edits
// columns must not block whoever edits a study.
const FIELD_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments)\/([^/]+)\/(?:field\/[^/?]+|fields\/order)/

function refLockKeyFromItemUrl (url) {
  const leaf = ITEM_LEAF_URL_RE.exec(url)
  if (leaf) {
    const [, refId, stage, option] = leaf
    return leafLockKey(refId, stage, option) || refId
  }
  return url.split('/item/')[1] || ''
}

/**
 * Lock key a granular write needs, or null when the URL is not a granular endpoint.
 * Endpoints B/C/D lock a row/cell (`ref_id`, `ref::sK::oI`); endpoint A locks the
 * document itself (`finding_id` / `list_id`); the column endpoints lock the table
 * document (`<doc_id>::fields`).
 */
export function refLockKeyFromUrl (url = '') {
  const section = SECTION_URL_RE.exec(url)
  if (section) return section[1]
  const field = FIELD_URL_RE.exec(url)
  if (field) return `${field[1]}::fields`
  if (ITEM_URL_RE.test(url)) return refLockKeyFromItemUrl(url) || null
  return null
}
