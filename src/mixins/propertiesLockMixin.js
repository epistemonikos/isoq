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
// Anfitriones adentro (entre enter y leave), tengan ya el lock o no. `holders` no alcanza
// para decidir si soltar: un anfitrión todavía en `acquiring` espera la MISMA promesa que
// el que se va (lockService deduplica los acquire en vuelo), y soltar en ese momento le
// quitaría el lock que está por recibir, dejándolo `held` sin lock ni latido.
const activeHosts = new Set()

function nobodyNeedsTheLock () {
  return holders.size === 0 && activeHosts.size === 0
}

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
    // Cada entrada y cada salida abren una sesión nueva. Un sondeo o un refresco en vuelo
    // de una sesión anterior NO debe actuar sobre la actual: en el modal de la lista la
    // sesión nueva puede ser de otro proyecto, y un refresco viejo lo cambiaría por el
    // anterior. `$_propsLockActive` no alcanza para eso: vuelve a ser true al re-entrar.
    this.$_propsLockSession = 0
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
      this.$_propsLockSession++
      activeHosts.add(this._uid)
      // Un sondeo armado por una sesión anterior no tiene nada que hacer en ésta.
      this.stopPropertiesLockWait()
      await this.acquirePropertiesLock()
    },

    leavePropertiesLock () {
      const wasActive = this.$_propsLockActive
      this.$_propsLockActive = false
      this.$_propsLockSession++
      this.stopPropertiesLockWait()
      holders.delete(this._uid)
      activeHosts.delete(this._uid)
      this.propertiesLock = { status: 'idle', lockedBy: null }
      if (wasActive && nobodyNeedsTheLock()) LockService.releaseRef(PROPERTIES_LOCK_KEY)
    },

    async acquirePropertiesLock () {
      const session = this.$_propsLockSession
      this.propertiesLock = { status: 'acquiring', lockedBy: null }
      const result = await LockService.acquireRef(this.propertiesLockProjectId(), PROPERTIES_LOCK_KEY)
      if (session !== this.$_propsLockSession) {
        // Se fue mientras esperaba la respuesta: nadie más soltaría este lock.
        if (result.success && nobodyNeedsTheLock()) LockService.releaseRef(PROPERTIES_LOCK_KEY)
        return
      }
      if (result.success) {
        // Un `ref-lock-lost` llegado con el acquire en vuelo pudo armar el sondeo: sobre un
        // `held` vería libre (el lock es propio) y refrescaría encima de lo que se escribe.
        this.stopPropertiesLockWait()
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
      const session = this.$_propsLockSession
      const listing = await LockService.probeRefLocks(this.propertiesLockProjectId())
      // Salió, o ya lo consiguió por otro camino, mientras el sondeo estaba en vuelo.
      if (session !== this.$_propsLockSession || !this.$_propsLockTimer) return
      // Un listado que no respondió dice `[]`, y sin red `acquireRef` concede un grant
      // offline que no es un lock: los dos se leerían como «libre» y habilitarían a quien
      // espera mientras otra persona sigue editando. Se sigue esperando.
      if (!listing.reachable || !this.$store.state.isOnline) return
      const user = this.$store.state.user || {}
      const other = findPropertiesLock(listing.locks, user.id)
      if (other) {
        this.propertiesLock = { ...this.propertiesLock, lockedBy: other.user_name || this.propertiesLock.lockedBy }
        return
      }
      this.stopPropertiesLockWait()
      await this.refreshThenAcquirePropertiesLock()
    },

    async refreshThenAcquirePropertiesLock () {
      const session = this.$_propsLockSession
      try {
        await this.refreshBeforePropertiesLock()
      } catch (error) {
        // Una sesión que ya terminó no arma nada: su sondeo quedaría huérfano y, al re-entrar,
        // refrescaría encima de lo que la persona está escribiendo.
        if (session !== this.$_propsLockSession) return
        // Sin refresco no hay lock: se sigue esperando, y el cartel deja de nombrar a nadie
        // porque ya no sabemos quién está.
        this.propertiesLock = { status: 'denied', lockedBy: null }
        this.startPropertiesLockWait()
        return
      }
      if (session !== this.$_propsLockSession) return
      if (!this.$store.state.isOnline) {
        // Se cayó la red durante el refresco: el grant offline no es un lock.
        this.startPropertiesLockWait()
        return
      }
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
      // Sigue adentro (puede retomar), así que no cuenta como alguien que necesite el lock;
      // otro anfitrión que esté entrando sí.
      const othersInside = [...activeHosts].some(uid => uid !== this._uid)
      if (holders.size === 0 && !othersInside) LockService.releaseRef(PROPERTIES_LOCK_KEY)
    },

    /** Botón «Seguir editando» del cartel. */
    resumePropertiesLock () {
      if (!this.$_propsLockActive) return Promise.resolve()
      return this.refreshThenAcquirePropertiesLock()
    }
  }
}
