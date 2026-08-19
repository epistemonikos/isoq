import axios from 'axios'
import {
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  getPendingOperationsCount
} from '@/services/db'
import { i18n } from '@/plugins/i18n'
import { strategies } from '@/utils/OfflineStrategies'
import { leafLockKey } from '@/utils/camelotAssessmentKeys'

// Estado de conexión
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

// Listeners para cambios de conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    // Resetear estado - la próxima petición confirmará si realmente hay conexión
    isOnline = true
    // Intentar sincronizar operaciones pendientes
    setTimeout(() => {
      Api.syncPendingOperations()
    }, 1000)
  })

  window.addEventListener('offline', () => {
    isOnline = false
  })
}

// Endpoint D nests the cell position under /item/, so the raw split would yield
// '<ref_id>/stage/0/option/2' — a string that matches no lock the client holds.
// The lock the backend checks is the composite key '<ref_id>::s0::o2'.
const ITEM_LEAF_URL_RE = /\/item\/([^/]+)\/stage\/([^/]+)\/option\/([^/?]+)/
// Endpoint A locks the document, so its lock key is the id in the path, not a ref.
const SECTION_URL_RE = /\/(?:isoqf_findings|isoqf_lists)\/([^/]+)\/section\/[^/?]+/
const ITEM_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments|isoqf_extracted_data)\/[^/]+\/item\//
// The four column endpoints lock the table DOCUMENT rather than a row, so their key is
// `<doc_id>::fields`. Keeping it apart from the row key is the point: whoever edits
// columns must not block whoever edits a study.
const FIELD_URL_RE = /\/(?:isoqf_characteristics|isoqf_assessments)\/([^/]+)\/(?:field\/[^/?]+|fields\/order)/

function refLockKeyFromItemUrl (url) {
  const leaf = ITEM_LEAF_URL_RE.exec(url)
  if (leaf) {
    const [, refId, stage, option] = leaf
    return leafLockKey(refId, stage, option) || refId
  }
  return url.split('/item/')[1] || ''
}

/**
 * Lock key a granular write needs, or null when the URL is not a granular endpoint.
 * Endpoints B/C/D lock a row/cell (`ref_id`, `ref::sK::oI`); endpoint A locks the
 * document itself (`finding_id` / `list_id`); the column endpoints lock the table
 * document (`<doc_id>::fields`).
 */
export function refLockKeyFromUrl (url = '') {
  const section = SECTION_URL_RE.exec(url)
  if (section) return section[1]
  const field = FIELD_URL_RE.exec(url)
  if (field) return `${field[1]}::fields`
  if (ITEM_URL_RE.test(url)) return refLockKeyFromItemUrl(url) || null
  return null
}

/**
 * LockService imported lazily: it imports Api itself, and a static cycle would leave
 * one of the two holding an uninitialised binding.
 */
async function getLockService () {
  const mod = await import('@/services/lockService')
  return mod.default || mod
}

/**
 * Lock context to persist with a queued granular write, so the replay can acquire the
 * lock it will need. The project id is not derivable from these URLs, but LockService
 * already maps it per ref (the editor holds the lock — or the offline grant — while
 * the write is being queued).
 */
async function queuedLockContext (url) {
  const refId = refLockKeyFromUrl(url)
  if (!refId) return null
  const LockService = await getLockService()
  const projectId = LockService.offlineRefs.get(refId) ||
    LockService.refLocks.get(refId) || null
  return { lockRef: refId, lockProjectId: projectId }
}

/**
 * @param source 'live' for a request that failed right now, 'replay' for one the
 * offline queue tried later. Same failure, opposite explanations: telling the user a
 * live 409 happened "while you were offline" is simply wrong, and it was the wording
 * that made a lock conflict look like a sync bug.
 */
function reportRefLockConflict (refId, failedData, lockedBy, source = 'live') {
  if (typeof window === 'undefined') return
  localStorage.setItem(`conflict_ref_${refId}`, JSON.stringify({ failedData, lockedBy, source }))
  window.dispatchEvent(new CustomEvent('ref-lock-conflict', {
    detail: { refId, failedData, lockedBy, source }
  }))
}

// Crear error compatible con estructura de Axios
function createOfflineError (message) {
  const msg = message || i18n.t('offline.noConnection')
  const error = new Error(msg)
  error.isOfflineError = true
  error.response = {
    status: 0,
    statusText: 'Offline',
    data: { message, offline: true }
  }
  error.request = {}
  error.request = {}
  return error
}

// Interceptor para detectar errores de bloqueo (Concurrency Control)
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response && (error.response.status === 409 || error.response.status === 403)) {
      // Verificar si es un error de bloqueo
      // Excluir la petición de adquisición de bloqueo explícita, ya que esa se maneja en el componente
      const url = error.config && error.config.url ? error.config.url : ''
      const method = error.config && error.config.method ? error.config.method.toLowerCase() : ''

      // Check for '/api/lock/' but ensure it's not heartbeat
      const isLockAcquisition = (error.config && error.config.headers && error.config.headers['X-Suppress-Lock-Error']) || (url.includes('/api/lock/') && method === 'post' && !url.includes('/heartbeat'))

      console.log('Api.js Interceptor 409:', { url, method, isLockAcquisition })

      // Detect a conflict on any granular write (a ref lock held by another user, or
      // no lock at all after the offline queue replays). Surface it via a
      // non-blocking event so the open editor can show copyable fields. Covers
      // endpoint A (/section/) as well as B/C/D (/item/), which is why the key comes
      // from refLockKeyFromUrl and not from the raw path split.
      const refId = refLockKeyFromUrl(url)
      if (refId && typeof window !== 'undefined') {
        let failedData = {}
        if (error.config && error.config.data) {
          try { failedData = JSON.parse(error.config.data) } catch (e) { failedData = {} }
        }
        const lockedBy = (error.response.data && error.response.data.locked_by) || ''
        reportRefLockConflict(refId, failedData, lockedBy)
      }

      if (!isLockAcquisition && error.response.data && error.response.data.message && error.response.data.message.includes('Project is locked')) {
        if (typeof window !== 'undefined') {
          console.log('Dispatching axios-refresh-lock event')
          // Disparar evento para que viewProject lo capture y actualice la UI
          // Esto es util para cuando user A pierde el lock (e.g. heartbeat falla o guarda sin lock)
          window.dispatchEvent(new CustomEvent('axios-refresh-lock'))
        }
      }

      // A 403 on any write request means the user's can_write/can_read may have
      // just changed server-side (e.g. the project owner revoked their access
      // while they still had an editor open). Unlike the two checks above, this
      // is intentionally broad — it doesn't try to guess *why* the 403 happened —
      // so any listener (viewProject.vue, editList.vue) can re-check permissions
      // and lock the UI down without waiting for the user to navigate.
      const isWriteMethod = ['post', 'patch', 'put', 'delete'].includes(method)
      if (error.response.status === 403 && isWriteMethod && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('permission-denied', { detail: { url, method } }))
      }
    }
    return Promise.reject(error)
  }
)

// Endpoints que NO deben cachearse
const NO_CACHE_PATTERNS = [
  /^\/auth\//,
  /^\/users\//,
  /^\/share\//,
  /^\/shared\//,
  /^\/clone\//,
  /^\/remove\//,
  /^\/publish/,
  /^\/admin\//
]

export default class Api {
  static host = process.env.API_URL

  static getHeaders (config = {}, data = null) {
    let authToken = localStorage.getItem('l_s')
    const headers = { ...config.headers }
    if (authToken && authToken !== 'null') {
      headers.Authorization = `Bearer ${authToken}`
    }

    // Explicitly set Content-Type to application/json if data is present and not FormData
    if (data && !(typeof FormData !== 'undefined' && data instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  static isOnline () {
    return isOnline
  }

  static setOnline (status) {
    isOnline = status
  }

  static getUrl (path) {
    if (path.startsWith('http')) return path
    if (path.startsWith('/api')) return path

    const rootEndpoints = ['/users', '/share', '/auth', '/organizations', '/project', '/create_user', '/admin']
    for (const endpoint of rootEndpoints) {
      if (path === endpoint || path.startsWith(endpoint + '/')) {
        return path
      }
    }

    return Api.host + path
  }

  static shouldCache (path) {
    // No cachear si coincide con patrones excluidos
    for (const pattern of NO_CACHE_PATTERNS) {
      if (pattern.test(path)) return false
    }
    // Cachear si alguna estrategia coincide
    for (const strategy of strategies) {
      if (strategy.patterns.some(p => p.test(path))) return true
    }
    return false
  }

  static shouldQueue (path, data) {
    // No encolar si coincide con patrones excluidos (mismos que cache)
    for (const pattern of NO_CACHE_PATTERNS) {
      if (pattern.test(path)) return false
    }

    // No encolar si es FormData (no se puede clonar en IndexedDB)
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return false
    }

    return true
  }

  static async cacheResponse (path, data) {
    try {
      for (const strategy of strategies) {
        if (strategy.patterns.some(p => p.test(path))) {
          await strategy.save(data, path)
          // No hacemos 'break' aquí por si un path coincide con múltiples estrategias (raro, pero posible)
        }
      }
    } catch (error) {
      console.warn('Error caching response:', error)
    }
  }

  static async getCachedData (path, params = {}) {
    try {
      for (const strategy of strategies) {
        if (strategy.patterns.some(p => p.test(path))) {
          const data = await strategy.serve(path, params)
          if (data) return data
        }
      }
      return null
    } catch (error) {
      console.warn('Error getting cached data:', error)
      return null
    }
  }

  static async get (path, data, config = {}) {
    const url = this.getUrl(path)
    const options = {
      ...config,
      url: url,
      method: 'GET',
      headers: this.getHeaders(config),
      params: data
    }

    // Función helper para intentar servir desde cache
    const tryServeFromCache = async (reason) => {
      if (this.shouldCache(path)) {
        const cachedData = await this.getCachedData(path, data)
        if (cachedData) {
          // console.log(`Serving from cache (${reason}):`, path)
          return { data: cachedData, fromCache: true, status: 200 }
        }
      }
      return null
    }

    // Si sabemos que estamos offline, intentar cache primero
    if (!isOnline) {
      const cached = await tryServeFromCache('offline')
      if (cached) return cached
      throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
    }

    // Intentar la red
    try {
      const response = await axios(options)

      // Cachear la respuesta si es cacheable
      if (this.shouldCache(path)) {
        this.cacheResponse(path, response.data)
      }

      return response
    } catch (error) {
      // Detectar si es un error de red (offline real o DevTools offline)
      const isNetworkError = !error.response && (
        error.code === 'ERR_NETWORK' ||
        error.code === 'ECONNABORTED' ||
        error.message === 'Network Error' ||
        error.message.includes('timeout')
      )

      if (isNetworkError) {
        // Marcar como offline
        isOnline = false
        // console.log('Network error detected, switching to offline mode')

        // Intentar servir desde cache
        const cached = await tryServeFromCache('network error')
        if (cached) return cached

        // No hay cache, lanzar error compatible con Axios
        throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
      }

      // Error del servidor (4xx, 5xx) - no es offline, propagar el error
      throw error
    }
  }

  static async put (path, data, config = {}) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
      if (!this.shouldQueue(path, data)) {
        throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
      }
      await addPendingOperation({
        type: 'PUT',
        endpoint: url,
        method: 'PUT',
        payload: data
      })
      // console.log('Operation queued for sync:', 'PUT', url)
      return { data: data, queued: true, status: 200 }
    }

    // Helper para intentar actualización optimista local
    const tryOptimisticUpdate = async (path, data) => {
      try {
        for (const strategy of strategies) {
          if (strategy.patterns.some(p => p.test(path))) {
            if (strategy.update) {
              await strategy.update(data, path)
              // console.log('Optimistic update applied for:', path)
            }
          }
        }
      } catch (error) {
        console.warn('Error applying optimistic update:', error)
      }
    }

    if (!isOnline) {
      await tryOptimisticUpdate(path, data)
      return queueOperation()
    }

    try {
      const response = await axios.put(url, data, { ...config, headers: this.getHeaders(config, data) })
      // También actualizamos cache si estamos online para mantener consistencia
      if (this.shouldCache(path)) {
        await tryOptimisticUpdate(path, data)
      }
      return response
    } catch (error) {
      if (!error.response) {
        isOnline = false
        await tryOptimisticUpdate(path, data)
        return queueOperation()
      }
      throw error
    }
  }

  static async patch (path, data, config = {}) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
      if (!this.shouldQueue(path, data)) {
        throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
      }
      const lockContext = await queuedLockContext(url)
      await addPendingOperation({
        type: 'PATCH',
        endpoint: url,
        method: 'PATCH',
        payload: data,
        ...(lockContext || {})
      })
      // console.log('Operation queued for sync:', 'PATCH', url)
      return { data: data, queued: true, status: 200 }
    }

    // Helper para intentar actualización optimista local
    const tryOptimisticUpdate = async (path, data) => {
      try {
        for (const strategy of strategies) {
          if (strategy.patterns.some(p => p.test(path))) {
            if (strategy.update) {
              await strategy.update(data, path)
            }
          }
        }
      } catch (error) {
        console.warn('Error applying optimistic update:', error)
      }
    }

    if (!isOnline) {
      await tryOptimisticUpdate(path, data)
      return queueOperation()
    }

    try {
      const response = await axios.patch(url, data, { ...config, headers: this.getHeaders(config, data) })
      if (this.shouldCache(path)) {
        await tryOptimisticUpdate(path, data)
      }
      return response
    } catch (error) {
      if (!error.response) {
        isOnline = false
        await tryOptimisticUpdate(path, data)
        return queueOperation()
      }
      throw error
    }
  }

  static async post (path, data, config = {}) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
      if (!this.shouldQueue(path, data)) {
        throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
      }
      await addPendingOperation({
        type: 'POST',
        endpoint: url,
        method: 'POST',
        payload: data
      })
      // console.log('Operation queued for sync:', 'POST', url)
      return { data: data, queued: true, status: 200 }
    }

    // Helper para intentar actualización optimista local
    const tryOptimisticUpdate = async (path, data) => {
      try {
        for (const strategy of strategies) {
          if (strategy.patterns.some(p => p.test(path))) {
            if (strategy.update) {
              await strategy.update(data, path)
            }
          }
        }
      } catch (error) {
        console.warn('Error applying optimistic update:', error)
      }
    }

    if (!isOnline) {
      await tryOptimisticUpdate(path, data)
      return queueOperation()
    }

    try {
      const response = await axios.post(url, data, { ...config, headers: this.getHeaders(config, data) })
      if (this.shouldCache(path)) {
        // Para POST es más complejo porque el ID puede venir del servidor
        // pero si el data ya trae ID (ej: uuid generado en cliente), podemos actualizar
        if (data && data.id) {
          await tryOptimisticUpdate(path, data)
        }
      }
      return response
    } catch (error) {
      if (!error.response) {
        isOnline = false
        await tryOptimisticUpdate(path, data)
        return queueOperation()
      }
      throw error
    }
  }

  static async delete (path, data, config = {}) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
      if (!this.shouldQueue(path, data)) {
        throw createOfflineError(i18n.t('offline.noInternetAndNoCache') + ' ' + path)
      }
      await addPendingOperation({
        type: 'DELETE',
        endpoint: url,
        method: 'DELETE',
        payload: data
      })
      // console.log('Operation queued for sync:', 'DELETE', url)
      return { data: null, queued: true, status: 200 }
    }

    if (!isOnline) {
      return queueOperation()
    }

    try {
      return await axios.delete(url, { ...config, data, headers: this.getHeaders(config, data) })
    } catch (error) {
      if (!error.response) {
        isOnline = false
        return queueOperation()
      }
      throw error
    }
  }

  // Sincronizar operaciones pendientes cuando vuelva la conexión
  static async syncPendingOperations () {
    if (!isOnline) return

    try {
      const operations = await getPendingOperations()
      // console.log(`Syncing ${operations.length} pending operations...`)

      for (const op of operations) {
        // A granular write needs the ref lock the editor no longer holds (it was
        // closed, or the grant was only local because we were offline). Without it
        // the backend answers 409 `lock_not_held` and the change is lost.
        let heldLock = null
        if (op.lockRef && op.lockProjectId) {
          const LockService = await getLockService()
          const result = await LockService.acquireRef(op.lockProjectId, op.lockRef)
          if (!result.success) {
            // Somebody took the entity while we were away. Replaying would fail, and
            // retrying forever would stall the queue behind it: drop it and hand the
            // payload to the user through the conflict channel.
            reportRefLockConflict(op.lockRef, op.payload, result.lockedBy || '', 'replay')
            await removePendingOperation(op.id)
            continue
          }
          heldLock = op.lockRef
        }

        try {
          switch (op.method) {
            case 'POST':
              await axios.post(op.endpoint, op.payload, { headers: this.getHeaders() })
              break
            case 'PUT':
              await axios.put(op.endpoint, op.payload, { headers: this.getHeaders() })
              break
            case 'PATCH':
              await axios.patch(op.endpoint, op.payload, { headers: this.getHeaders() })
              break
            case 'DELETE':
              await axios.delete(op.endpoint, { data: op.payload, headers: this.getHeaders() })
              break
          }
          // Operación exitosa, remover de la cola
          await removePendingOperation(op.id)
          // console.log('Synced operation:', op.method, op.endpoint)
        } catch (error) {
          console.error('Failed to sync operation:', op.method, op.endpoint, error)
          // Mantener en la cola para reintentar después
        } finally {
          if (heldLock) {
            const LockService = await getLockService()
            await LockService.releaseRef(heldLock)
          }
        }
      }
    } catch (error) {
      console.error('Error during sync:', error)
    }
  }

  // Obtener cantidad de operaciones pendientes
  static async getPendingCount () {
    return getPendingOperationsCount()
  }
}
