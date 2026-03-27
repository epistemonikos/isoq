/**
 * WordDocumentBuilder - Builder class for constructing Word documents
 * 
 * Responsibilities:
 * - Build document sections
 * - Apply consistent styling
 * - Generate complex tables
 * - Integrate text sanitization
 * - Optimize for large documents
 * 
 * @example
 * const builder = new WordDocumentBuilder()
 * builder.addHeader('Project Name', 1)
 * builder.addParagraph('Description')
 * builder.addTable(data, headers)
 * const doc = builder.build()
 */

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableCell,
  TableRow,
  WidthType,
  VerticalAlign,
  BorderStyle,
  PageOrientation,
  HeightRule,
  TableLayoutType
} from 'docx'
import { sanitizeText, sanitizeWithLimit, safeText, TEXT_LIMITS } from '@/utils/textSanitizer'

export class WordDocumentBuilder {
  constructor(options = {}) {
    this.sections = []
    this.currentSection = null
    this.options = {
      defaultFontSize: 24,
      defaultFont: 'Times New Roman',
      margins: {
        top: 720,
        right: 720,
        bottom: 720,
        left: 720
      },
      ...options
    }
  }

  /**
   * Start a new section
   * @param {Object} config - Section configuration
   * @returns {WordDocumentBuilder} For chaining
   */
  startSection(config = {}) {
    this.currentSection = {
      properties: {
        margins: config.margins || this.options.margins,
        page: config.page || {}
      },
      children: []
    }

    if (config.orientation === 'landscape') {
      this.currentSection.properties.page = {
        orientation: PageOrientation.LANDSCAPE
      }
    }

    return this
  }

  /**
   * End current section and add to document
   * @returns {WordDocumentBuilder} For chaining
   */
  endSection() {
    if (this.currentSection) {
      this.sections.push(this.currentSection)
      this.currentSection = null
    }
    return this
  }

  /**
   * Add a header paragraph
   * @param {string} text
   * @param {number} level - 1, 2, or 3
   * @param {Object} options
   * @returns {WordDocumentBuilder} For chaining
   */
  addHeader(text, level = 1, options = {}) {
    const sanitized = sanitizeWithLimit(
      safeText(text),
      TEXT_LIMITS.projectName,
      { preserveNewlines: false }
    )

    // Ensure text is always a string
    const finalText = sanitized || ''

    const headingLevels = {
      1: HeadingLevel.HEADING_1,
      2: HeadingLevel.HEADING_2,
      3: HeadingLevel.HEADING_3
    }

    const sizes = {
      1: 36,
      2: 32,
      3: 28
    }

    const paragraph = new Paragraph({
      heading: headingLevels[level] || HeadingLevel.HEADING_2,
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: finalText,
          bold: options.bold !== false,
          size: options.size || sizes[level] || 32,
          font: { name: options.font || this.options.defaultFont },
          color: options.color || '000000'
        })
      ]
    })

    this.addToCurrentSection(paragraph)
    return this
  }

  /**
   * Add a paragraph
   * @param {string} text
   * @param {Object} options
   * @returns {WordDocumentBuilder} For chaining
   */
  addParagraph(text, options = {}) {
    const sanitized = sanitizeWithLimit(
      safeText(text),
      options.maxLength || TEXT_LIMITS.projectDescription,
      {
        preserveNewlines: options.preserveNewlines !== false,
        preserveEmojis: options.preserveEmojis !== false
      }
    )

    // Ensure text is always a string
    const finalText = sanitized || ''

    const paragraph = new Paragraph({
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: finalText,
          bold: options.bold || false,
          size: options.size || this.options.defaultFontSize,
          font: { name: options.font || this.options.defaultFont },
          color: options.color || '000000'
        })
      ]
    })

    this.addToCurrentSection(paragraph)
    return this
  }

  /**
   * Add an empty paragraph (spacing)
   * @returns {WordDocumentBuilder} For chaining
   */
  addSpacing() {
    this.addToCurrentSection(new Paragraph(''))
    return this
  }

  /**
   * Add an info paragraph (label + content)
   * @param {string} label
   * @param {string} content
   * @param {Object} options
   * @returns {WordDocumentBuilder} For chaining
   */
  addInfoParagraph(label, content, options = {}) {
    const sanitizedContent = sanitizeWithLimit(
      safeText(content),
      options.maxLength || TEXT_LIMITS.projectDescription,
      { preserveNewlines: false }
    )

    // Ensure both label and content are always strings
    const finalLabel = label || ''
    const finalContent = sanitizedContent || ''

    // Label paragraph
    this.addToCurrentSection(
      new Paragraph({
        children: [
          new TextRun({
            text: finalLabel,
            bold: true,
            size: options.size || this.options.defaultFontSize
          })
        ]
      })
    )

    // Content paragraph
    this.addToCurrentSection(
      new Paragraph({
        children: [
          new TextRun({
            text: finalContent,
            size: options.size || this.options.defaultFontSize
          })
        ]
      })
    )

    return this
  }

  /**
   * Add a table
   * @param {Array<Array>} rows - Array of row data
   * @param {Array} headers - Array of header configurations
   * @param {Object} options - Table options
   * @returns {WordDocumentBuilder} For chaining
   */
  addTable(rows, headers, options = {}) {
    const {
      borders = this.getDefaultBorders(),
      width = { size: 5000, type: WidthType.PERCENTAGE },
      layout = { type: TableLayoutType.FIXED },
      headerShading = { fill: '#DDDDDD' },
      rowHeight = { value: 1444, rule: HeightRule.EXACT }
    } = options

    const tableRows = [
      this.createTableHeaderRow(headers, headerShading, rowHeight),
      ...this.createTableDataRows(rows, options)
    ]

    const table = new Table({
      borders,
      width,
      layout,
      rows: tableRows
    })

    this.addToCurrentSection(table)
    return this
  }

  /**
   * Create table header row
   * @param {Array} headers
   * @param {Object} shading
   * @param {Object} height
   * @returns {TableRow}
   */
  createTableHeaderRow(headers, shading, height) {
    return new TableRow({
      tableHeader: true,
      height,
      children: headers.map(header =>
        new TableCell({
          verticalAlign: VerticalAlign.CENTER,
          shading,
          width: header.width || { size: 'auto', type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              alignment: header.alignment || AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: header.text,
                  size: header.size || 22,
                  bold: header.bold !== false
                })
              ]
            })
          ]
        })
      )
    })
  }

  /**
   * Create table data rows
   * @param {Array<Array>} rows
   * @param {Object} options
   * @returns {Array<TableRow>}
   */
  createTableDataRows(rows, options = {}) {
    return rows.map(rowData =>
      new TableRow({
        children: rowData.map(cellData => this.createTableCell(cellData, options))
      })
    )
  }

  /**
   * Create a table cell
   * @param {Object|string} cellData
   * @param {Object} options
   * @returns {TableCell}
   */
  createTableCell(cellData, options = {}) {
    // Handle simple string data
    if (typeof cellData === 'string') {
      cellData = { text: cellData }
    }

    const originalText = safeText(cellData.text)
    const sanitized = sanitizeWithLimit(
      originalText,
      cellData.maxLength || TEXT_LIMITS.tableCell,
      {
        preserveNewlines: cellData.preserveNewlines || false,
        preserveEmojis: cellData.preserveEmojis !== false
      }
    )

    // CRITICAL: Ensure text is always a string, never undefined/null
    const finalText = sanitized || ''

    return new TableCell({
      verticalAlign: cellData.verticalAlign || VerticalAlign.CENTER,
      width: cellData.width || { size: 'auto', type: WidthType.PERCENTAGE },
      shading: cellData.shading,
      children: cellData.children || [
        new Paragraph({
          alignment: cellData.alignment || AlignmentType.LEFT,
          children: [
            new TextRun({
              text: finalText,  // Always a string now
              size: cellData.size || 22,
              bold: cellData.bold || false
            })
          ]
        })
      ]
    })
  }

  /**
   * Get default table borders
   * @returns {Object}
   */
  getDefaultBorders() {
    return {
      top: { size: 1, color: '000000', style: BorderStyle.SINGLE },
      bottom: { size: 1, color: '000000', style: BorderStyle.SINGLE },
      left: { size: 1, color: '000000', style: BorderStyle.SINGLE },
      right: { size: 1, color: '000000', style: BorderStyle.SINGLE },
      insideHorizontal: { size: 1, color: '000000', style: BorderStyle.SINGLE },
      insideVertical: { style: BorderStyle.NONE }
    }
  }

  /**
   * Get no borders configuration
   * @returns {Object}
   */
  getNoBorders() {
    return {
      top: { size: 1, color: '000000', style: BorderStyle.NONE },
      bottom: { size: 1, color: '000000', style: BorderStyle.NONE },
      left: { size: 1, color: '000000', style: BorderStyle.NONE },
      right: { size: 1, color: '000000', style: BorderStyle.NONE },
      insideHorizontal: { size: 1, color: '000000', style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    }
  }

  /**
   * Add content to current section
   * @param {*} content
   */
  addToCurrentSection(content) {
    if (!this.currentSection) {
      this.startSection()
    }
    this.currentSection.children.push(content)
  }

  /**
   * Build and return the Document
   * @returns {Document}
   */
  build() {
    // Finalize current section if any
    if (this.currentSection) {
      this.endSection()
    }

    const doc = new Document({
      sections: this.sections.map(section => ({
        properties: section.properties,
        children: section.children
      }))
    })

    return doc
  }

  /**
   * Reset builder state
   * @returns {WordDocumentBuilder} For chaining
   */
  reset() {
    this.sections = []
    this.currentSection = null
    return this
  }
}

/**
 * Helper function to create a simple document
 * @param {Function} builderFn - Function that receives builder instance
 * @returns {Document}
 */
export function createDocument(builderFn) {
  const builder = new WordDocumentBuilder()
  builderFn(builder)
  return builder.build()
}
