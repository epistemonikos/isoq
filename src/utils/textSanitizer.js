/**
 * TextSanitizer - Utility class for sanitizing text before exporting to Word documents
 * 
 * Handles:
 * - Emojis and Unicode characters
 * - XML/HTML special characters
 * - Whitespace normalization
 * - Invisible characters
 * - Text truncation
 * - Markdown removal
 * 
 * @example
 * const sanitizer = new TextSanitizer()
 * const clean = sanitizer.sanitize('Text with <html> & emojis 🚀')
 */

export class TextSanitizer {
  constructor(options = {}) {
    this.options = {
      preserveEmojis: true,
      preserveNewlines: true,
      maxConsecutiveNewlines: 2,
      stripHtml: true,
      stripMarkdown: false,
      escapeXml: false, // docx library handles XML escaping internally
      removeInvisible: true,
      normalizeWhitespace: true,
      ...options
    }
  }

  /**
   * Main sanitization method
   * @param {string} text - Text to sanitize
   * @param {Object} customOptions - Override default options
   * @returns {string} Sanitized text
   */
  sanitize(text, customOptions = {}) {
    const opts = { ...this.options, ...customOptions }
    
    if (!text) return ''
    
    let clean = text.toString()
    
    // 1. Remove invisible characters first
    if (opts.removeInvisible) {
      clean = this.removeInvisibleCharacters(clean)
    }
    
    // 2. Strip HTML tags
    if (opts.stripHtml) {
      clean = this.stripHtmlTags(clean)
    }
    
    // 3. Strip Markdown
    if (opts.stripMarkdown) {
      clean = this.stripMarkdown(clean)
    }
    
    // 4. Remove emojis if needed
    if (!opts.preserveEmojis) {
      clean = this.removeEmojis(clean)
    }
    
    // 5. Normalize whitespace (AFTER stripping things that leave spaces)
    if (opts.normalizeWhitespace) {
      clean = this.normalizeWhitespace(clean, opts)
    }
    
    // 6. Escape XML characters (only if explicitly requested)
    if (opts.escapeXml) {
      clean = this.escapeXmlCharacters(clean)
    }
    
    // 7. Remove control characters (except newlines and tabs)
    clean = this.removeControlCharacters(clean)
    
    return clean.trim()
  }

  /**
   * Sanitize text with length limit
   * @param {string} text - Text to sanitize
   * @param {number} maxLength - Maximum length
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized and truncated text
   */
  sanitizeWithLimit(text, maxLength, options = {}) {
    const sanitized = this.sanitize(text, options)
    return this.truncate(sanitized, maxLength)
  }

  /**
   * Remove invisible Unicode characters
   * @param {string} text
   * @returns {string}
   */
  removeInvisibleCharacters(text) {
    return text
      .replace(/\u200B/g, '') // Zero-width space
      .replace(/\u200C/g, '') // Zero-width non-joiner
      .replace(/\u200D/g, '') // Zero-width joiner
      .replace(/\uFEFF/g, '') // Byte Order Mark (BOM)
      .replace(/\u00AD/g, '') // Soft hyphen
      .replace(/\uFE0F/g, '') // Variation Selector-16 (often follows emojis like ❤️)
  }

  /**
   * Strip HTML tags from text
   * @param {string} text
   * @returns {string}
   */
  stripHtmlTags(text) {
    // Remove HTML tags
    let clean = text.replace(/<[^>]*>/g, '')
    
    // Decode common HTML entities
    clean = clean
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
    
    return clean
  }

  /**
   * Strip Markdown formatting
   * @param {string} text
   * @returns {string}
   */
  stripMarkdown(text) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold** → bold
      .replace(/\*(.+?)\*/g, '$1')          // *italic* → italic
      .replace(/__(.+?)__/g, '$1')          // __bold__ → bold
      .replace(/_(.+?)_/g, '$1')            // _italic_ → italic
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')   // [text](url) → text
      .replace(/`(.+?)`/g, '$1')            // `code` → code
      .replace(/^#+\s/gm, '')               // # heading → heading
      .replace(/^>\s/gm, '')                // > quote → quote
      .replace(/^[-*+]\s/gm, '')            // - list → list
  }

  /**
   * Normalize whitespace characters
   * @param {string} text
   * @param {Object} options
   * @returns {string}
   */
  normalizeWhitespace(text, options) {
    let normalized = text
    
    // Convert tabs to spaces
    normalized = normalized.replace(/\t/g, '    ')
    
    // Remove multiple consecutive spaces
    normalized = normalized.replace(/ {2,}/g, ' ')
    
    if (options.preserveNewlines) {
      // Limit consecutive newlines
      const maxNewlines = options.maxConsecutiveNewlines
      const pattern = new RegExp(`\\n{${maxNewlines + 1},}`, 'g')
      normalized = normalized.replace(pattern, '\n'.repeat(maxNewlines))
      
      // Trim each line
      normalized = normalized.split('\n').map(line => line.trim()).join('\n')
    } else {
      // Convert all newlines to spaces
      normalized = normalized.replace(/\n/g, ' ')
      // Clean up multiple spaces again
      normalized = normalized.replace(/ {2,}/g, ' ')
    }
    
    return normalized
  }

  /**
   * Remove emoji characters
   * @param {string} text
   * @returns {string}
   */
  removeEmojis(text) {
    return text
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
      .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
      .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
  }

  /**
   * Escape XML special characters
   * Note: The docx library handles this internally, so this is optional
   * @param {string} text
   * @returns {string}
   */
  escapeXmlCharacters(text) {
    return text
      .replace(/&/g, '&amp;')   // Must be first
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * Remove control characters (except newlines and tabs)
   * @param {string} text
   * @returns {string}
   */
  removeControlCharacters(text) {
    // Remove control characters except \n (0x0A) and \t (0x09)
    return text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  }

  /**
   * Truncate text intelligently at word boundaries
   * @param {string} text
   * @param {number} maxLength
   * @param {string} suffix
   * @returns {string}
   */
  truncate(text, maxLength, suffix = '...') {
    if (!text || text.length <= maxLength) return text
    
    // Try to truncate at word boundary
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > maxLength * 0.8) {
      // If we found a space in the last 20%, use it
      return truncated.substring(0, lastSpace) + suffix
    }
    
    // Otherwise just truncate at maxLength
    return truncated + suffix
  }

  /**
   * Safe text extraction - handles null, undefined, and various types
   * @param {*} value
   * @param {string} defaultValue
   * @returns {string}
   */
  static safeText(value, defaultValue = '') {
    if (value === null || value === undefined) return defaultValue
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toString()
    if (typeof value === 'boolean') return value ? 'Yes' : 'No'
    if (Array.isArray(value)) return value.join(', ')
    
    try {
      return value.toString()
    } catch (error) {
      console.warn('TextSanitizer: Could not convert value to string', value)
      return defaultValue
    }
  }

  /**
   * Extract text from nested object path
   * @param {Object} obj
   * @param {string} path - Dot-separated path (e.g., 'evidence_profile.coherence.explanation')
   * @param {string} defaultValue
   * @returns {string}
   */
  static extractTextFromPath(obj, path, defaultValue = '') {
    if (!obj) return defaultValue
    
    const keys = path.split('.')
    let value = obj
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return defaultValue
      }
    }
    
    return TextSanitizer.safeText(value, defaultValue)
  }
}

// Singleton instance for convenience
export const textSanitizer = new TextSanitizer()

// Helper functions for common use cases
export function sanitizeText(text, options) {
  return textSanitizer.sanitize(text, options)
}

export function sanitizeWithLimit(text, maxLength, options) {
  return textSanitizer.sanitizeWithLimit(text, maxLength, options)
}

export function safeText(value, defaultValue = '') {
  return TextSanitizer.safeText(value, defaultValue)
}

export function extractTextFromPath(obj, path, defaultValue = '') {
  return TextSanitizer.extractTextFromPath(obj, path, defaultValue)
}

// Recommended text length limits for Word export
export const TEXT_LIMITS = {
  projectName: 200,
  projectDescription: 2000,
  findingName: 500,
  findingExplanation: 5000,
  cerqualExplanation: 5000,
  referenceContent: 1000,
  authorInfo: 300,
  tableCell: 1000
}
