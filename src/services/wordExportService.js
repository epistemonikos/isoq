/**
 * WordExportService - Service for orchestrating Word document exports
 * 
 * Responsibilities:
 * - Validate export data
 * - Select appropriate export strategy
 * - Track export progress
 * - Handle errors
 * - Generate filenames
 * 
 * @example
 * const service = getWordExportService()
 * service.onProgress((progress, step) => console.log(progress, step))
 * await service.exportToWord(project, data, { filename: 'export.docx' })
 */

import { ExportStrategyFactory } from '@/strategies/exportStrategies'
import { DocumentGenerator } from '@/utils/documentGenerator'
import { sanitizeText } from '@/utils/textSanitizer'
import { i18n } from '@/plugins/i18n'

export class WordExportService {
  constructor() {
    this.progressCallback = null
    this.documentGenerator = new DocumentGenerator()
    this.i18n = i18n
    this.currentExport = null
  }

  /**
   * Set progress callback
   * @param {Function} callback - (progress: number, step: string) => void
   */
  onProgress(callback) {
    this.progressCallback = callback
    this.documentGenerator.setProgressCallback(callback)
  }

  /**
   * Main export method
   * @param {Object} project - Project data
   * @param {Object} data - Export data (findings, references, etc.)
   * @param {Object} options - Export options
   * @returns {Promise<boolean>} Success status
   */
  async exportToWord(project, data, options = {}) {
    try {
      // Get locale from options or use default
      const locale = options.locale || this.i18n.locale || 'en'
      
      // Step 1: Validate data
      this.updateProgress(10, 'Validating data...')
      const validationErrors = this.validateExportData(project, data)
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(', ')}`)
      }

      // Step 2: Determine export strategy
      this.updateProgress(20, 'Preparing export strategy...')
      const strategyType = this.getStrategyType(project)
      const strategy = ExportStrategyFactory.createStrategy(strategyType, project, data, locale)

      // Step 3: Generate document
      this.updateProgress(30, 'Generating document...')
      this.currentExport = strategy
      
      const filename = this.generateFilename(project, options.filename, locale)
      const success = await strategy.generateAndDownload(filename)

      if (success) {
        this.updateProgress(100, 'Export completed')
        return true
      } else {
        throw new Error('Failed to generate document')
      }
    } catch (error) {
      console.error('WordExportService: Export failed', error)
      this.updateProgress(0, 'Export failed')
      throw error
    } finally {
      this.currentExport = null
    }
  }

  /**
   * Validate export data
   * @param {Object} project
   * @param {Object} data
   * @returns {Array<string>} Array of error messages
   */
  validateExportData(project, data) {
    const errors = []

    // Validate project
    if (!project) {
      errors.push('Project data is required')
      return errors
    }

    if (!project.name || project.name.trim() === '') {
      errors.push('Project name is required')
    }

    // Validate data object
    if (!data) {
      errors.push('Export data is required')
      return errors
    }

    // For iSoQ projects, findings are required
    if (!project.use_camelot) {
      if (!data.findings || !Array.isArray(data.findings)) {
        errors.push('Findings data is required for iSoQ projects')
      } else if (data.findings.length === 0) {
        errors.push('At least one finding is required')
      }
    }

    // References are always required
    if (!data.references || !Array.isArray(data.references)) {
      errors.push('References data is required')
    }

    return errors
  }

  /**
   * Determine which export strategy to use
   * @param {Object} project
   * @returns {string} Strategy type ('isoq' or 'camelot')
   */
  getStrategyType(project) {
    return project.use_camelot ? 'camelot' : 'isoq'
  }

  /**
   * Generate filename for export
   * @param {Object} project
   * @param {string} customFilename
   * @param {string} locale
   * @returns {string}
   */
  generateFilename(project, customFilename, locale = 'en') {
    if (customFilename) {
      return customFilename.endsWith('.docx') 
        ? customFilename 
        : `${customFilename}.docx`
    }

    const baseName = project.name || 'iSoQ Export'
    const sanitizedName = this.sanitizeFilename(baseName)
    
    // Temporarily set locale to get translation
    const originalLocale = this.i18n.locale
    this.i18n.locale = locale
    const suffix = this.i18n.t('actionButtons.word_export.filename_suffix')
    this.i18n.locale = originalLocale
    
    return `${sanitizedName} - ${suffix}.docx`
  }

  /**
   * Sanitize filename (remove invalid characters)
   * @param {string} filename
   * @returns {string}
   */
  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, ' ')          // Normalize spaces
      .trim()
      .substring(0, 200)             // Limit length
  }

  /**
   * Update progress
   * @param {number} progress - 0-100
   * @param {string} step - Current step description
   */
  updateProgress(progress, step) {
    if (this.progressCallback) {
      this.progressCallback(progress, step)
    }
  }

  /**
   * Cancel current export
   */
  cancelExport() {
    if (this.currentExport) {
      this.documentGenerator.cancelGeneration()
      this.currentExport = null
      this.updateProgress(0, 'Export cancelled')
    }
  }

  /**
   * Estimate document size
   * @param {Object} data
   * @returns {Object} Size estimation
   */
  estimateDocumentSize(data) {
    const findingsCount = data.findings?.length || 0
    const referencesCount = data.references?.length || 0
    
    // Rough estimation: ~2KB per finding, ~1KB per reference
    const estimatedBytes = (findingsCount * 2048) + (referencesCount * 1024) + 10240 // 10KB base
    
    return {
      findings: findingsCount,
      references: referencesCount,
      estimatedSizeKB: Math.round(estimatedBytes / 1024),
      estimatedSizeMB: Math.round((estimatedBytes / 1024 / 1024) * 100) / 100
    }
  }
}

// Singleton instance
let serviceInstance = null

/**
 * Get singleton instance of WordExportService
 * @returns {WordExportService}
 */
export function getWordExportService() {
  if (!serviceInstance) {
    serviceInstance = new WordExportService()
  }
  return serviceInstance
}

/**
 * Helper function to export to Word
 * @param {Object} project
 * @param {Object} data
 * @param {Object} options
 * @returns {Promise<boolean>}
 */
export async function exportToWord(project, data, options = {}) {
  const service = getWordExportService()
  return service.exportToWord(project, data, options)
}
