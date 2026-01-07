import axios from 'axios'
import {
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  getPendingOperationsCount
} from '@/services/db'
import { i18n } from '@/plugins/i18n'
import { strategies } from '@/utils/OfflineStrategies'

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

        if (!isLockAcquisition && error.response.data && error.response.data.message && error.response.data.message.includes('Project is locked')) {
             if (typeof window !== 'undefined') {
                console.log('Dispatching axios-refresh-lock event')
                // Disparar evento para que viewProject lo capture y actualice la UI
                // Esto es util para cuando user A pierde el lock (e.g. heartbeat falla o guarda sin lock)
                window.dispatchEvent(new CustomEvent('axios-refresh-lock'))
             }
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
  /^\/clone\//,
  /^\/remove\//,
  /^\/publish/
]

export default class Api {
  static host = process.env.API_URL

  static getHeaders () {
    let authToken = localStorage.getItem('l_s')
    return {
      Authorization: `Token session="${authToken}"`
    }
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
    
    const rootEndpoints = ['/users', '/share', '/auth', '/organizations', '/project', '/create_user']
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

  static async get (path, data) {
    const url = this.getUrl(path)
    const options = {
      url: url,
      method: 'GET',
      headers: this.getHeaders(),
      params: data,
      withCredentials: true
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

  static async put (path, data) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
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
      const response = await axios.put(url, data, { headers: this.getHeaders(), withCredentials: true })
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

  static async patch (path, data) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
      await addPendingOperation({
        type: 'PATCH',
        endpoint: url,
        method: 'PATCH',
        payload: data
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
      const response = await axios.patch(url, data, { headers: this.getHeaders(), withCredentials: true })
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

  static async post (path, data) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
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
      const response = await axios.post(url, data, { headers: this.getHeaders(), withCredentials: true })
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

  static async delete (path, data) {
    const url = this.getUrl(path)
    // Helper para encolar operación
    const queueOperation = async () => {
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
      return await axios.delete(url, { headers: this.getHeaders(), withCredentials: true })
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
        try {
          switch (op.method) {
            case 'POST':
              await axios.post(op.endpoint, op.payload, { headers: this.getHeaders(), withCredentials: true })
              break
            case 'PUT':
              await axios.put(op.endpoint, op.payload, { headers: this.getHeaders(), withCredentials: true })
              break
            case 'PATCH':
              await axios.patch(op.endpoint, op.payload, { headers: this.getHeaders(), withCredentials: true })
              break
            case 'DELETE':
              await axios.delete(op.endpoint, { headers: this.getHeaders(), withCredentials: true })
              break
          }
          // Operación exitosa, remover de la cola
          await removePendingOperation(op.id)
          // console.log('Synced operation:', op.method, op.endpoint)
        } catch (error) {
          console.error('Failed to sync operation:', op.method, op.endpoint, error)
          // Mantener en la cola para reintentar después
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
