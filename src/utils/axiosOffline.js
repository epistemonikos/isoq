/**
 * Axios Interceptor for Offline Support
 * Intercepts all axios requests to provide caching and offline queue functionality
 */

import axios from 'axios'
import {
  saveToUrlCache,
  getFromUrlCache,
  getUrlCacheByType,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  getPendingOperationsCount
} from '@/services/db'

// Estado de conexión
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

// Getter y setter para el estado
export function getOnlineStatus () {
  return isOnline
}

export function setOnlineStatus (status) {
  isOnline = status
}

// Listeners para cambios de conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser reports: online')
    isOnline = true
    // Intentar sincronizar operaciones pendientes
    setTimeout(() => {
      syncPendingOperations()
    }, 1000)
  })

  window.addEventListener('offline', () => {
    console.log('Browser reports: offline')
    isOnline = false
  })
}

// Patrones de endpoints para cachear (solo GET)
// IDs pueden ser numéricos o MongoDB ObjectId (24 caracteres hex)
const CACHE_PATTERNS = [
  // Proyectos - ID puede ser número o ObjectId
  { pattern: /\/api\/isoqf_projects\/([a-f0-9]+)(?:\?|$)/i, type: 'project', getId: (m) => m[1] },
  { pattern: /\/api\/isoqf_projects(?:\?|$)/, type: 'projectList' },
  { pattern: /\/api\/getProjects/, type: 'projectList' },

  // Worksheets/Lists
  { pattern: /\/api\/getLists\?.*list_id=([a-f0-9]+)/i, type: 'worksheet', getId: (m) => m[1] },
  { pattern: /\/api\/getLists\?.*id=([a-f0-9]+)/i, type: 'worksheet', getId: (m) => m[1] },
  { pattern: /\/api\/isoqf_lists\?.*project_id=([a-f0-9]+)/i, type: 'worksheetList', getId: (m) => m[1] },
  { pattern: /\/api\/isoqf_lists(?:\?|$)/, type: 'worksheetList' },

  // Referencias - cachear por URL completa
  { pattern: /\/api\/isoqf_references/, type: 'references' },

  // Categorías
  { pattern: /\/api\/isoqf_list_categories/, type: 'categories' },

  // Findings
  { pattern: /\/api\/findings/, type: 'findings' },
  { pattern: /\/api\/isoqf_findings/, type: 'findings' },

  // Assessments y Characteristics (con y sin ID)
  { pattern: /\/api\/isoqf_assessments\/[a-f0-9]+/i, type: 'assessment' },
  { pattern: /\/api\/isoqf_assessments/, type: 'assessments' },
  { pattern: /\/api\/isoqf_characteristics\/[a-f0-9]+/i, type: 'characteristic' },
  { pattern: /\/api\/isoqf_characteristics/, type: 'characteristics' },

  // Findings con ID
  { pattern: /\/api\/isoqf_findings\/[a-f0-9]+/i, type: 'finding' },

  // List categories con ID
  { pattern: /\/api\/isoqf_list_categories\/[a-f0-9]+/i, type: 'category' },

  // References con ID
  { pattern: /\/api\/isoqf_references\/[a-f0-9]+/i, type: 'reference' },

  // Extracted Data caching
  { pattern: /\/api\/isoqf_extracted_data\/[a-f0-9]+/i, type: 'extractedData' },
  { pattern: /\/api\/isoqf_extracted_data/, type: 'extractedDataList' }
]

// Endpoints que NO deben cachearse
const NO_CACHE_PATTERNS = [
  /\/auth\//,
  /\/users\//,
  /\/share\//,
  /\/clone\//,
  /\/remove\//,
  /\/publish/,
  /\/pubmed\//
]

function shouldCache (url) {
  for (const pattern of NO_CACHE_PATTERNS) {
    if (pattern.test(url)) return false
  }
  for (const { pattern } of CACHE_PATTERNS) {
    if (pattern.test(url)) return true
  }
  return false
}

function getCacheType (url) {
  for (const { pattern, type, getId } of CACHE_PATTERNS) {
    const match = url.match(pattern)
    if (match) {
      return { type, id: getId ? getId(match) : null }
    }
  }
  return null
}

// Normalizar URL para usar como clave de cache
// Elimina parámetros que cambian pero no afectan los datos (como timestamps)
function normalizeUrlForCache (url) {
  // Por ahora usar la URL completa como clave
  return url
}

async function cacheResponse (url, data) {
  const cacheInfo = getCacheType(url)
  if (!cacheInfo) return

  try {
    const cacheKey = normalizeUrlForCache(url)
    await saveToUrlCache(cacheKey, cacheInfo.type, data)
    console.log(`[Cache] Saved ${cacheInfo.type} to cache:`, cacheKey)
  } catch (error) {
    console.warn('Error caching response:', error)
  }
}

async function getCachedData (url) {
  try {
    const cacheKey = normalizeUrlForCache(url)
    const data = await getFromUrlCache(cacheKey)
    if (data) {
      console.log(`[Cache] Found in cache:`, cacheKey)
      return data
    }
  } catch (error) {
    console.warn('Error getting cached data:', error)
  }

  return null
}

// Crear respuesta de error compatible
function createOfflineError (config, message) {
  const error = new Error(message)
  error.config = config
  error.isOfflineError = true
  error.response = {
    status: 0,
    statusText: 'Offline',
    data: { message, offline: true },
    headers: {},
    config
  }
  error.request = {}
  return error
}

// Sincronizar operaciones pendientes
export async function syncPendingOperations () {
  if (!isOnline) return

  try {
    const operations = await getPendingOperations()
    if (operations.length === 0) return

    console.log(`[Sync] Syncing ${operations.length} pending operations...`)

    let syncedCount = 0
    const affectedUrls = new Set()

    for (const op of operations) {
      try {
        // Parsear el payload si es string JSON
        let payload = op.payload
        if (typeof payload === 'string') {
          try {
            payload = JSON.parse(payload)
          } catch (e) {
            // No es JSON, mantener como string
          }
        }

        console.log(`[Sync] ${op.method} ${op.endpoint}`, payload)

        const config = {
          url: op.endpoint,
          method: op.method.toLowerCase(),
          data: payload,
          headers: {
            'Authorization': `Token session="${localStorage.getItem('l_s')}"`,
            'Content-Type': 'application/json'
          }
        }

        const response = await axios(config)
        console.log(`[Sync] Success:`, response.status)
        await removePendingOperation(op.id)
        syncedCount++

        // Guardar URL base para invalidar cache relacionado
        // Ej: /api/isoqf_projects/123 -> /api/isoqf_projects
        const baseUrl = op.endpoint.replace(/\/[a-f0-9]+$/i, '')
        affectedUrls.add(baseUrl)
        affectedUrls.add(op.endpoint)

      } catch (error) {
        console.error('[Sync] Failed:', op.method, op.endpoint, error.response?.data || error.message)
      }
    }

    // Si se sincronizaron operaciones, notificar a la UI
    if (syncedCount > 0) {
      console.log(`[Sync] Completed: ${syncedCount} operations synced`)

      // Emitir evento para que la UI pueda recargar datos
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('offlineSync', {
          detail: {
            syncedCount,
            affectedUrls: Array.from(affectedUrls)
          }
        }))
      }
    }
  } catch (error) {
    console.error('[Sync] Error during sync:', error)
  }
}

// Obtener cantidad de operaciones pendientes
export { getPendingOperationsCount }

// Componer respuesta para getLists desde caches fragmentados
async function composeGetListsResponse (listId) {
  try {
    // 1. Buscar la lista objetivo en los caches de worksheetList
    const worksheetLists = await getUrlCacheByType('worksheetList')

    let targetList = null
    let projectId = null

    for (const cacheEntry of worksheetLists) {
      if (Array.isArray(cacheEntry.data)) {
        // Comparación flexible (string vs number)
        const found = cacheEntry.data.find(l => l.id == listId)
        if (found) {
          targetList = found
          projectId = targetList.project_id
          break
        }
      }
    }

    if (!targetList || !projectId) {
      console.log(`[Offline] List ${listId} not found in any cached project lists`)
      return null
    }

    console.log(`[Offline] Found list ${listId} in project ${projectId}, composing response...`)

    // 2. Recuperar datos relacionados

    // Project Data
    const projectCaches = await getUrlCacheByType('project')
    let projectData = null
    for (const cache of projectCaches) {
      if (cache.url.includes(`/api/isoqf_projects/${projectId}`)) {
        projectData = cache.data
        break
      }
    }

    // References
    const refCaches = await getUrlCacheByType('references')
    let projectReferences = []
    for (const cache of refCaches) {
      if (cache.url.includes(projectId)) {
        projectReferences = cache.data
        break
      }
    }

    // Characteristics
    const charCaches = await getUrlCacheByType('characteristics')
    let projectChars = []
    for (const cache of charCaches) {
      if (cache.url.includes(projectId)) {
        projectChars = cache.data
        break
      }
    }

    // Assessments
    const assessCaches = await getUrlCacheByType('assessments')
    let projectAssess = []
    for (const cache of assessCaches) {
      if (cache.url.includes(projectId)) {
        projectAssess = cache.data
        break
      }
    }

    // Findings
    const findingsCaches = await getUrlCacheByType('findings')
    let listFindings = []
    for (const cache of findingsCaches) {
      if (Array.isArray(cache.data)) {
        const matching = cache.data.filter(f => f.list_id == listId)
        listFindings.push(...matching)
      }
    }

    // Extracted Data
    let extractedData = []
    if (listFindings.length > 0) {
      const findingId = listFindings[0].id
      const extractedCaches = await getUrlCacheByType('extractedDataList')
      for (const cache of extractedCaches) {
        if (cache.url.includes(findingId)) {
          extractedData = cache.data
          break
        }
      }
    }

    // 3. Ensamblar el objeto completo
    let composedList = JSON.parse(JSON.stringify(targetList))

    composedList.project = projectData || {}
    composedList.fullreferences = projectReferences || []
    composedList.findings = listFindings || []
    composedList.characteristics = projectChars || []
    composedList.assessments = projectAssess || []
    composedList.extracted_data = extractedData || []

    return [composedList]
  } catch (error) {
    console.error('[Offline] Error composing getLists response:', error)
    return null
  }
}

// Instalar interceptores
export function setupAxiosOffline () {
  // Response interceptor - maneja todo el caching
  axios.interceptors.response.use(
    async (response) => {
      const url = axios.getUri(response.config)
      const method = (response.config.method || 'get').toLowerCase()

      console.log(`[Axios] ${method.toUpperCase()} ${url} - Status: ${response.status}`)

      // Cachear respuestas GET exitosas
      if (method === 'get' && shouldCache(url)) {
        await cacheResponse(url, response.data)
      }
      return response
    },
    async (error) => {
      const config = error.config

      // Detectar error de red
      const isNetworkError = !error.response && (
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        error.message.includes('timeout')
      )

      console.log(`[Axios Error] URL: ${config?.url}, Code: ${error.code}, Message: ${error.message}, IsNetworkError: ${isNetworkError}`)

      if (isNetworkError && config) {
        console.log('[Offline] Network error detected, switching to offline mode')
        isOnline = false
        
        const fullUrl = axios.getUri(config)

        // Para GET, intentar servir desde cache
        if (config.method === 'get') {
          if (shouldCache(fullUrl)) {
            console.log(`[Offline] Checking cache for: ${fullUrl}`)
            const cachedData = await getCachedData(fullUrl)
            console.log(`[Offline] Cached data found: ${cachedData !== null}`)

            if (cachedData) {
              return {
                data: cachedData,
                status: 200,
                statusText: 'OK (from cache)',
                headers: {},
                config,
                fromCache: true
              }
            }
          }

          // GET sin cache - devolver respuesta vacía para no romper la app

          // SPECIAL CASE: /api/getLists fallback strategy
          // Intentar componer la respuesta si es una solicitud getLists que falló
          if (fullUrl.includes('/api/getLists')) {
            console.log('[Offline] Attempting to compose getLists response...')
            // Extraer list_id de la URL o params
            // Nota: fullUrl ya incluye los query params
            let listId = null
            try {
              // Manejar URLs relativas
              const urlObj = new URL(fullUrl, 'http://dummy.com')
              listId = urlObj.searchParams.get('list_id') || urlObj.searchParams.get('id')
            } catch (e) {
              console.error('Error parsing URL:', e)
            }

            if (listId) {
              const composedData = await composeGetListsResponse(listId)
              if (composedData) {
                console.log('[Offline] Successfully composed getLists response')
                return {
                  data: composedData,
                  status: 200,
                  statusText: 'OK (composed offline)',
                  headers: {},
                  config,
                  fromCache: true,
                  composed: true
                }
              }
            }
          }

          console.log(`[Offline] No cache for GET: ${fullUrl}, returning empty response`)
          return {
            data: {}, // Return empty object instead of potentially problematic null
            status: 200,
            statusText: 'OK (offline - no cache)',
            headers: {},
            config,
            fromCache: false,
            offline: true
          }
        }

        // Para POST/PUT/PATCH/DELETE, encolar operación
        const method = (config.method || '').toLowerCase()
        if (['post', 'put', 'patch', 'delete'].includes(method)) {
          // Asegurar que el payload sea un objeto, no string
          let payload = config.data
          if (typeof payload === 'string') {
            try {
              payload = JSON.parse(payload)
            } catch (e) {
              // Mantener como string si no es JSON válido
            }
          }

          const fullUrl = axios.getUri(config)
          console.log('[Offline] Queueing operation:', config.method.toUpperCase(), fullUrl, payload)

          await addPendingOperation({
            type: method.toUpperCase(),
            endpoint: fullUrl,
            method: method.toUpperCase(),
            payload: payload
          })

          return {
            data: config.data || null,
            status: 200,
            statusText: 'OK (queued)',
            headers: {},
            config,
            queued: true
          }
        }

        // Otros métodos - devolver respuesta vacía
        console.log(`[Offline] Unhandled method ${config.method} for: ${config.url}`)
        return {
          data: null,
          status: 200,
          statusText: 'OK (offline)',
          headers: {},
          config,
          offline: true
        }
      }

      return Promise.reject(error)
    }
  )

  console.log('Axios offline interceptors installed')
}

export default {
  setupAxiosOffline,
  syncPendingOperations,
  getPendingOperationsCount,
  getOnlineStatus,
  setOnlineStatus
}
