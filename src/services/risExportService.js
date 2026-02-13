/**
 * RIS Export Service
 * 
 * Handles the export of references to RIS format files.
 * Provides methods for generating filenames and triggering downloads.
 */

import { formatReferences } from '@/utils/risFormatter'

export default class RisExportService {
  /**
   * Generate a filename for the RIS export
   * @param {string} projectName - Optional project name to include in filename
   * @returns {string} Generated filename
   */
  generateFilename(projectName) {
    if (!projectName || typeof projectName !== 'string' || projectName.trim() === '') {
      return 'references.ris'
    }

    // Sanitize project name: remove special characters and trim
    const sanitized = projectName
      .trim()
      .replace(/[/\\:*?"<>|]/g, '-') // Replace invalid filename chars with dash
      .replace(/\s+/g, ' ') // Normalize whitespace

    return `${sanitized} - references.ris`
  }

  /**
   * Export references to RIS format file
   * @param {Array} references - Array of reference objects
   * @param {Object} options - Export options
   * @param {string} options.filename - Custom filename (optional)
   * @param {string} options.projectName - Project name for filename generation (optional)
   */
  exportToRIS(references, options = {}) {
    // Format references to RIS
    const content = formatReferences(references)

    // Determine filename
    let filename
    if (options.filename) {
      filename = options.filename
    } else if (options.projectName) {
      filename = this.generateFilename(options.projectName)
    } else {
      filename = 'references.ris'
    }

    // Trigger download
    this.downloadFile(content, filename)
  }

  /**
   * Trigger file download in browser with proper UTF-8 encoding
   * @param {string} content - File content
   * @param {string} filename - Filename for download
   */
  downloadFile(content, filename) {
    // Create Blob with UTF-8 BOM for proper encoding of special characters
    const BOM = '\uFEFF'
    const blob = new Blob([BOM + content], { type: 'text/plain;charset=utf-8' })
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const element = document.createElement('a')
    element.setAttribute('href', url)
    element.setAttribute('download', filename)
    element.style.display = 'none'
    
    // Trigger download
    document.body.appendChild(element)
    element.click()
    
    // Cleanup
    document.body.removeChild(element)
    URL.revokeObjectURL(url)
  }
}

/**
 * Get singleton instance of RisExportService
 * @returns {RisExportService}
 */
export function getRisExportService() {
  if (!window.__risExportServiceInstance) {
    window.__risExportServiceInstance = new RisExportService()
  }
  return window.__risExportServiceInstance
}
