<template>
  <transition name="slide-down">
    <div v-if="showIndicator" class="offline-indicator" :class="statusClass">
      <div class="indicator-content">
        <span class="status-icon">
          <font-awesome-icon :icon="statusIcon" />
        </span>
        <span class="status-text">{{ statusText }}</span>
        <span v-if="pendingCount > 0" class="pending-badge">
          {{ pendingCount }} {{ pendingCount === 1 ? $t('offline.pendingOperation') : $t('offline.pendingOperations') }}
        </span>
        <button v-if="isOnline && pendingCount > 0" class="sync-btn" @click="syncNow">
          <font-awesome-icon icon="sync-alt" :spin="syncing" />
        </button>
        <button v-if="showRefresh" class="refresh-btn" @click="refreshPage">
          {{ $t('offline.refresh') }}
        </button>
      </div>
    </div>
  </transition>
</template>

<script>
import Api from '@/utils/Api'

const getOnlineStatus = () => Api.isOnline()
const setOnlineStatus = (status) => Api.setOnline(status)
const syncPendingOperations = () => Api.syncPendingOperations()
const getPendingOperationsCount = () => Api.getPendingCount()
// Icons are registered globally in main.js

export default {
  name: 'OfflineIndicator',
  data () {
    return {
      pendingCount: 0,
      syncing: false,
      checkInterval: null,
      showRefresh: false,
      syncedMessage: ''
    }
  },
  computed: {
    showIndicator () {
      return !this.isOnline || this.pendingCount > 0 || this.showRefresh
    },
    statusClass () {
      if (!this.isOnline) return 'offline'
      if (this.showRefresh) return 'synced'
      if (this.pendingCount > 0) return 'pending'
      return 'online'
    },
    statusIcon () {
      if (this.showRefresh) return 'sync-alt'
      return this.isOnline ? 'wifi' : 'exclamation-triangle'
    },
    statusText () {
      if (!this.isOnline) {
        return this.$t('offline.noConnection')
      }
      if (this.showRefresh) {
        return this.$t('offline.synced')
      }
      if (this.pendingCount > 0) {
        return this.$t('offline.syncPending')
      }
      return this.$t('offline.connected')
    }
  },
  mounted () {
    this.checkOnlineStatus()
    this.updatePendingCount()

    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
    window.addEventListener('offlineSync', this.handleSyncComplete)
    // A replay conflict surfaces with nothing open — the editor that made the change
    // was closed before the network came back — so the warning has to live in a
    // component that is always mounted.
    window.addEventListener('ref-lock-conflict', this.handleRefLockConflict)

    // Verificar estado y operaciones pendientes periódicamente
    this.checkInterval = setInterval(() => {
      this.checkOnlineStatus()
      this.updatePendingCount()
    }, 3000)
  },
  beforeDestroy () {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('offlineSync', this.handleSyncComplete)
    window.removeEventListener('ref-lock-conflict', this.handleRefLockConflict)
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  },
  methods: {
    handleRefLockConflict (event) {
      const detail = event.detail || {}
      const lockedBy = detail.lockedBy
      // Two failures that look identical in the payload and read as opposites to the
      // user: a replay of something written offline, versus a request that just lost
      // the lock while they sat in the editor. Only the queue knows which, so it says
      // so in `source`; defaulting to the offline wording is what made a live conflict
      // report as a sync problem.
      const live = detail.source !== 'replay'
      // `lock_not_held` carries no holder: the write simply had no lock, so there is
      // no name to blame and the message must not say "edited by undefined".
      let message
      if (live) {
        message = lockedBy
          ? this.$t('lock.live_conflict', { user: lockedBy })
          : this.$t('lock.live_conflict_no_user')
      } else {
        message = lockedBy
          ? this.$t('offline.syncConflict', { user: lockedBy })
          : this.$t('offline.syncConflictNoUser')
      }
      this.$bvToast.toast(message, {
        title: this.$t(live ? 'lock.live_conflict_title' : 'offline.syncConflictTitle'),
        variant: 'warning',
        solid: true,
        noAutoHide: true
      })
    },
    checkOnlineStatus () {
      // Verificar tanto navigator.onLine como el estado interno del API
      const status = navigator.onLine && getOnlineStatus()
      if (this.isOnline !== status) {
        this.$store.commit('SET_ONLINE', status)
      }
    },
    handleOnline () {
      // Resetear estado
      setOnlineStatus(true)
      this.$store.commit('SET_ONLINE', true)
      this.updatePendingCount()
      // Intentar sincronizar al volver online
      if (this.pendingCount > 0) {
        this.syncNow()
      }
    },
    handleOffline () {
      this.$store.commit('SET_ONLINE', false)
      this.showRefresh = false
    },
    handleSyncComplete (event) {
      const { syncedCount } = event.detail
      if (syncedCount > 0) {
        this.showRefresh = true
        this.updatePendingCount()
      }
    },
    async updatePendingCount () {
      try {
        this.pendingCount = await getPendingOperationsCount()
      } catch (error) {
        // console.warn('Error getting pending count:', error)
      }
    },
    async syncNow () {
      if (this.syncing || !navigator.onLine) return
      this.syncing = true
      try {
        await syncPendingOperations()
        await this.updatePendingCount()
        // Actualizar estado después de sync exitoso
        this.checkOnlineStatus()
      } catch (error) {
        // console.error('Sync error:', error)
      } finally {
        this.syncing = false
      }
    },
    refreshPage () {
      window.location.reload()
    }
  }
}
</script>

<style lang="scss" scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 8px 16px;
  font-size: 14px;
  text-align: center;
  transition: all 0.3s ease;

  &.offline {
    background-color: #dc3545;
    color: white;
  }

  &.pending {
    background-color: #ffc107;
    color: #212529;
  }

  &.online {
    background-color: #28a745;
    color: white;
  }

  &.synced {
    background-color: #17a2b8;
    color: white;
  }
}

.indicator-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.status-icon {
  font-size: 16px;
}

.pending-badge {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.sync-btn,
.refresh-btn {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(0, 0, 0, 0.1);
  }
}

.refresh-btn {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 500;
}

// Animación de entrada/salida
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter,
.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
