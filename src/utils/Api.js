import axios from 'axios'
import {
  saveProject,
  getProject,
  getAllProjects,
  saveWorksheet,
  getWorksheet,
  getWorksheetsByProject,
  saveFinding,
  getFindingsByWorksheet,
  saveReference,
  getReferencesByProject,
  saveCharacteristic,
  getCharacteristicsByProject,
  saveAssessment,
  getAssessmentsByProject,
  saveExtractedData,
  getExtractedDataByFinding,
  saveListCategory,
  getListCategoriesByProject,
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  getPendingOperationsCount
} from '@/services/db'

// Estado de conexión
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

// Listeners para cambios de conexión
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Browser reports: online')
    // Resetear estado - la próxima petición confirmará si realmente hay conexión
    isOnline = true
    // Intentar sincronizar operaciones pendientes
    setTimeout(() => {
      Api.syncPendingOperations()
    }, 1000)
  })

  window.addEventListener('offline', () => {
    console.log('Browser reports: offline')
    isOnline = false
  })
}

// Crear error compatible con estructura de Axios
function createOfflineError (message = 'No internet connection') {
  const error = new Error(message)
  error.isOfflineError = true
  error.response = {
    status: 0,
    statusText: 'Offline',
    data: { message, offline: true }
  }
  error.request = {}
  return error
}

// Patrones de endpoints para cachear
const CACHE_PATTERNS = {
  projects: /^\/isoqf_projects(\/|$|\?)/,
  worksheets: /^\/isoqf_lists(\/|$|\?)|^\/getLists/,
  singleProject: /^\/isoqf_projects\/(\d+)/,
  singleWorksheet: /^\/getLists\?id=(\d+)/,
  findings: /^\/isoqf_findings(\/|$|\?)|^\/findings/,
  references: /^\/isoqf_references(\/|$|\?)/,
  characteristics: /^\/isoqf_characteristics(\/|$|\?)/,
  assessments: /^\/isoqf_assessments(\/|$|\?)/,
  extractedData: /^\/isoqf_extracted_data(\/|$|\?)/,
  listCategories: /^\/isoqf_list_categories(\/|$|\?)/
}

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
    // Cachear si coincide con patrones incluidos
    for (const key of Object.keys(CACHE_PATTERNS)) {
      if (CACHE_PATTERNS[key].test(path)) return true
    }
    return false
  }

  static async cacheResponse (path, data) {
    try {
      // Cachear proyectos
      if (CACHE_PATTERNS.projects.test(path)) {
        if (Array.isArray(data)) {
          // Lista de proyectos
          for (const project of data) {
            await saveProject({ id: project.id, data: project })
          }
        } else if (data && data.id) {
          // Proyecto individual
          await saveProject({ id: data.id, data })
        }
      }

      // Cachear worksheets
      if (CACHE_PATTERNS.worksheets.test(path)) {
        if (Array.isArray(data)) {
          for (const worksheet of data) {
            await saveWorksheet({
              id: worksheet.id,
              projectId: worksheet.project_id,
              data: worksheet
            })
          }
        } else if (data && data.id) {
          await saveWorksheet({
            id: data.id,
            projectId: data.project_id,
            data
          })
        }
      }

      // Cachear findings
      if (CACHE_PATTERNS.findings.test(path)) {
        if (Array.isArray(data)) {
          for (const finding of data) {
            await saveFinding({
              id: finding.id,
              worksheetId: finding.list_id,
              data: finding
            })
          }
        }
      }

      // Cachear references
      if (CACHE_PATTERNS.references.test(path)) {
        if (Array.isArray(data)) {
          for (const ref of data) {
            await saveReference({
              id: ref.id,
              projectId: ref.project_id,
              data: ref
            })
          }
        }
      }

      // Cachear characteristics
      if (CACHE_PATTERNS.characteristics.test(path)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            await saveCharacteristic(item)
          }
        }
      }

      // Cachear assessments
      if (CACHE_PATTERNS.assessments.test(path)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            await saveAssessment(item)
          }
        }
      }

      // Cachear extracted data
      if (CACHE_PATTERNS.extractedData.test(path)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            await saveExtractedData(item)
          }
        }
      }

      // Cachear list categories
      if (CACHE_PATTERNS.listCategories.test(path)) {
        if (Array.isArray(data)) {
          for (const item of data) {
            await saveListCategory(item)
          }
        }
      }
    } catch (error) {
      console.warn('Error caching response:', error)
    }
  }

  static async getCachedData (path, params = {}) {
    try {
      // Intentar obtener datos del cache según el patrón

      // Lista de proyectos
      if (path === '/isoqf_projects' || path.startsWith('/isoqf_projects?')) {
        const cached = await getAllProjects()
        if (cached && cached.length > 0) {
          return cached.map(p => p.data)
        }
      }

      // Proyecto individual
      const projectMatch = path.match(/\/isoqf_projects\/(\d+)/)
      if (projectMatch) {
        const projectId = parseInt(projectMatch[1])
        const cached = await getProject(projectId)
        if (cached) return cached.data
      }

      // Worksheet individual via path regex
      const worksheetMatch = path.match(/getLists\?id=(\d+)/)
      if (worksheetMatch) {
        const worksheetId = parseInt(worksheetMatch[1])
        const cached = await getWorksheet(worksheetId)
        if (cached) return cached.data
      }

      // Worksheet individual via params
      if ((path === '/getLists' || path === '/getLists/') && params && params.id) {
        const worksheetId = parseInt(params.id)
        const cached = await getWorksheet(worksheetId)
        if (cached) return cached.data
      }

      // Worksheets por proyecto
      const worksheetsMatch = path.match(/isoqf_lists\?project_id=(\d+)/)
      if (worksheetsMatch) {
        const projectId = parseInt(worksheetsMatch[1])
        const cached = await getWorksheetsByProject(projectId)
        if (cached && cached.length > 0) {
          return cached.map(w => w.data)
        }
      }
      
      // Fallback: check params object if regex failed
      if ((path === '/isoqf_lists' || path === '/isoqf_lists/') && params && params.project_id) {
         const cached = await getWorksheetsByProject(parseInt(params.project_id))
         if (cached && cached.length > 0) return cached.map(w => w.data)
      }

      // Findings por worksheet
      if (CACHE_PATTERNS.findings.test(path) && params && params.list_id) {
        const cached = await getFindingsByWorksheet(params.list_id)
        if (cached && cached.length > 0) return cached.map(r => r.data)
      }

      // References por proyecto
      if (CACHE_PATTERNS.references.test(path) && params && (params.project_id || params.projectId)) {
        const projectId = params.project_id || params.projectId
        const cached = await getReferencesByProject(projectId)
        if (cached && cached.length > 0) return cached.map(r => r.data)
      }

      // Characteristics por proyecto
      if (CACHE_PATTERNS.characteristics.test(path) && params && (params.project_id || params.projectId)) {
        const projectId = params.project_id || params.projectId
        const cached = await getCharacteristicsByProject(projectId)
        if (cached && cached.length > 0) return cached
      }

      // Assessments por proyecto
      if (CACHE_PATTERNS.assessments.test(path) && params && (params.project_id || params.projectId)) {
        const projectId = params.project_id || params.projectId
        const cached = await getAssessmentsByProject(projectId)
        if (cached && cached.length > 0) return cached
      }

      // Extracted Data por finding
      if (CACHE_PATTERNS.extractedData.test(path) && params && (params.finding_id || params.findingId)) {
        const findingId = params.finding_id || params.findingId
        const cached = await getExtractedDataByFinding(findingId)
        if (cached && cached.length > 0) return cached
      }

      // List Categories por proyecto
      if (CACHE_PATTERNS.listCategories.test(path) && params && (params.project_id || params.projectId)) {
        const projectId = params.project_id || params.projectId
        const cached = await getListCategoriesByProject(projectId)
        if (cached && cached.length > 0) return cached
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
          console.log(`Serving from cache (${reason}):`, path)
          return { data: cachedData, fromCache: true, status: 200 }
        }
      }
      return null
    }

    // Si sabemos que estamos offline, intentar cache primero
    if (!isOnline) {
      const cached = await tryServeFromCache('offline')
      if (cached) return cached
      throw createOfflineError('No internet connection and no cached data available')
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
        console.log('Network error detected, switching to offline mode')

        // Intentar servir desde cache
        const cached = await tryServeFromCache('network error')
        if (cached) return cached

        // No hay cache, lanzar error compatible con Axios
        throw createOfflineError('Network error - no cached data available for: ' + path)
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
      console.log('Operation queued for sync:', 'PUT', url)
      return { data: data, queued: true, status: 200 }
    }

    if (!isOnline) {
      return queueOperation()
    }

    try {
      return await axios.put(url, data, { headers: this.getHeaders(), withCredentials: true })
    } catch (error) {
      if (!error.response) {
        isOnline = false
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
      console.log('Operation queued for sync:', 'PATCH', url)
      return { data: data, queued: true, status: 200 }
    }

    if (!isOnline) {
      return queueOperation()
    }

    try {
      return await axios.patch(url, data, { headers: this.getHeaders(), withCredentials: true })
    } catch (error) {
      if (!error.response) {
        isOnline = false
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
      console.log('Operation queued for sync:', 'POST', url)
      return { data: data, queued: true, status: 200 }
    }

    if (!isOnline) {
      return queueOperation()
    }

    try {
      return await axios.post(url, data, { headers: this.getHeaders(), withCredentials: true })
    } catch (error) {
      if (!error.response) {
        isOnline = false
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
      console.log('Operation queued for sync:', 'DELETE', url)
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
      console.log(`Syncing ${operations.length} pending operations...`)

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
          console.log('Synced operation:', op.method, op.endpoint)
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
