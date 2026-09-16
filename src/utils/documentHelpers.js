import {
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
  HeightRule,
  Packer
} from 'docx'
import { saveAs } from 'file-saver'

export function generateAuthorInfo (project) {
  if (!project.author || !project.author.length) return ''
  let data = project.author.toString()
  if (project.author_email && project.author_email.length) {
    data = data.concat(' - ' + project.author_email.toString())
  }
  return data
}

export function getStandardBorders () {
  return {
    top: { size: 1, color: '000000', style: BorderStyle.SINGLE },
    bottom: { size: 1, color: '000000', style: BorderStyle.SINGLE },
    left: { size: 1, color: '000000', style: BorderStyle.SINGLE },
    right: { size: 1, color: '000000', style: BorderStyle.SINGLE },
    insideHorizontal: { size: 1, color: '000000', style: BorderStyle.SINGLE },
    insideVertical: { style: BorderStyle.NONE }
  }
}

export function getNoBorders () {
  return {
    top: { size: 1, color: '000000', style: BorderStyle.NONE },
    bottom: { size: 1, color: '000000', style: BorderStyle.NONE },
    left: { size: 1, color: '000000', style: BorderStyle.NONE },
    right: { size: 1, color: '000000', style: BorderStyle.NONE },
    insideHorizontal: { size: 1, color: '000000', style: BorderStyle.NONE },
    insideVertical: { style: BorderStyle.NONE }
  }
}

export function createParagraph (text, options = {}) {
  const { alignment = AlignmentType.LEFT, size = 24, bold = false, heading = null } = options
  return new Paragraph({
    alignment,
    heading,
    children: [new TextRun({ text, size, bold, font: { name: 'Calibri' } })]
  })
}

export function createInfoParagraph (label, content) {
  return [
    new Paragraph({
      children: [new TextRun({ text: label, bold: true, size: 24, font: { name: 'Calibri' } })]
    }),
    new Paragraph({
      children: [new TextRun({ text: content || '', size: 24, font: { name: 'Calibri' } })]
    })
  ]
}

export function createDocumentHeader (projectName, title, size = 36) {
  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: projectName, bold: true, size, font: { name: 'Calibri' }, color: '000000' })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun({ text: title, bold: true, size, font: { name: 'Calibri' }, color: '000000' })]
    }),
    new Paragraph('')
  ]
}

export function createProjectInfoSection (project) {
  return [
    ...createInfoParagraph('Review question', project.review_question),
    new Paragraph(''),
    ...createInfoParagraph('Authors of the review', project.authors),
    new Paragraph(''),
    ...createInfoParagraph('Corresponding author', generateAuthorInfo(project)),
    new Paragraph(''),
    ...createInfoParagraph('Has the review been published?',
      (project.published_status)
        ? ('Yes' + (project.url_doi && project.url_doi.length ? ' | DOI: ' + project.url_doi : ''))
        : 'No'
    ),
    new Paragraph(''),
    ...createInfoParagraph('Additional Information', project.description),
    new Paragraph('')
  ]
}

export function createTableCell (content, options = {}) {
  const {
    width = { size: 'auto', type: WidthType.PERCENTAGE },
    alignment = AlignmentType.LEFT,
    size = 22,
    bold = false,
    verticalAlign = VerticalAlign.CENTER
  } = options
  return new TableCell({
    width,
    verticalAlign,
    children: [new Paragraph({ alignment, children: [new TextRun({ text: content || '', size, bold })] })]
  })
}

export function createTableHeader (headers, shading = { fill: '#DDDDDD' }, height = { height: 1444, rule: HeightRule.EXACT }) {
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
            children: [new TextRun({ text: header.text, size: header.size || 22, bold: header.bold !== false })]
          })
        ]
      })
    )
  })
}

export function createTableRows (data) {
  return data.map(item =>
    new TableRow({
      children: item.map(cell =>
        new TableCell({
          verticalAlign: cell.verticalAlign || VerticalAlign.CENTER,
          width: cell.width || { size: 'auto', type: WidthType.PERCENTAGE },
          children: cell.children || [
            new Paragraph({
              alignment: cell.alignment || AlignmentType.LEFT,
              children: [new TextRun({ text: cell.text || '', size: cell.size || 22, bold: cell.bold || false })]
            })
          ]
        })
      )
    })
  )
}

export function createStandardTable (data, headers, options = {}) {
  const {
    borders = getStandardBorders(),
    width = { size: '100%', type: WidthType.PERCENTAGE },
    headerShading = { fill: '#DDDDDD' },
    rowHeight = { height: 1444, rule: HeightRule.EXACT }
  } = options
  return new Table({
    borders,
    width,
    rows: [
      createTableHeader(headers, headerShading, rowHeight),
      ...createTableRows(data)
    ]
  })
}

export function createLicenseSection (project) {
  if (project.public_type === 'private') return []
  return [
    createParagraph('License', { bold: true }),
    createParagraph(project.license_type || 'CC-BY-NC-ND'),
    new Paragraph('')
  ]
}

export function createReferencesSection (references, listReferences) {
  const allReferences = JSON.parse(JSON.stringify(references))
  return allReferences
    .filter(reference => listReferences.includes(reference.id))
    .map(reference =>
      new Paragraph({
        children: [new TextRun({ text: reference.content, size: 16 })]
      })
    )
}

export async function generateAndDownloadDocument (doc, filename) {
  try {
    const blob = await Packer.toBlob(doc)
    saveAs(blob, filename)
    return true
  } catch (error) {
    console.error('Error generating document:', error)
    return false
  }
}
