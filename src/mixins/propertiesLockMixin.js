import LockService from '@/services/lockService'
import { PROPERTIES_LOCK_KEY, findPropertiesLock } from '@/utils/propertiesLock'

// Misma cadencia que el sondeo de viewProject: no introduce un ritmo nuevo contra el servidor.
export const PROPERTIES_WAIT_POLL_MS = 15000

// Anfitriones que TIENEN el lock en esta pestaña del navegador. El lock es uno solo por
// usuario en el servidor, pero acá lo pueden sostener dos anfitriones a la vez: el link de
// un error de `can_publish` cierra el modal Publicar y abre la pestaña Propiedades, y el
// `@hidden` del modal llega DESPUÉS de que la pestaña ya lo tomó. Sin este registro el
// modal soltaría el lock de la pestaña.
const holders = new Set()

/**
 * Protocolo del lock de Propiedades, compartido por la pestaña, el modal de la lista y el
 * modal Publicar. El anfitrión decide cuándo entra y sale; este mixin decide todo lo demás.
 *
 * Contrato con el anfitrión:
 *   propertiesLockProjectId()    — obligatorio.
 *   refreshBeforePropertiesLock() — obligatorio. Promesa que RECHAZA si no pudo refrescar:
 *     habilitar sobre datos viejos dejaría pisar lo que el otro acaba de guardar.
 *
 * Estados: idle · acquiring · held · denied · lost · forbidden · released_idle.
 */
export default {
  data () {
    return {
      propertiesLock: { status: 'idle', lockedBy: null }
    }
  },
  computed: {
    propertiesLockHeld () {
      return this.propertiesLock.status === 'held'
    }
  },
  created () {
    // En `$_`: no se dibujan.
    this.$_propsLockActive = false
    this.$_propsLockTimer = null
    window.addEventListener('ref-lock-lost', this.onPropertiesLockLost)
  },
  beforeDestroy () {
    window.removeEventListener('ref-lock-lost', this.onPropertiesLockLost)
    this.leavePropertiesLock()
  },
  methods: {
    async enterPropertiesLock () {
      if (this.$_propsLockActive) return
      this.$_propsLockActive = true
      await this.acquirePropertiesLock()
    },

    leavePropertiesLock () {
      const wasActive = this.$_propsLockActive
      this.$_propsLockActive = false
      this.stopPropertiesLockWait()
      holders.delete(this._uid)
      this.propertiesLock = { status: 'idle', lockedBy: null }
      if (wasActive && holders.size === 0) LockService.releaseRef(PROPERTIES_LOCK_KEY)
    },

    async acquirePropertiesLock () {
      this.propertiesLock = { status: 'acquiring', lockedBy: null }
      const result = await LockService.acquireRef(this.propertiesLockProjectId(), PROPERTIES_LOCK_KEY)
      if (!this.$_propsLockActive) {
        // Se fue mientras esperaba la respuesta: nadie más soltaría este lock.
        if (result.success && holders.size === 0) LockService.releaseRef(PROPERTIES_LOCK_KEY)
        return
      }
      if (result.success) {
        holders.add(this._uid)
        this.propertiesLock = { status: 'held', lockedBy: null }
        return
      }
      if (result.permissionDenied) {
        // No es que otro lo tenga: no hay nada que esperar.
        this.propertiesLock = { status: 'forbidden', lockedBy: null }
        return
      }
      this.propertiesLock = { status: 'denied', lockedBy: result.lockedBy || null }
      this.startPropertiesLockWait()
    },

    startPropertiesLockWait () {
      this.stopPropertiesLockWait()
      this.$_propsLockTimer = setInterval(this.checkPropertiesLockFree, PROPERTIES_WAIT_POLL_MS)
    },

    stopPropertiesLockWait () {
      if (this.$_propsLockTimer) clearInterval(this.$_propsLockTimer)
      this.$_propsLockTimer = null
    },

    async checkPropertiesLockFree () {
      const locks = await LockService.fetchRefLocks(this.propertiesLockProjectId())
      // Salió, o ya lo consiguió por otro camino, mientras el sondeo estaba en vuelo.
      if (!this.$_propsLockActive || !this.$_propsLockTimer) return
      const user = this.$store.state.user || {}
      const other = findPropertiesLock(locks, user.id)
      if (other) {
        this.propertiesLock = { ...this.propertiesLock, lockedBy: other.user_name || this.propertiesLock.lockedBy }
        return
      }
      this.stopPropertiesLockWait()
      await this.refreshThenAcquirePropertiesLock()
    },

    async refreshThenAcquirePropertiesLock () {
      try {
        await this.refreshBeforePropertiesLock()
      } catch (error) {
        // Sin refresco no hay lock: se sigue esperando, y el cartel deja de nombrar a nadie
        // porque ya no sabemos quién está.
        this.propertiesLock = { status: 'denied', lockedBy: null }
        this.startPropertiesLockWait()
        return
      }
      if (!this.$_propsLockActive) return
      await this.acquirePropertiesLock()
    },

    onPropertiesLockLost (event) {
      const detail = (event && event.detail) || {}
      if (detail.refId !== PROPERTIES_LOCK_KEY || !this.$_propsLockActive) return
      holders.delete(this._uid)
      this.propertiesLock = { status: 'lost', lockedBy: detail.lockedBy || null }
      this.startPropertiesLockWait()
    },

    /** Para `onInactivityExpired` del anfitrión. No espera: se fue a almorzar. */
    expirePropertiesLock () {
      this.stopPropertiesLockWait()
      holders.delete(this._uid)
      this.propertiesLock = { status: 'released_idle', lockedBy: null }
      if (holders.size === 0) LockService.releaseRef(PROPERTIES_LOCK_KEY)
    },

    /** Botón «Seguir editando» del cartel. */
    resumePropertiesLock () {
      if (!this.$_propsLockActive) return Promise.resolve()
      return this.refreshThenAcquirePropertiesLock()
    }
  }
}
