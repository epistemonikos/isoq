import axios from 'axios'
import { store } from '../store'

const HEARBEAT_INTERVAL = 30000 // 30 seconds
const IDLE_TIMEOUT = 15 * 60 * 1000 // 15 minutes

class LockService {
  constructor () {
    this.projectId = null
    this.heartbeatTimer = null
    this.idleTimer = null
    this.isLocked = false
    this.lockedBy = null
    
    // Bind idle handlers
    this.resetIdleTimer = this.resetIdleTimer.bind(this)
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
        headers: { 'X-Suppress-Lock-Error': 'true' }
      })
      if (response.data.status) {
        this.isLocked = true
        this.startHeartbeat()
        this.startIdleDetection()
        return { success: true }
      }
    } catch (error) {
      console.log('LockService acquire error:', error)
      if (error.response) {
        console.log('LockService acquire error response:', error.response.status, error.response.data)
      }
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
    
    try {
      // Use beacon or standard request?
      // Standard request is fine, but if page is closing, sendBeacon is better.
      // For now simple axios.
      await axios.delete(`/api/lock/${this.projectId}`)
    } catch (e) {
      console.error('Error releasing lock', e)
    }
    this.projectId = null
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
      await axios.post(`/api/lock/${this.projectId}/heartbeat`)
    } catch (error) {
       if (error.response && (error.response.status === 409 || error.response.status === 403)) {
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
}

export default new LockService()
