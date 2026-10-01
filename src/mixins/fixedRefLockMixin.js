import LockService from '@/services/lockService'
import { findForeignFixedLock } from '@/utils/fixedRefLock'

// Misma cadencia que el sondeo de viewProject: no introduce un ritmo nuevo contra el servidor.
export const FIXED_LOCK_WAIT_POLL_MS = 15000

/**
 * Fábrica del protocolo de un ref-lock de clave fija sostenido por UN anfitrión (un modal
 * de viewProject). Es el de propertiesLockMixin sin el registro de anfitriones: acá nadie
 * más toma la clave.
 *
 * Existe como fábrica porque viewProject sostiene dos —los grupos (`list_categories`) y el
 * orden de los findings (`findings_order`)— y un mixin con nombres fijos no se puede
 * mezclar dos veces. Cada instancia genera sus propios nombres a partir de `name`:
 *
 *   name = 'Categories' →  data `categoriesLock`, computed `categoriesLockHeld`,
 *     `enterCategoriesLock()`, `leaveCategoriesLock()`, `markCategoriesLockLost(by)`,
 *     `expireCategoriesLock()`, `resumeCategoriesLock()`, …
 *
 * Contrato con el anfitrión (con el mismo `name`):
 *   <name>LockProjectId()     — `categoriesLockProjectId()`. Obligatorio.
 *   refreshBefore<Name>Lock() — `refreshBeforeCategoriesLock()`. Obligatorio. Promesa que
 *     RECHAZA si no pudo refrescar: habilitar sobre datos viejos dejaría pisar lo que el
 *     otro acaba de guardar.
 *
 * Estados: idle · acquiring · held · denied · lost · forbidden · released_idle.
 */
export default function createFixedRefLockMixin ({ name, key }) {
  const lower = name.charAt(0).toLowerCase() + name.slice(1)
  const state = `${lower}Lock`
  const m = {
    held: `${lower}LockHeld`,
    projectId: `${lower}LockProjectId`,
    refresh: `refreshBefore${name}Lock`,
    enter: `enter${name}Lock`,
    leave: `leave${name}Lock`,
    acquire: `acquire${name}Lock`,
    startWait: `start${name}LockWait`,
    stopWait: `stop${name}LockWait`,
    checkFree: `check${name}LockFree`,
    refreshThenAcquire: `refreshThenAcquire${name}Lock`,
    markLost: `mark${name}LockLost`,
    onLost: `on${name}LockLost`,
    expire: `expire${name}Lock`,
    resume: `resume${name}Lock`
  }
  // Estado no reactivo, por instancia y por clave (en `$_`: no se dibuja).
  const priv = (vm) => {
    if (!vm.$_fixedLocks) vm.$_fixedLocks = {}
    if (!vm.$_fixedLocks[key]) vm.$_fixedLocks[key] = { active: false, timer: null, session: 0 }
    return vm.$_fixedLocks[key]
  }

  return {
    data () {
      return { [state]: { status: 'idle', lockedBy: null } }
    },
    computed: {
      [m.held] () {
        return this[state].status === 'held'
      }
    },
    created () {
      priv(this)
      window.addEventListener('ref-lock-lost', this[m.onLost])
    },
    beforeDestroy () {
      window.removeEventListener('ref-lock-lost', this[m.onLost])
      this[m.leave]()
    },
    methods: {
      async [m.enter] () {
        const p = priv(this)
        if (p.active) return
        p.active = true
        // Cada entrada y cada salida abren una sesión nueva: un acquire, sondeo o refresco en
        // vuelo de una sesión anterior no actúa sobre la actual.
        p.session++
        this[m.stopWait]()
        await this[m.acquire]()
      },

      [m.leave] () {
        const p = priv(this)
        const wasActive = p.active
        const wasHeld = this[state].status === 'held'
        p.active = false
        p.session++
        this[m.stopWait]()
        this[state] = { status: 'idle', lockedBy: null }
        if (wasActive && wasHeld) LockService.releaseRef(key)
      },

      async [m.acquire] () {
        const p = priv(this)
        const session = p.session
        this[state] = { status: 'acquiring', lockedBy: null }
        const result = await LockService.acquireRef(this[m.projectId](), key)
        if (session !== p.session) {
          // Se cerró el modal mientras esperaba la respuesta: nadie más soltaría este lock.
          if (result.success) LockService.releaseRef(key)
          return
        }
        if (result.success) {
          this[m.stopWait]()
          this[state] = { status: 'held', lockedBy: null }
          return
        }
        if (result.permissionDenied) {
          // No es que otro lo tenga: no hay nada que esperar.
          this[state] = { status: 'forbidden', lockedBy: null }
          return
        }
        this[state] = { status: 'denied', lockedBy: result.lockedBy || null }
        this[m.startWait]()
      },

      [m.startWait] () {
        this[m.stopWait]()
        priv(this).timer = setInterval(this[m.checkFree], FIXED_LOCK_WAIT_POLL_MS)
      },

      [m.stopWait] () {
        const p = priv(this)
        if (p.timer) clearInterval(p.timer)
        p.timer = null
      },

      async [m.checkFree] () {
        const p = priv(this)
        const session = p.session
        const listing = await LockService.probeRefLocks(this[m.projectId]())
        if (session !== p.session || !p.timer) return
        // Un listado que no respondió dice `[]`, y sin red `acquireRef` concede un grant
        // offline que no es un lock: los dos se leerían como «libre». Se sigue esperando.
        if (!listing.reachable || !this.$store.state.isOnline) return
        const user = this.$store.state.user || {}
        const other = findForeignFixedLock(listing.locks, key, user.id)
        if (other) {
          this[state] = { ...this[state], lockedBy: other.user_name || this[state].lockedBy }
          return
        }
        this[m.stopWait]()
        await this[m.refreshThenAcquire]()
      },

      async [m.refreshThenAcquire] () {
        const p = priv(this)
        const session = p.session
        try {
          await this[m.refresh]()
        } catch (error) {
          if (session !== p.session) return
          // Sin refresco no hay lock: se sigue esperando, sin nombrar a nadie.
          this[state] = { status: 'denied', lockedBy: null }
          this[m.startWait]()
          return
        }
        if (session !== p.session) return
        if (!this.$store.state.isOnline) {
          this[m.startWait]()
          return
        }
        await this[m.acquire]()
      },

      /** El lock se perdió: por el latido (`ref-lock-lost`) o porque el servidor rechazó una escritura. */
      [m.markLost] (lockedBy) {
        if (!priv(this).active) return
        this[state] = { status: 'lost', lockedBy: lockedBy || null }
        this[m.startWait]()
      },

      /** Para `onInactivityExpired` del anfitrión. No espera: se fue a almorzar. */
      [m.expire] () {
        if (!priv(this).active) return
        const wasHeld = this[state].status === 'held'
        this[m.stopWait]()
        this[state] = { status: 'released_idle', lockedBy: null }
        if (wasHeld) LockService.releaseRef(key)
      },

      /** Botón «Seguir editando» del cartel: refresca y vuelve a pedir el lock. */
      [m.resume] () {
        if (!priv(this).active) return Promise.resolve()
        return this[m.refreshThenAcquire]()
      },

      [m.onLost] (event) {
        const detail = (event && event.detail) || {}
        if (detail.refId !== key) return
        this[m.markLost](detail.lockedBy)
      }
    }
  }
}
