import axios from 'axios'
import { store } from '../store'
import Api from '@/utils/Api'
import { baseRefOf } from '@/utils/camelotAssessmentKeys'
import { PROPERTIES_LOCK_KEY } from '@/utils/propertiesLock'

const HEARBEAT_INTERVAL = 30000 // 30 seconds

class LockService {
  constructor () {
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
    // DELETEs de ref-locks en vuelo. Cerrar y reabrir un editor manda el DELETE y el POST
    // de la misma clave casi juntos; si el DELETE llegara último borraría el lock recién
    // tomado y el editor quedaría habilitado sin lock detrás. requestRefLock espera acá.
    this.pendingRefReleases = new Map() // refId -> Promise
    // Refs whose editor was opened while offline: granted locally, with no server
    // lock behind them. On reconnect each one is retried (see retryOfflineRefs).
    this.offlineRefs = new Map() // refId -> projectId
    // Offline grants whose reconnect POST is in flight, and the ones released meanwhile.
    // Leaving the editor during that POST finds nothing to release; without this the 200
    // would leave the lock held with nobody to let it go (for `project_properties`, until
    // the page closes, since the bare releaseRef() no longer sweeps it).
    this.retryingRefs = new Set()
    this.cancelledRetries = new Set()
    this.refLockedBy = null
    this.refHeartbeatTimer = null

    this.revalidateLocks = this.revalidateLocks.bind(this)

    if (typeof window !== 'undefined') {
      // Best-effort release when the tab is closed/navigated away from while
      // holding a lock. Uses 'pagehide' (bfcache-safe) rather than
      // 'beforeunload'. Won't help against a hard crash/power-off — that
      // requires a server-side heartbeat TTL.
      window.addEventListener('pagehide', () => {
        if (this.refLocked) this.releaseRef(null, { all: true })
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

  // ── Granular per-ref locks (Step 3 / Step 4) ──────────────────────────
  async acquireRef (projectId, refId) {
    if (!this.isEnabled) return { success: true }

    // Asking again means someone wants it: a release made while its reconnect POST was in
    // flight no longer applies — also when asking again offline, so it goes BEFORE the
    // offline branch below.
    this.cancelledRetries.delete(refId)

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

    // Held and in-flight entries are keyed by ref AND project. Reference ids are unique
    // across projects, but a fixed key like `project_properties` is the same everywhere:
    // closing project A's modal and opening B's must not hand B the lock (or the pending
    // request) of A — B would look held while the server lock sits on A.
    if (this.refLocks.get(refId) === projectId) return { success: true }
    const inFlight = this.pendingRefAcquires.get(refId)
    if (inFlight && inFlight.projectId === projectId) return inFlight.promise

    const pending = (async () => {
      if (inFlight) await inFlight.promise
      if (this.refLocks.has(refId)) await this.releaseRef(refId)
      return this.requestRefLock(projectId, refId)
    })()
    const entry = { projectId, promise: pending }
    this.pendingRefAcquires.set(refId, entry)
    try {
      return await pending
    } finally {
      if (this.pendingRefAcquires.get(refId) === entry) this.pendingRefAcquires.delete(refId)
    }
  }

  async requestRefLock (projectId, refId) {
    const releasing = this.pendingRefReleases.get(refId)
    if (releasing) await releasing
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
      // A 409 here can mean the exact ref is taken, or that someone holds the same study at
      // the other granularity (a leaf when we ask for the bare study, or vice versa).
      // Since 2026-08-26 `reason` tells them apart: `locked_at_another_granularity` for the
      // second, `locked_by_other_user` for the first.
      //
      // It is deliberately NOT the heartbeat's `evicted_granularity_conflict`, and the
      // difference matters for the wording: there the person had the lock and lost it, here
      // they never got it. Same underlying clash, two different things to tell them.
      if (error.response && error.response.status === 409) {
        const data = error.response.data || {}
        this.refLockedBy = data.locked_by
        return { success: false, lockedBy: this.refLockedBy, reason: data.reason || null }
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
      this.retryingRefs.add(refId)
      let result
      try {
        result = await this.requestRefLock(projectId, refId)
      } finally {
        this.retryingRefs.delete(refId)
      }
      if (this.cancelledRetries.delete(refId)) {
        // The editor closed while this was in flight: nobody wants the lock any more.
        if (result.success) await this.releaseRef(refId, { all: true })
        return
      }
      if (result.success) return
      // El motivo viaja también acá: el editor sigue abierto, así que su cartel merece poder
      // decir si esto se destraba solo. El acquire ya lo trae; perderlo en el camino dejaba
      // este aviso —el de reconectar— peor informado que el del latido.
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId, lockedBy: result.lockedBy || null, reason: result.reason || null }
      }))
    }))
  }

  /**
   * Releases one ref, or every held ref when called with no argument — except the
   * Properties lock, unless `{ all: true }`.
   *
   * StepFour and EditReferenceModal release everything they hold with the bare call when
   * they close, and StepFour does it only after the in-flight write settles. If the person
   * walked into the Properties tab (or opened Publish) in that window, the bare call took
   * the Properties lock away from a form that kept looking editable, with no heartbeat
   * left to report the loss. That lock has its own owner (propertiesLockMixin), which
   * releases it by name; only closing the page (`pagehide`) sweeps it with the rest.
   */
  async releaseRef (refId = null, { all = false } = {}) {
    if (!this.isEnabled) return

    // An editor closed while offline has nothing to release, but its pending retry
    // must go: reconnecting should not lock an entity nobody is editing any more.
    const swept = ref => all || ref !== PROPERTIES_LOCK_KEY
    if (refId === null) {
      [...this.offlineRefs.keys()].filter(swept).forEach(ref => this.offlineRefs.delete(ref))
      this.retryingRefs.forEach((ref) => { if (swept(ref)) this.cancelledRetries.add(ref) })
    } else {
      if (this.retryingRefs.has(refId)) this.cancelledRetries.add(refId)
      this.offlineRefs.delete(refId)
    }

    const toRelease = refId === null
      ? [...this.refLocks.entries()].filter(([ref]) => swept(ref))
      : (this.refLocks.has(refId) ? [[refId, this.refLocks.get(refId)]] : [])

    if (!toRelease.length) return

    toRelease.forEach(([ref]) => this.refLocks.delete(ref))
    if (!this.refLocks.size) this.stopRefHeartbeat()

    if (store.getters.isLoggedIn && localStorage.getItem('l_s')) {
      await Promise.all(toRelease.map(([ref, project]) => {
        const deleting = fetch(`/api/lock/${project}/ref/${ref}`, {
          method: 'DELETE',
          headers: Api.getHeaders(),
          keepalive: true
        }).catch(e => console.error('Error releasing ref lock', e))
        this.pendingRefReleases.set(ref, deleting)
        return deleting.finally(() => {
          if (this.pendingRefReleases.get(ref) === deleting) this.pendingRefReleases.delete(ref)
        })
      }))
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
          // Since 2026-08-19 a 409 on an expired-and-taken lock carries `locked_by`.
          // Passing it through is what lets the read-only banner name the person instead
          // of falling back to its anonymous wording. A 401/403 has nobody to blame,
          // hence the null.
          //
          // And since 2026-08-26 it also carries `reason`, which splits three situations
          // that used to arrive identical and do not read the same to the person:
          // `evicted_granularity_conflict` (somebody holds another granularity of this
          // study — retryable as soon as they let go), `locked_by_other_user` (they took
          // it, not retryable) and `lock_expired` (nobody to name). A server without that
          // deploy, or a 401/403, sends none: the banner falls back to its old wording.
          const data = error.response.data || {}
          const lockedBy = data.locked_by || null
          const reason = data.reason || null
          window.dispatchEvent(new CustomEvent('ref-lock-lost', {
            detail: { refId, lockedBy, reason }
          }))
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

  /**
   * El listado de ref locks del proyecto, distinguiendo los tres estados que hay.
   *
   * `fetchRefLocks` devuelve `[]` tanto cuando el proyecto está libre como cuando la
   * llamada falló, y eso alcanza para pintar candados —si no sé, no pinto ninguno— pero
   * no para el diálogo de import, que con ese `[]` afirmaría «nadie está editando»
   * cuando en realidad no lo sabe. Un import es destructivo: ahí la diferencia entre
   * «cero» y «no averigüé» es la diferencia entre informar y mentir.
   *
   * `enabled: false` no es incertidumbre: con la concurrencia apagada no hay locks
   * posibles, así que no hay nada que avisar y no vale la pena molestar.
   */
  async probeRefLocks (projectId) {
    if (!this.isEnabled) return { locks: [], reachable: true, enabled: false }
    try {
      // `?verbose=1` devuelve `{enabled, locks}` en vez del array plano, y ese `enabled`
      // es del SERVIDOR. Hace falta porque el flag vive en las dos capas: con el cliente
      // encendido y el servidor apagado, el listado contesta `[]` y ese `[]` no se
      // distingue de «nadie está editando». Nos costó un falso verde entero — la
      // verificación del aviso de import pasó sin que el aviso pudiera salir nunca.
      const response = await axios.get(`/api/lock/${projectId}/refs?verbose=1`, {
        headers: Api.getHeaders()
      })
      return { ...this.readRefLockListing(response.data), reachable: true }
    } catch (e) {
      return { locks: [], reachable: false, enabled: true }
    }
  }

  /**
   * Las dos formas del listado, y cualquier tercera que venga.
   *
   * El parámetro es opt-in del lado servidor, así que el array plano sigue siendo la
   * respuesta de los servidores que no lo tienen —y de los que lo tengan, si algún día se
   * llama sin él—. Una forma desconocida cae en la conducta anterior por la misma razón
   * que la allowlist de `lockErrors.js`: lo que este cliente no entiende no puede
   * cambiarle de rama, porque el servidor no tiene forma de instrumentar lo que
   * descartamos de su respuesta.
   */
  readRefLockListing (data) {
    if (Array.isArray(data)) return { locks: data, enabled: true }
    if (data && Array.isArray(data.locks)) {
      return { locks: data.locks, enabled: data.enabled !== false }
    }
    return { locks: [], enabled: true }
  }

  // Contrato plano para los cuatro componentes que pintan candados: les basta la lista y
  // un fallo silencioso es la conducta correcta ahí. Delega para no tener dos copias de
  // la misma llamada.
  async fetchRefLocks (projectId) {
    return (await this.probeRefLocks(projectId)).locks
  }
}

/**
 * Reads `GET /api/lock/<project>/refs` from the point of view of one study.
 *
 * A lock clashes with another when both point at the same study through
 * different granularities and belong to different users. Two different leaves
 * of the same study do not clash — that is exactly what endpoint D enables.
 *
 * Compares by `user_name`, not `user_id`: `GET /api/lock/<project>/refs` does
 * project `user_id` today, but this comparison hasn't been migrated to it — two
 * collaborators sharing a name still read as one.
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
