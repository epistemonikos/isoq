import axios from 'axios'
import { store } from '../store'
import Api from '@/utils/Api'
import { baseRefOf } from '@/utils/camelotAssessmentKeys'

const HEARBEAT_INTERVAL = 30000 // 30 seconds
const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutes

class LockService {
  constructor () {
    this.projectId = null
    this.heartbeatTimer = null
    this.idleTimer = null
    this.isLocked = false
    this.lockedBy = null

    // Granular per-ref locks (Step 3 / Step 4). A Map rather than a single ref
    // because Step 4 must hold the bare study lock (`R1`, for isoqf_characteristics
    // via endpoint B) and the leaf lock of the cell being edited
    // (`R1::s0::o0`, endpoint D) at the same time — the backend grants both to
    // the same user, and a leaf lock does not authorize a write through B.
    this.refLocks = new Map() // refId -> projectId
    // Acquires in flight, so two callers asking for the same ref in the same
    // tick share one request instead of racing (the Step 4 modal does exactly
    // that on open: an explicit call plus the activeLeafRef watcher).
    this.pendingRefAcquires = new Map() // refId -> Promise
    // Refs whose editor was opened while offline: granted locally, with no server
    // lock behind them. On reconnect each one is retried (see retryOfflineRefs).
    this.offlineRefs = new Map() // refId -> projectId
    this.refLockedBy = null
    this.refHeartbeatTimer = null

    // Bind idle handlers
    this.resetIdleTimer = this.resetIdleTimer.bind(this)
    this.revalidateLocks = this.revalidateLocks.bind(this)

    // Listen for logout in other tabs
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        // 'l_s' is the session token key and 'user-data' is the user data key
        // When these are removed, it means the user logged out in another tab
        if ((event.key === 'l_s' || event.key === 'user-data') && !event.newValue) {
          this.handleLockLost()
          this.release()
        }
      })

      // Best-effort release when the tab is closed/navigated away from while
      // holding a lock. Uses 'pagehide' (bfcache-safe) rather than
      // 'beforeunload'. Won't help against a hard crash/power-off — that
      // requires a server-side heartbeat TTL.
      window.addEventListener('pagehide', () => {
        if (this.isLocked) this.release()
        if (this.refLocked) this.releaseRef()
      })

      // Offline grants are promises, not locks: turn them into real ones as soon as
      // there is a network again, while the editor is still open.
      window.addEventListener('online', () => { this.retryOfflineRefs() })

      // Chrome throttles setInterval in hidden tabs and, after ~5 minutes, drops it to
      // once a minute — slower than the server's 60s TTL. The lock lapses, somebody
      // else takes the study, and the editor comes back to a form that still looks
      // writable. Beating on the way back in collapses that window: the 409 arrives
      // now, not at the next scheduled tick.
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.revalidateLocks)
      }
    }
  }

  /**
   * Re-checks every held lock the moment the tab becomes visible again.
   * Only beats what we actually hold: a tab with no editor open must not talk to
   * the server every time the user tabs back to it.
   */
  revalidateLocks () {
    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
    if (this.refLocks.size) this.refHeartbeat()
    if (this.isLocked && this.projectId) this.heartbeat()
  }

  get refLocked () {
    return this.refLocks.size > 0
  }

  heldRefs () {
    return [...this.refLocks.keys()]
  }

  get isEnabled () {
    // Check feature flag. Note: env vars in Vue are usually string "true"/"false" or "on"/"off"
    const flag = process.env.ENABLE_CONCURRENCY_CONTROL
    return flag === 'true' || flag === 'on' || flag === true
  }

  async acquire (projectId) {
    if (!this.isEnabled) return { success: true }

    this.projectId = projectId
    try {
      const response = await axios.post(`/api/lock/${projectId}`, {}, {
        headers: {
          ...Api.getHeaders(),
          'X-Suppress-Lock-Error': 'true'
        }

      })
      if (response.data.status) {
        this.isLocked = true
        this.startHeartbeat()
        this.startIdleDetection()
        return { success: true }
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        this.isLocked = false
        this.lockedBy = error.response.data.locked_by
        return { success: false, lockedBy: this.lockedBy }
      }
    }
    return { success: false, error: 'Unknown error' }
  }

  async release () {
    if (!this.isEnabled || !this.projectId) return

    this.stopHeartbeat()
    this.stopIdleDetection()
    this.isLocked = false

    const projectId = this.projectId
    this.projectId = null

    // If we are not logged in, we shouldn't attempt to call the API
    // (this avoids 401 errors during logout)
    // We also check if l_s exists in localStorage as a double check
    if (store.getters.isLoggedIn && localStorage.getItem('l_s')) {
      try {
        // keepalive ensures the browser still sends this request even if the
        // page is being unloaded (tab close, navigation) right after this call.
        await fetch(`/api/lock/${projectId}`, {
          method: 'DELETE',
          headers: Api.getHeaders(),
          keepalive: true
        })
      } catch (e) {
        console.error('Error releasing lock', e)
      }
    }
  }

  async heartbeat () {
    if (!this.projectId || !this.isLocked) return

    if (!store.state.isOnline) {
      // Skip if offline, but don't stop timer?
      // Or stop timer to prevent error accumulation?
      // The server lock WILL expire.
      // We should notify connection lost?
      return
    }

    try {
      await axios.post(`/api/lock/${this.projectId}/heartbeat`, {}, {
        headers: Api.getHeaders()

      })
    } catch (error) {
      if (error.response && (error.response.status === 409 || error.response.status === 403 || error.response.status === 401)) {
        // Lock lost!
        this.handleLockLost()
      }
    }
  }

  startHeartbeat () {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => this.heartbeat(), HEARBEAT_INTERVAL)
  }

  stopHeartbeat () {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = null
  }

  handleLockLost () {
    this.stopHeartbeat()
    this.isLocked = false
    // Notify app/component via event or callback?
    // For simplicity, dispatch a custom window event or use store
    window.dispatchEvent(new CustomEvent('lock-lost', { detail: { projectId: this.projectId } }))
  }

  // Idle Detection
  startIdleDetection () {
    this.stopIdleDetection()
    window.addEventListener('mousemove', this.resetIdleTimer)
    window.addEventListener('keydown', this.resetIdleTimer)
    window.addEventListener('click', this.resetIdleTimer)
    this.resetIdleTimer()
  }

  stopIdleDetection () {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    window.removeEventListener('mousemove', this.resetIdleTimer)
    window.removeEventListener('keydown', this.resetIdleTimer)
    window.removeEventListener('click', this.resetIdleTimer)
  }

  resetIdleTimer () {
    if (this.idleTimer) clearTimeout(this.idleTimer)
    this.idleTimer = setTimeout(() => {
      this.handleIdle()
    }, IDLE_TIMEOUT)
  }

  handleIdle () {
    // Release lock due to inactivity
    this.release()
    window.dispatchEvent(new CustomEvent('lock-idle', { detail: { projectId: this.projectId } }))
  }

  // ── Granular per-ref locks (Step 3 / Step 4) ──────────────────────────
  async acquireRef (projectId, refId) {
    if (!this.isEnabled) return { success: true }

    // Offline-first wins over the lock. Without this branch the POST below would fail
    // on the network and fall through to `{ success: false }`, which every caller
    // reads as "read-only" — so turning the flag on would freeze editing offline,
    // while `Api` is happily queueing the mutations for replay. The grant is marked
    // `offline` (and remembered in offlineRefs) because it is a promise, not a lock:
    // retryOfflineRefs turns it into a real one as soon as there is a network.
    if (!store.state.isOnline) {
      this.offlineRefs.set(refId, projectId)
      return { success: true, offline: true }
    }

    if (this.refLocks.has(refId)) return { success: true }
    if (this.pendingRefAcquires.has(refId)) return this.pendingRefAcquires.get(refId)

    const pending = this.requestRefLock(projectId, refId)
    this.pendingRefAcquires.set(refId, pending)
    try {
      return await pending
    } finally {
      this.pendingRefAcquires.delete(refId)
    }
  }

  async requestRefLock (projectId, refId) {
    try {
      const response = await axios.post(
        `/api/lock/${projectId}/ref/${refId}`, {},
        { headers: { ...Api.getHeaders(), 'X-Suppress-Lock-Error': 'true' } }
      )
      if (response.data.status) {
        this.refLocks.set(refId, projectId)
        this.startRefHeartbeat()
        this.emitRefLocksChanged()
        return { success: true }
      }
    } catch (error) {
      // A 409 here can mean the exact ref is taken, or that someone holds the
      // same study at the other granularity (a leaf when we ask for the bare
      // study, or vice versa). The body is identical either way, so `locked_by`
      // is all the caller needs.
      if (error.response && error.response.status === 409) {
        this.refLockedBy = error.response.data.locked_by
        return { success: false, lockedBy: this.refLockedBy }
      }
      if (error.response && error.response.status === 403) {
        // Different from a 409: nobody else holds the lock, this user simply no
        // longer has can_write. Callers must not treat this as "locked by X".
        this.refLockedBy = null
        return { success: false, permissionDenied: true }
      }
    }
    return { success: false, error: 'Unknown error' }
  }

  /**
   * Turns every offline grant into a real server lock. A ref taken by someone else
   * meanwhile is reported through `ref-lock-lost` so the open editor can go
   * read-only instead of letting the user type into a save that would 409.
   */
  async retryOfflineRefs () {
    if (!this.isEnabled || !this.offlineRefs.size) return

    const pending = [...this.offlineRefs.entries()]
    this.offlineRefs.clear()

    await Promise.all(pending.map(async ([refId, projectId]) => {
      const result = await this.requestRefLock(projectId, refId)
      if (result.success) return
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId, lockedBy: result.lockedBy || null }
      }))
    }))
  }

  /** Releases one ref, or every held ref when called with no argument. */
  async releaseRef (refId = null) {
    if (!this.isEnabled) return

    // An editor closed while offline has nothing to release, but its pending retry
    // must go: reconnecting should not lock an entity nobody is editing any more.
    if (refId === null) {
      this.offlineRefs.clear()
    } else {
      this.offlineRefs.delete(refId)
    }

    const toRelease = refId === null
      ? [...this.refLocks.entries()]
      : (this.refLocks.has(refId) ? [[refId, this.refLocks.get(refId)]] : [])

    if (!toRelease.length) return

    toRelease.forEach(([ref]) => this.refLocks.delete(ref))
    if (!this.refLocks.size) this.stopRefHeartbeat()

    if (store.getters.isLoggedIn && localStorage.getItem('l_s')) {
      await Promise.all(toRelease.map(([ref, project]) => (
        fetch(`/api/lock/${project}/ref/${ref}`, {
          method: 'DELETE',
          headers: Api.getHeaders(),
          keepalive: true
        }).catch(e => console.error('Error releasing ref lock', e))
      )))
    }

    // Notify same-tab listeners (StepThree/StepFour) so they refresh their lock
    // table immediately instead of waiting for the next 15s poll.
    this.emitRefLocksChanged()
  }

  emitRefLocksChanged () {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    }
  }

  async refHeartbeat () {
    if (!this.refLocks.size) return
    if (!store.state.isOnline) return

    // Each ref is beaten independently: losing the leaf lock must not drop the
    // bare study lock the same modal is holding.
    await Promise.all([...this.refLocks.entries()].map(async ([refId, projectId]) => {
      try {
        await axios.post(`/api/lock/${projectId}/ref/${refId}/heartbeat`, {}, {
          headers: Api.getHeaders()
        })
      } catch (error) {
        if (error.response && (error.response.status === 409 || error.response.status === 403 || error.response.status === 401)) {
          this.refLocks.delete(refId)
          // Since 2026-08-19 a 409 on an expired-and-taken lock carries `locked_by`
          // (reason 'locked_by_other_user'). Passing it through is what lets the
          // read-only banner name the person instead of falling back to its
          // anonymous wording. A 401/403 has nobody to blame, hence the null.
          const lockedBy = (error.response.data && error.response.data.locked_by) || null
          window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId, lockedBy } }))
        }
      }
    }))

    if (!this.refLocks.size) this.stopRefHeartbeat()
  }

  startRefHeartbeat () {
    this.stopRefHeartbeat()
    this.refHeartbeatTimer = setInterval(() => this.refHeartbeat(), HEARBEAT_INTERVAL)
  }

  stopRefHeartbeat () {
    if (this.refHeartbeatTimer) clearInterval(this.refHeartbeatTimer)
    this.refHeartbeatTimer = null
  }

  async fetchRefLocks (projectId) {
    if (!this.isEnabled) return []
    try {
      const response = await axios.get(`/api/lock/${projectId}/refs`, {
        headers: Api.getHeaders()
      })
      return response.data || []
    } catch (e) {
      return []
    }
  }
}

/**
 * Reads `GET /api/lock/<project>/refs` from the point of view of one study.
 *
 * A lock clashes with another when both point at the same study through
 * different granularities and belong to different users. Two different leaves
 * of the same study do not clash — that is exactly what endpoint D enables.
 *
 * Compares by `user_name` because the endpoint does not expose `user_id`; two
 * collaborators sharing a name would read as one. The backend offered to add
 * `user_id` to the listing if that ever bites.
 */
export function studyLockState (locks, refId, myUserName) {
  const others = (locks || []).filter(lock => lock.user_name !== myUserName)
  const whole = others.find(lock => lock.ref_id === refId)
  const leaves = others.filter(lock => baseRefOf(lock.ref_id) === refId)

  return {
    // Someone holds the whole study: every one of its 10 cells is off limits.
    wholeStudyBlockedBy: whole ? whole.user_name : null,
    // Leaf key -> holder. Only those cells are off limits.
    lockedLeaves: new Map(leaves.map(lock => [lock.ref_id, lock.user_name])),
    // Endpoint B rewrites the whole item, so any lock on the study — at either
    // granularity — has to block it.
    saveWholeStudyBlocked: Boolean(whole) || leaves.length > 0
  }
}

export default new LockService()
