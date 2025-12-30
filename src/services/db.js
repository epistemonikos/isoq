/**
 * IndexedDB Service using Dexie.js
 * Provides offline caching and sync queue functionality for iSoQ Web
 */

import Dexie from 'dexie'

// Create and configure the database
const db = new Dexie('isoqWebDB')

// Define database schema with indexes
db.version(1).stores({
  // Cache for isoqf projects
  // id: primary key, lastSync: indexed for sync queries
  projects: 'id, lastSync',

  // Cache for worksheets/lists
  // id: primary key, projectId: indexed for filtering by project
  worksheets: 'id, projectId, lastSync',

  // Cache for findings
  // id: primary key, worksheetId: indexed for filtering by worksheet
  findings: 'id, worksheetId, lastSync',

  // Cache for references
  // id: primary key, projectId: indexed for filtering by project
  references: 'id, projectId, lastSync',

  // Queue for offline operations
  // ++id: auto-increment primary key, timestamp: indexed for ordering
  pendingOperations: '++id, type, endpoint, method, timestamp',

  // Sync metadata storage
  // key: primary key for key-value pairs
  syncMetadata: 'key'
})

// Version 2: Add generic URL cache
db.version(2).stores({
  projects: 'id, lastSync',
  worksheets: 'id, projectId, lastSync',
  findings: 'id, worksheetId, lastSync',
  references: 'id, projectId, lastSync',
  pendingOperations: '++id, type, endpoint, method, timestamp',
  syncMetadata: 'key',
  // Generic cache by URL - stores any API response
  urlCache: 'url, type, lastSync'
})

// Version 3: Add additional structured caches
db.version(3).stores({
  projects: 'id, lastSync',
  worksheets: 'id, projectId, lastSync',
  findings: 'id, worksheetId, lastSync',
  references: 'id, projectId, lastSync',
  pendingOperations: '++id, type, endpoint, method, timestamp',
  syncMetadata: 'key',
  urlCache: 'url, type, lastSync',
  
  characteristics: 'id, projectId, lastSync',
  assessments: 'id, projectId, lastSync',
  extractedData: 'id, findingId, lastSync',
  listCategories: 'id, projectId, lastSync'
})

// ============================================
// Project Functions
// ============================================

/**
 * Save a project to the cache
 * @param {Object} project - Project object with id and data
 * @returns {Promise<number>} - The id of the saved project
 */
export async function saveProject(project) {
  try {
    const record = {
      id: project.id,
      data: project.data || project,
      lastSync: new Date().toISOString()
    }
    return await db.projects.put(record)
  } catch (error) {
    console.error('Error saving project to cache:', error)
    throw error
  }
}

/**
 * Get a project from the cache by id
 * @param {number|string} id - Project id
 * @returns {Promise<Object|undefined>} - The cached project or undefined
 */
export async function getProject(id) {
  try {
    return await db.projects.get(id)
  } catch (error) {
    console.error('Error getting project from cache:', error)
    throw error
  }
}

/**
 * Get all cached projects
 * @returns {Promise<Array>} - Array of all cached projects
 */
export async function getAllProjects() {
  try {
    return await db.projects.toArray()
  } catch (error) {
    console.error('Error getting all projects from cache:', error)
    throw error
  }
}

/**
 * Delete a project from the cache
 * @param {number|string} id - Project id
 * @returns {Promise<void>}
 */
export async function deleteProject(id) {
  try {
    return await db.projects.delete(id)
  } catch (error) {
    console.error('Error deleting project from cache:', error)
    throw error
  }
}

// ============================================
// Worksheet Functions
// ============================================

/**
 * Save a worksheet to the cache
 * @param {Object} worksheet - Worksheet object with id, projectId and data
 * @returns {Promise<number>} - The id of the saved worksheet
 */
export async function saveWorksheet(worksheet) {
  try {
    const record = {
      id: worksheet.id,
      projectId: worksheet.projectId,
      data: worksheet.data || worksheet,
      lastSync: new Date().toISOString()
    }
    return await db.worksheets.put(record)
  } catch (error) {
    console.error('Error saving worksheet to cache:', error)
    throw error
  }
}

/**
 * Get a worksheet from the cache by id
 * @param {number|string} id - Worksheet id
 * @returns {Promise<Object|undefined>} - The cached worksheet or undefined
 */
export async function getWorksheet(id) {
  try {
    return await db.worksheets.get(id)
  } catch (error) {
    console.error('Error getting worksheet from cache:', error)
    throw error
  }
}

/**
 * Get all worksheets for a specific project
 * @param {number|string} projectId - Project id
 * @returns {Promise<Array>} - Array of worksheets for the project
 */
export async function getWorksheetsByProject(projectId) {
  try {
    return await db.worksheets.where('projectId').equals(projectId).toArray()
  } catch (error) {
    console.error('Error getting worksheets by project:', error)
    throw error
  }
}

/**
 * Delete a worksheet from the cache
 * @param {number|string} id - Worksheet id
 * @returns {Promise<void>}
 */
export async function deleteWorksheet(id) {
  try {
    return await db.worksheets.delete(id)
  } catch (error) {
    console.error('Error deleting worksheet from cache:', error)
    throw error
  }
}

// ============================================
// Finding Functions
// ============================================

/**
 * Save a finding to the cache
 * @param {Object} finding - Finding object with id, worksheetId and data
 * @returns {Promise<number>} - The id of the saved finding
 */
export async function saveFinding(finding) {
  try {
    const record = {
      id: finding.id,
      worksheetId: finding.worksheetId,
      data: finding.data || finding,
      lastSync: new Date().toISOString()
    }
    return await db.findings.put(record)
  } catch (error) {
    console.error('Error saving finding to cache:', error)
    throw error
  }
}

/**
 * Get a finding from the cache by id
 * @param {number|string} id - Finding id
 * @returns {Promise<Object|undefined>} - The cached finding or undefined
 */
export async function getFinding(id) {
  try {
    return await db.findings.get(id)
  } catch (error) {
    console.error('Error getting finding from cache:', error)
    throw error
  }
}

/**
 * Get all findings for a specific worksheet
 * @param {number|string} worksheetId - Worksheet id
 * @returns {Promise<Array>} - Array of findings for the worksheet
 */
export async function getFindingsByWorksheet(worksheetId) {
  try {
    return await db.findings.where('worksheetId').equals(worksheetId).toArray()
  } catch (error) {
    console.error('Error getting findings by worksheet:', error)
    throw error
  }
}

// ============================================
// Reference Functions
// ============================================

/**
 * Save a reference to the cache
 * @param {Object} reference - Reference object with id, projectId and data
 * @returns {Promise<number>} - The id of the saved reference
 */
export async function saveReference(reference) {
  try {
    const record = {
      id: reference.id,
      projectId: reference.projectId,
      data: reference.data || reference,
      lastSync: new Date().toISOString()
    }
    return await db.references.put(record)
  } catch (error) {
    console.error('Error saving reference to cache:', error)
    throw error
  }
}

/**
 * Get a reference from the cache by id
 * @param {number|string} id - Reference id
 * @returns {Promise<Object|undefined>} - The cached reference or undefined
 */
export async function getReference(id) {
  try {
    return await db.references.get(id)
  } catch (error) {
    console.error('Error getting reference from cache:', error)
    throw error
  }
}

/**
 * Get all references for a specific project
 * @param {number|string} projectId - Project id
 * @returns {Promise<Array>} - Array of references for the project
 */
export async function getReferencesByProject(projectId) {
  try {
    return await db.references.where('projectId').equals(projectId).toArray()
  } catch (error) {
    console.error('Error getting references by project:', error)
    throw error
  }
}

// ============================================
// Characteristics Functions
// ============================================

export async function saveCharacteristic(data) {
  try {
    const record = {
      id: data.id,
      projectId: data.project_id,
      data: data,
      lastSync: new Date().toISOString()
    }
    return await db.characteristics.put(record)
  } catch (error) {
    console.error('Error saving characteristic:', error)
    throw error
  }
}

export async function getCharacteristicsByProject(projectId) {
  try {
    const records = await db.characteristics.where('projectId').equals(projectId).toArray()
    return records.map(r => r.data)
  } catch (error) {
    console.error('Error getting characteristics:', error)
    throw error
  }
}

// ============================================
// Assessments Functions
// ============================================

export async function saveAssessment(data) {
  try {
    const record = {
      id: data.id,
      projectId: data.project_id,
      data: data,
      lastSync: new Date().toISOString()
    }
    return await db.assessments.put(record)
  } catch (error) {
    console.error('Error saving assessment:', error)
    throw error
  }
}

export async function getAssessmentsByProject(projectId) {
  try {
    const records = await db.assessments.where('projectId').equals(projectId).toArray()
    return records.map(r => r.data)
  } catch (error) {
    console.error('Error getting assessments:', error)
    throw error
  }
}

// ============================================
// Extracted Data Functions
// ============================================

export async function saveExtractedData(data) {
  try {
    const record = {
      id: data.id,
      findingId: data.finding_id,
      data: data,
      lastSync: new Date().toISOString()
    }
    return await db.extractedData.put(record)
  } catch (error) {
    console.error('Error saving extracted data:', error)
    throw error
  }
}

export async function getExtractedDataByFinding(findingId) {
  try {
    const records = await db.extractedData.where('findingId').equals(findingId).toArray()
    return records.map(r => r.data)
  } catch (error) {
    console.error('Error getting extracted data:', error)
    throw error
  }
}

// ============================================
// List Categories Functions
// ============================================

export async function saveListCategory(data) {
  try {
    const record = {
      id: data.id,
      projectId: data.project_id,
      data: data,
      lastSync: new Date().toISOString()
    }
    return await db.listCategories.put(record)
  } catch (error) {
    console.error('Error saving list category:', error)
    throw error
  }
}

export async function getListCategoriesByProject(projectId) {
  try {
    const records = await db.listCategories.where('projectId').equals(projectId).toArray()
    return records.map(r => r.data)
  } catch (error) {
    console.error('Error getting list categories:', error)
    throw error
  }
}

// ============================================
// Pending Operations (Offline Queue) Functions
// ============================================

/**
 * Add an operation to the pending queue
 * @param {Object} operation - Operation object with type, endpoint, method, and payload
 * @returns {Promise<number>} - The auto-generated id of the operation
 */
export async function addPendingOperation(operation) {
  try {
    const record = {
      type: operation.type,
      endpoint: operation.endpoint,
      method: operation.method,
      payload: operation.payload,
      timestamp: new Date().toISOString()
    }
    return await db.pendingOperations.add(record)
  } catch (error) {
    console.error('Error adding pending operation:', error)
    throw error
  }
}

/**
 * Get all pending operations ordered by timestamp
 * @returns {Promise<Array>} - Array of pending operations
 */
export async function getPendingOperations() {
  try {
    return await db.pendingOperations.orderBy('timestamp').toArray()
  } catch (error) {
    console.error('Error getting pending operations:', error)
    throw error
  }
}

/**
 * Remove a pending operation after it has been processed
 * @param {number} id - Operation id
 * @returns {Promise<void>}
 */
export async function removePendingOperation(id) {
  try {
    return await db.pendingOperations.delete(id)
  } catch (error) {
    console.error('Error removing pending operation:', error)
    throw error
  }
}

/**
 * Get the count of pending operations
 * @returns {Promise<number>} - Number of pending operations
 */
export async function getPendingOperationsCount() {
  try {
    return await db.pendingOperations.count()
  } catch (error) {
    console.error('Error counting pending operations:', error)
    throw error
  }
}

// ============================================
// Sync Metadata Functions
// ============================================

/**
 * Save a sync metadata value
 * @param {string} key - Metadata key
 * @param {*} value - Metadata value
 * @returns {Promise<string>} - The key of the saved metadata
 */
export async function setSyncMetadata(key, value) {
  try {
    return await db.syncMetadata.put({ key, value })
  } catch (error) {
    console.error('Error setting sync metadata:', error)
    throw error
  }
}

/**
 * Get a sync metadata value
 * @param {string} key - Metadata key
 * @returns {Promise<*>} - The metadata value or undefined
 */
export async function getSyncMetadata(key) {
  try {
    const record = await db.syncMetadata.get(key)
    return record ? record.value : undefined
  } catch (error) {
    console.error('Error getting sync metadata:', error)
    throw error
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Clear all data from the database (useful for logout)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  try {
    await Promise.all([
      db.projects.clear(),
      db.worksheets.clear(),
      db.findings.clear(),
      db.references.clear(),
      db.pendingOperations.clear(),
      db.syncMetadata.clear(),
      db.urlCache.clear()
    ])
  } catch (error) {
    console.error('Error clearing all data from cache:', error)
    throw error
  }
}

/**
 * Check if the database is available and working
 * @returns {Promise<boolean>} - True if database is available
 */
export async function isDatabaseAvailable() {
  try {
    await db.open()
    return true
  } catch (error) {
    console.error('Database is not available:', error)
    return false
  }
}

// ============================================
// Generic URL Cache Functions
// ============================================

/**
 * Save data to URL cache
 * @param {string} url - The URL as cache key
 * @param {string} type - The type of data (for categorization)
 * @param {*} data - The data to cache
 * @returns {Promise<string>} - The URL of the saved cache entry
 */
export async function saveToUrlCache(url, type, data) {
  try {
    const record = {
      url,
      type,
      data,
      lastSync: new Date().toISOString()
    }
    return await db.urlCache.put(record)
  } catch (error) {
    console.error('Error saving to URL cache:', error)
    throw error
  }
}

/**
 * Get data from URL cache
 * @param {string} url - The URL to look up
 * @returns {Promise<*>} - The cached data or undefined
 */
export async function getFromUrlCache(url) {
  try {
    const record = await db.urlCache.get(url)
    return record ? record.data : undefined
  } catch (error) {
    console.error('Error getting from URL cache:', error)
    return undefined
  }
}

/**
 * Get all cached entries of a specific type
 * @param {string} type - The type of data
 * @returns {Promise<Array>} - Array of cached entries
 */
export async function getUrlCacheByType(type) {
  try {
    return await db.urlCache.where('type').equals(type).toArray()
  } catch (error) {
    console.error('Error getting URL cache by type:', error)
    return []
  }
}

/**
 * Clear URL cache entries of a specific type
 * @param {string} type - The type to clear
 * @returns {Promise<number>} - Number of deleted entries
 */
export async function clearUrlCacheByType(type) {
  try {
    return await db.urlCache.where('type').equals(type).delete()
  } catch (error) {
    console.error('Error clearing URL cache by type:', error)
    throw error
  }
}

// Export the database instance for advanced usage
export { db }

// Default export with all functions
export default {
  // Database instance
  db,

  // Project functions
  saveProject,
  getProject,
  getAllProjects,
  deleteProject,

  // Worksheet functions
  saveWorksheet,
  getWorksheet,
  getWorksheetsByProject,
  deleteWorksheet,

  // Finding functions
  saveFinding,
  getFinding,
  getFindingsByWorksheet,

  // Reference functions
  saveReference,
  getReference,
  getReferencesByProject,

  // Characteristics functions
  saveCharacteristic,
  getCharacteristicsByProject,

  // Assessments functions
  saveAssessment,
  getAssessmentsByProject,

  // Extracted Data functions
  saveExtractedData,
  getExtractedDataByFinding,

  // List Categories functions
  saveListCategory,
  getListCategoriesByProject,

  // Pending operations functions
  addPendingOperation,
  getPendingOperations,
  removePendingOperation,
  getPendingOperationsCount,

  // Sync metadata functions
  setSyncMetadata,
  getSyncMetadata,

  // URL Cache functions
  saveToUrlCache,
  getFromUrlCache,
  getUrlCacheByType,
  clearUrlCacheByType,

  // Utility functions
  clearAllData,
  isDatabaseAvailable
}
