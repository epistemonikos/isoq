import { refLockKeyFromUrl } from '@/utils/refLockUrls'

// A rejection on a granular write that the concurrency layer already explains on its
// own: 409 goes out as `ref-lock-conflict` (with the holder's name and the text kept
// locally), 403 as `permission-denied`.
const ANNOUNCED_STATUSES = [409, 403]

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
  const url = (error.config && error.config.url) || ''
  return Boolean(refLockKeyFromUrl(url))
}
