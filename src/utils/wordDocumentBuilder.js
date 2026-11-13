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

import { cellWidth, tableLayout, toPercents } from '@/utils/wordTableWidths'
import { BODY_SIZE, FONT, HEADING_SIZE, TITLE_SIZE, documentStyles } from '@/utils/wordTypography'
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
  HeightRule
} from 'docx'
import { sanitizeWithLimit, safeText, TEXT_LIMITS } from '@/utils/textSanitizer'

export class WordDocumentBuilder {
  constructor (options = {}) {
    this.sections = []
    this.currentSection = null
    this.options = {
      defaultFontSize: BODY_SIZE,
      defaultFont: FONT,
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
  startSection (config = {}) {
    const page = { ...(config.page || {}) }
    const landscape = config.orientation === 'landscape' ||
      page.orientation === PageOrientation.LANDSCAPE ||
      (page.size && page.size.orientation === PageOrientation.LANDSCAPE)
    delete page.orientation

    // docx 9: la orientación va en `page.size.orientation` y los márgenes en `page.margin`.
    // Las claves de docx 5 (`page.orientation`, `margins`) se ignoran sin error: todo salía
    // vertical y con 1440 de margen.
    this.currentSection = {
      properties: {
        page: {
          ...page,
          size: { ...(page.size || {}), ...(landscape ? { orientation: PageOrientation.LANDSCAPE } : {}) },
          margin: page.margin || config.margins || this.options.margins
        }
      },
      children: []
    }

    return this
  }

  /**
   * End current section and add to document
   * @returns {WordDocumentBuilder} For chaining
   */
  endSection () {
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
  addHeader (text, level = 1, options = {}) {
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
      1: TITLE_SIZE,
      2: HEADING_SIZE,
      3: HEADING_SIZE
    }

    const paragraph = new Paragraph({
      heading: headingLevels[level] || HeadingLevel.HEADING_2,
      alignment: options.alignment || AlignmentType.LEFT,
      children: [
        new TextRun({
          text: finalText,
          bold: options.bold !== false,
          size: options.size || sizes[level] || HEADING_SIZE,
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
  addParagraph (text, options = {}) {
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
  addSpacing () {
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
  addInfoParagraph (label, content, options = {}) {
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
  addTable (rows, headers, options = {}) {
    const {
      borders = this.getDefaultBorders(),
      headerShading = { fill: '#DDDDDD' },
      rowHeight = { value: 1444, rule: HeightRule.EXACT }
    } = options

    // #168: `header.width.size` es un PESO (los que suman 100 son porcentajes); la tabla
    // ocupa el ancho útil de la página con layout fijo y una grilla que lo respeta.
    const percents = toPercents(headers.map(h => h.width && h.width.size))
    const sized = headers.map((h, i) => ({ ...h, width: cellWidth(percents[i]) }))
    const page = (this.currentSection && this.currentSection.properties.page) || {}

    const tableRows = [
      this.createTableHeaderRow(sized, headerShading, rowHeight),
      ...this.createTableDataRows(rows, options)
    ]

    const table = new Table({
      borders,
      ...tableLayout(percents, page),
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
  createTableHeaderRow (headers, shading, height) {
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
                  size: header.size || BODY_SIZE,
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
  createTableDataRows (rows, options = {}) {
    // Cebra (`options.zebra` = color de las filas pares). Una fila que cruza la tabla es el
    // encabezado de un grupo: no se pinta y la cuenta parte de nuevo después de ella.
    let position = 0
    return rows.map(rowData => {
      const isGroupRow = rowData.length === 1 && rowData[0] && rowData[0].columnSpan > 1
      let cells = rowData
      if (isGroupRow) {
        position = 0
      } else {
        const striped = options.zebra && position % 2 === 1
        position++
        if (striped) {
          cells = rowData.map(cell => {
            const data = typeof cell === 'string' ? { text: cell } : cell
            return data.shading ? data : { ...data, shading: { fill: options.zebra } }
          })
        }
      }
      return new TableRow({
        children: cells.map(cellData => this.createTableCell(cellData, options))
      })
    })
  }

  /**
   * Create a table cell
   * @param {Object|string} cellData
   * @param {Object} options
   * @returns {TableCell}
   */
  createTableCell (cellData, options = {}) {
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

    // #168: `columnSpan` (la fila del grupo de findings) se pasa a docx; antes se perdía y la
    // fila quedaba en la primera columna. Una celda que cruza la tabla mide la tabla entera.
    const spanning = cellData.columnSpan > 1
    const defaultWidth = spanning
      ? cellWidth(100)
      : { size: 'auto', type: WidthType.PERCENTAGE }

    return new TableCell({
      verticalAlign: cellData.verticalAlign || VerticalAlign.CENTER,
      width: cellData.width || defaultWidth,
      ...(spanning ? { columnSpan: cellData.columnSpan } : {}),
      shading: cellData.shading,
      children: cellData.children || [
        new Paragraph({
          alignment: cellData.alignment || AlignmentType.LEFT,
          children: [
            new TextRun({
              text: finalText, // Always a string now
              size: cellData.size || BODY_SIZE,
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
  getDefaultBorders () {
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
  getNoBorders () {
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
  addToCurrentSection (content) {
    if (!this.currentSection) {
      this.startSection()
    }
    this.currentSection.children.push(content)
  }

  /**
   * Build and return the Document
   * @returns {Document}
   */
  build () {
    // Finalize current section if any
    if (this.currentSection) {
      this.endSection()
    }

    const doc = new Document({
      styles: documentStyles,
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
  reset () {
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
export function createDocument (builderFn) {
  const builder = new WordDocumentBuilder()
  builderFn(builder)
  return builder.build()
}
