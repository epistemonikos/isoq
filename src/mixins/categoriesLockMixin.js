import LockService from '@/services/lockService'
import { CATEGORIES_LOCK_KEY, findCategoriesLock } from '@/utils/categoriesLock'

// Misma cadencia que el sondeo de viewProject: no introduce un ritmo nuevo contra el servidor.
export const CATEGORIES_WAIT_POLL_MS = 15000

/**
 * Protocolo del lock del modal «Review finding groups». Es el de propertiesLockMixin
 * reducido a un solo anfitrión: el modal vive en viewProject y nadie más toma la clave,
 * así que no hace falta el registro de anfitriones que aquél lleva.
 *
 * Contrato con el anfitrión:
 *   categoriesLockProjectId()     — obligatorio.
 *   refreshBeforeCategoriesLock() — obligatorio. Promesa que RECHAZA si no pudo refrescar:
 *     habilitar sobre un catálogo viejo dejaría pisar lo que el otro acaba de guardar.
 *
 * Estados: idle · acquiring · held · denied · lost · forbidden · released_idle.
 */
export default {
  data () {
    return {
      categoriesLock: { status: 'idle', lockedBy: null }
    }
  },
  computed: {
    categoriesLockHeld () {
      return this.categoriesLock.status === 'held'
    }
  },
  created () {
    // En `$_`: no se dibujan.
    this.$_catsLockActive = false
    this.$_catsLockTimer = null
    // Cada entrada y cada salida abren una sesión nueva: un acquire, sondeo o refresco en
    // vuelo de una sesión anterior no actúa sobre la actual.
    this.$_catsLockSession = 0
    window.addEventListener('ref-lock-lost', this.onCategoriesLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onCategoriesLockLost)
    this.leaveCategoriesLock()
  },
  methods: {
    async enterCategoriesLock () {
      if (this.$_catsLockActive) return
      this.$_catsLockActive = true
      this.$_catsLockSession++
      this.stopCategoriesLockWait()
      await this.acquireCategoriesLock()
    },

    leaveCategoriesLock () {
      const wasActive = this.$_catsLockActive
      const wasHeld = this.categoriesLock.status === 'held'
      this.$_catsLockActive = false
      this.$_catsLockSession++
      this.stopCategoriesLockWait()
      this.categoriesLock = { status: 'idle', lockedBy: null }
      if (wasActive && wasHeld) LockService.releaseRef(CATEGORIES_LOCK_KEY)
    },

    async acquireCategoriesLock () {
      const session = this.$_catsLockSession
      this.categoriesLock = { status: 'acquiring', lockedBy: null }
      const result = await LockService.acquireRef(this.categoriesLockProjectId(), CATEGORIES_LOCK_KEY)
      if (session !== this.$_catsLockSession) {
        // Se cerró el modal mientras esperaba la respuesta: nadie más soltaría este lock.
        if (result.success) LockService.releaseRef(CATEGORIES_LOCK_KEY)
        return
      }
      if (result.success) {
        this.stopCategoriesLockWait()
        this.categoriesLock = { status: 'held', lockedBy: null }
        return
      }
      if (result.permissionDenied) {
        // No es que otro lo tenga: no hay nada que esperar.
        this.categoriesLock = { status: 'forbidden', lockedBy: null }
        return
      }
      this.categoriesLock = { status: 'denied', lockedBy: result.lockedBy || null }
      this.startCategoriesLockWait()
    },

    startCategoriesLockWait () {
      this.stopCategoriesLockWait()
      this.$_catsLockTimer = setInterval(this.checkCategoriesLockFree, CATEGORIES_WAIT_POLL_MS)
    },

    stopCategoriesLockWait () {
      if (this.$_catsLockTimer) clearInterval(this.$_catsLockTimer)
      this.$_catsLockTimer = null
    },

    async checkCategoriesLockFree () {
      const session = this.$_catsLockSession
      const listing = await LockService.probeRefLocks(this.categoriesLockProjectId())
      if (session !== this.$_catsLockSession || !this.$_catsLockTimer) return
      // Un listado que no respondió dice `[]`, y sin red `acquireRef` concede un grant
      // offline que no es un lock: los dos se leerían como «libre». Se sigue esperando.
      if (!listing.reachable || !this.$store.state.isOnline) return
      const user = this.$store.state.user || {}
      const other = findCategoriesLock(listing.locks, user.id)
      if (other) {
        this.categoriesLock = { ...this.categoriesLock, lockedBy: other.user_name || this.categoriesLock.lockedBy }
        return
      }
      this.stopCategoriesLockWait()
      await this.refreshThenAcquireCategoriesLock()
    },

    async refreshThenAcquireCategoriesLock () {
      const session = this.$_catsLockSession
      try {
        await this.refreshBeforeCategoriesLock()
      } catch (error) {
        if (session !== this.$_catsLockSession) return
        // Sin refresco no hay lock: se sigue esperando, sin nombrar a nadie.
        this.categoriesLock = { status: 'denied', lockedBy: null }
        this.startCategoriesLockWait()
        return
      }
      if (session !== this.$_catsLockSession) return
      if (!this.$store.state.isOnline) {
        this.startCategoriesLockWait()
        return
      }
      await this.acquireCategoriesLock()
    },

    /** El lock se perdió: por el latido (`ref-lock-lost`) o porque el servidor rechazó una escritura. */
    markCategoriesLockLost (lockedBy) {
      if (!this.$_catsLockActive) return
      this.categoriesLock = { status: 'lost', lockedBy: lockedBy || null }
      this.startCategoriesLockWait()
    },

    /** Para `onInactivityExpired` del anfitrión. No espera: se fue a almorzar. */
    expireCategoriesLock () {
      if (!this.$_catsLockActive) return
      const wasHeld = this.categoriesLock.status === 'held'
      this.stopCategoriesLockWait()
      this.categoriesLock = { status: 'released_idle', lockedBy: null }
      if (wasHeld) LockService.releaseRef(CATEGORIES_LOCK_KEY)
    },

    /** Botón «Seguir editando» del cartel: refresca el catálogo y vuelve a pedir el lock. */
    resumeCategoriesLock () {
      if (!this.$_catsLockActive) return Promise.resolve()
      return this.refreshThenAcquireCategoriesLock()
    },

    onCategoriesLockLost (event) {
      const detail = (event && event.detail) || {}
      if (detail.refId !== CATEGORIES_LOCK_KEY) return
      this.markCategoriesLockLost(detail.lockedBy)
    }
  }
}
