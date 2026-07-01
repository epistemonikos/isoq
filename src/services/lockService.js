import axios from 'axios'
import { store } from '../store'
import Api from '@/utils/Api'

const HEARBEAT_INTERVAL = 30000 // 30 seconds
const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutes

class LockService {
  constructor () {
    this.projectId = null
    this.heartbeatTimer = null
    this.idleTimer = null
    this.isLocked = false
    this.lockedBy = null

    // Granular per-ref lock state (Step 3 / Step 4 studies)
    this.currentRef = null       // { projectId, refId }
    this.refLocked = false
    this.refLockedBy = null
    this.refHeartbeatTimer = null

    // Bind idle handlers
    this.resetIdleTimer = this.resetIdleTimer.bind(this)

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
    }
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
        },

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
        // Use beacon or standard request?
        // Standard request is fine, but if page is closing, sendBeacon is better.
        // For now simple axios.
        await axios.delete(`/api/lock/${projectId}`, {
          headers: Api.getHeaders(),

        })
      } catch (e) {
        // Silently ignore 401 errors during release as they often happen during logout
        if (e.response && e.response.status === 401) {
          return
        }
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
        headers: Api.getHeaders(),

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

    this.currentRef = { projectId, refId }
    try {
      const response = await axios.post(
        `/api/lock/${projectId}/ref/${refId}`, {},
        { headers: { ...Api.getHeaders(), 'X-Suppress-Lock-Error': 'true' } }
      )
      if (response.data.status) {
        this.refLocked = true
        this.startRefHeartbeat()
        return { success: true }
      }
    } catch (error) {
      if (error.response && error.response.status === 409) {
        this.refLocked = false
        this.refLockedBy = error.response.data.locked_by
        return { success: false, lockedBy: this.refLockedBy }
      }
    }
    return { success: false, error: 'Unknown error' }
  }

  async releaseRef () {
    if (!this.isEnabled || !this.currentRef) return

    this.stopRefHeartbeat()
    this.refLocked = false

    const { projectId, refId } = this.currentRef
    this.currentRef = null

    if (store.getters.isLoggedIn && localStorage.getItem('l_s')) {
      try {
        await axios.delete(`/api/lock/${projectId}/ref/${refId}`, {
          headers: Api.getHeaders()
        })
      } catch (e) {
        if (e.response && e.response.status === 401) return
        console.error('Error releasing ref lock', e)
      }
    }
  }

  async refHeartbeat () {
    if (!this.currentRef || !this.refLocked) return
    if (!store.state.isOnline) return

    const { projectId, refId } = this.currentRef
    try {
      await axios.post(`/api/lock/${projectId}/ref/${refId}/heartbeat`, {}, {
        headers: Api.getHeaders()
      })
    } catch (error) {
      if (error.response && (error.response.status === 409 || error.response.status === 403 || error.response.status === 401)) {
        this.refLocked = false
        window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId } }))
      }
    }
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

export default new LockService()
