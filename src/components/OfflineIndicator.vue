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
      </div>
    </div>
  </transition>
</template>

<script>
import Api from '@/utils/Api'
import { REFERENCE_DELETED_EVENT, referenceDeletedMessageKey } from '@/utils/referenceDeleted'

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
      checkInterval: null
    }
  },
  computed: {
    showIndicator () {
      return !this.isOnline || this.pendingCount > 0
    },
    statusClass () {
      if (!this.isOnline) return 'offline'
      if (this.pendingCount > 0) return 'pending'
      return 'online'
    },
    statusIcon () {
      return this.isOnline ? 'wifi' : 'exclamation-triangle'
    },
    statusText () {
      if (!this.isOnline) {
        return this.$t('offline.noConnection')
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
    // A replay conflict surfaces with nothing open — the editor that made the change
    // was closed before the network came back — so the warning has to live in a
    // component that is always mounted.
    window.addEventListener('ref-lock-conflict', this.handleRefLockConflict)
    // Mismo motivo, otro eje: acá no hay nadie editando, hay un nombre que ya existe.
    window.addEventListener('duplicate-key-conflict', this.handleDuplicateKeyConflict)
    // Un alta sin conexión ya no se encola, y hay llamadores que no avisan nada.
    window.addEventListener('offline-write-blocked', this.handleOfflineWriteBlocked)
    // Lo hecho sin conexión que el servidor no aceptó al volver.
    window.addEventListener('offline-replay-rejected', this.handleReplayRejected)
    // Un estudio que otra persona borró mientras acá estaba abierto (ver referenceDeleted.js).
    window.addEventListener(REFERENCE_DELETED_EVENT, this.handleReferenceDeleted)

    // Verificar estado y operaciones pendientes periódicamente
    this.checkInterval = setInterval(() => {
      this.checkOnlineStatus()
      this.updatePendingCount()
    }, 3000)
  },
  beforeDestroy () {
    window.removeEventListener('online', this.handleOnline)
    window.removeEventListener('offline', this.handleOffline)
    window.removeEventListener('ref-lock-conflict', this.handleRefLockConflict)
    window.removeEventListener('duplicate-key-conflict', this.handleDuplicateKeyConflict)
    window.removeEventListener('offline-write-blocked', this.handleOfflineWriteBlocked)
    window.removeEventListener('offline-replay-rejected', this.handleReplayRejected)
    window.removeEventListener(REFERENCE_DELETED_EVENT, this.handleReferenceDeleted)
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
    /**
     * El rename que la cola descartó porque el nombre ya existía.
     *
     * No ofrece reintentar a propósito: el payload lleva justamente el texto que choca,
     * así que un botón «volver a intentar» prometería algo que no puede pasar. Lo que la
     * persona necesita es saber CUÁL de sus cambios se cayó, y para eso el nombre tiene
     * que estar en el texto — de ahí que el evento lo traiga.
     */
    handleDuplicateKeyConflict (event) {
      const name = (event.detail && event.detail.text) || ''
      // Medido: hay 11 categorías sin campo `text`. «"" ya existe» no explica nada.
      const message = name
        ? this.$t('offline.duplicateKeyConflict', { name })
        : this.$t('offline.duplicateKeyConflictNoName')
      this.$bvToast.toast(message, {
        title: this.$t('offline.duplicateKeyConflictTitle'),
        variant: 'warning',
        solid: true,
        noAutoHide: true
      })
    },
    /**
     * Una escritura que no se hizo por falta de conexión. A diferencia de los conflictos al
     * sincronizar, acá no se perdió nada escrito: la persona sigue con el formulario lleno
     * y sólo tiene que reintentar cuando vuelva la red. Por eso se oculta solo.
     */
    handleOfflineWriteBlocked () {
      this.$bvToast.toast(this.$t('offline.writeBlocked'), {
        title: this.$t('offline.writeBlockedTitle'),
        variant: 'warning',
        solid: true
      })
    },
    /**
     * Cambios hechos sin conexión que el servidor rechazó al volver: ya salieron de la cola.
     * Un aviso por motivo (sin permiso, ya no existe, rechazado), porque lo que la persona
     * puede hacer es distinto en cada caso. No se oculta solo: es trabajo perdido, y cuando
     * llega puede no estar mirando.
     */
    handleReplayRejected (event) {
      const rejected = (event.detail && event.detail.rejected) || []
      const counts = {}
      rejected.forEach(item => { counts[item.reason] = (counts[item.reason] || 0) + 1 })
      Object.keys(counts).forEach(reason => {
        this.$bvToast.toast(this.$t(`offline.replayRejected.${reason}`, { count: counts[reason] }), {
          title: this.$t('offline.replayRejectedTitle'),
          variant: 'danger',
          solid: true,
          noAutoHide: true
        })
      })
    },
    /**
     * Otra persona borró en el Paso 1 un estudio que acá estaba abierto o se estaba
     * guardando. Un solo aviso por estudio y por momento: el mismo borrado llega por el
     * latido de cada lock que se tenía de ese estudio (`R1` y `R1::s0::o2` en el Paso 4) y,
     * si justo había un guardado en vuelo, también por su rechazo. No se oculta solo: lo que
     * no se guardó se perdió, y la persona tiene que enterarse aunque no esté mirando.
     */
    handleReferenceDeleted (event) {
      const detail = (event && event.detail) || {}
      if (!detail.refId) return
      const now = Date.now()
      const shown = this.referenceDeletedShownAt || (this.referenceDeletedShownAt = {})
      if (shown[detail.refId] && now - shown[detail.refId] < 5000) return
      shown[detail.refId] = now
      const key = referenceDeletedMessageKey(detail.source, detail.deletedBy)
      this.$bvToast.toast(this.$t(key, { name: detail.deletedBy }), {
        title: this.$t('reference_deleted.title'),
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

.sync-btn {
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
