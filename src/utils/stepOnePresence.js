/**
 * Who else is on Step 1 (#399). Step 1 takes no lock, by decision: anyone may delete
 * studies at any time. What it gets is presence, through the same endpoint and TTL as
 * the worksheet's, with this sentinel in place of a finding id. The findings list
 * (`presentReviewersOf`) only looks at real finding ids, so it never shows it.
 */
export const STEP_ONE_PRESENCE = '__step1__'

/** Names of the other people on Step 1, once each. */
export function othersOnStepOne (presence, currentUserId) {
  const names = new Map()
  ;(presence || []).forEach(entry => {
    if (!entry || entry.finding_id !== STEP_ONE_PRESENCE) return
    if (entry.user_id === currentUserId) return
    if (!names.has(entry.user_id)) names.set(entry.user_id, entry.user_name)
  })
  return [...names.values()]
}
