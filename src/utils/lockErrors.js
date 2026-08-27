import { refLockKeyFromUrl } from '@/utils/refLockUrls'

// A rejection on a granular write that the concurrency layer already explains on its
// own: 409 goes out as `ref-lock-conflict` (with the holder's name and the text kept
// locally), 403 as `permission-denied`.
const ANNOUNCED_STATUSES = [409, 403]

// The item-version check answers on the same URLs and with the same 409, but it is a
// different axis: the lock decides WHO may write, the version decides whether what is
// about to be written was read before somebody else changed it. Its rejections have no
// announcement of their own — the conflict channel talks about locks, and here the user
// does hold theirs. Staying silent would drop a save with no signal at all.
const VERSION_REASONS = new Set(['version_conflict', 'invalid_version'])

/**
 * True when a failed save has already been reported to the user by the lock channel.
 *
 * Every editor's `catch` used to add "could not save, please try again" on top of that
 * message. Two toasts said contradictory things about one event, and the generic one
 * gave advice that cannot work: retrying does nothing while somebody else holds the
 * lock. Verified in the browser on 2026-08-19.
 */
export function isLockRejection (error) {
  const status = error && error.response && error.response.status
  if (!ANNOUNCED_STATUSES.includes(status)) return false
  if (isVersionRejection(error)) return false
  const url = (error.config && error.config.url) || ''
  return Boolean(refLockKeyFromUrl(url))
}

/**
 * True when the server rejected the write over the item's version rather than its lock.
 *
 * Reads `reason` and nothing else: the status and the URL are identical to a lock
 * conflict, so they cannot tell the two apart. A 409 with no `reason` is a lock
 * conflict, which is what every 409 was before this check existed.
 */
export function isVersionRejection (error) {
  const reason = error && error.response && error.response.data &&
    error.response.data.reason
  return VERSION_REASONS.has(reason)
}
