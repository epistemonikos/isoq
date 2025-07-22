import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import { saveAs } from 'file-saver'

export const documentExportMixin = {
    methods: {
        // Métodos para crear encabezados de documentos
        createDocumentHeader(projectName, title, size = 36) {
            return [
                new Paragraph({
                    heading: HeadingLevel.HEADING_2,
                    children: [
                        new TextRun({
                            text: projectName,
                            bold: true,
                            size: size,
                            font: { name: 'Times New Roman' },
                            color: '000000'
                        })
                    ]
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    heading: HeadingLevel.HEADING_2,
                    children: [
                        new TextRun({
                            text: title,
                            bold: true,
                            size: size,
                            font: { name: 'Times New Roman' },
                            color: '000000'
                        })
                    ]
                }),
                new Paragraph('')
            ]
        },

        // Métodos para crear secciones de información del proyecto
        createProjectInfoSection(project) {
            return [
                this.createInfoParagraph('Review question', project.review_question),
                new Paragraph(''),
                this.createInfoParagraph('Authors of the review', project.authors),
                new Paragraph(''),
                this.createInfoParagraph('Corresponding author', this.generateAuthorInfo(project)),
                new Paragraph(''),
                this.createInfoParagraph('Has the review been published?',
                    (project.published_status) ?
                        ('Yes' + (project.url_doi && project.url_doi.length) ? ' | DOI: ' + project.url_doi : '') :
                        'No'
                ),
                new Paragraph(''),
                this.createInfoParagraph('Additional Information', project.description),
                new Paragraph('')
            ]
        },

        createInfoParagraph(label, content) {
            return [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: label,
                            bold: true,
                            size: 24
                        })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: content || '',
                            size: 24
                        })
                    ]
                })
            ]
        },

        generateAuthorInfo(project) {
            let data = ''
            if (project.author && project.author.length) {
                data = project.author.toString()
                if (project.author_email && project.author_email.length) {
                    const email = project.author_email.toString()
                    data = data.concat(' - ' + email)
                }
            }
            return data
        },

        // Métodos para crear tablas estándar
        createStandardTable(data, headers, options = {}) {
            const {
                borders = this.getStandardBorders(),
                width = { size: '100%', type: WidthType.PERCENTAGE },
                headerShading = { fill: '#DDDDDD' },
                rowHeight = { height: 1444, rule: HeightRule.EXACT }
            } = options

            return new Table({
                borders,
                width,
                rows: [
                    this.createTableHeader(headers, headerShading, rowHeight),
                    ...this.createTableRows(data)
                ]
            })
        },

        createTableHeader(headers, shading = { fill: '#DDDDDD' }, height = { height: 1444, rule: HeightRule.EXACT }) {
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
        },

        createTableRows(data) {
            return data.map(item =>
                new TableRow({
                    children: item.map(cell =>
                        new TableCell({
                            verticalAlign: cell.verticalAlign || VerticalAlign.CENTER,
                            width: cell.width || { size: 'auto', type: WidthType.PERCENTAGE },
                            children: cell.children || [
                                new Paragraph({
                                    alignment: cell.alignment || AlignmentType.LEFT,
                                    children: [
                                        new TextRun({
                                            text: cell.text || '',
                                            size: cell.size || 22,
                                            bold: cell.bold || false
                                        })
                                    ]
                                })
                            ]
                        })
                    )
                })
            )
        },

        // Métodos para crear celdas de tabla
        createTableCell(content, options = {}) {
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
                children: [
                    new Paragraph({
                        alignment,
                        children: [
                            new TextRun({
                                text: content || '',
                                size,
                                bold
                            })
                        ]
                    })
                ]
            })
        },

        // Métodos para crear párrafos
        createParagraph(text, options = {}) {
            const {
                alignment = AlignmentType.LEFT,
                size = 24,
                bold = false,
                heading = null
            } = options

            return new Paragraph({
                alignment,
                heading,
                children: [
                    new TextRun({
                        text,
                        size,
                        bold
                    })
                ]
            })
        },

        // Métodos para bordes estándar
        getStandardBorders() {
            return {
                top: { size: 1, color: '000000', style: BorderStyle.SINGLE },
                bottom: { size: 1, color: '000000', style: BorderStyle.SINGLE },
                left: { size: 1, color: '000000', style: BorderStyle.SINGLE },
                right: { size: 1, color: '000000', style: BorderStyle.SINGLE },
                insideHorizontal: { size: 1, color: '000000', style: BorderStyle.SINGLE },
                insideVertical: { style: BorderStyle.NONE }
            }
        },

        getNoBorders() {
            return {
                top: { size: 1, color: '000000', style: BorderStyle.NONE },
                bottom: { size: 1, color: '000000', style: BorderStyle.NONE },
                left: { size: 1, color: '000000', style: BorderStyle.NONE },
                right: { size: 1, color: '000000', style: BorderStyle.NONE },
                insideHorizontal: { size: 1, color: '000000', style: BorderStyle.NONE },
                insideVertical: { style: BorderStyle.NONE }
            }
        },

        // Método para generar y descargar el documento
        async generateAndDownloadDocument(doc, filename) {
            try {
                const blob = await Packer.toBlob(doc)
                saveAs(blob, filename)
                return true
            } catch (error) {
                console.error('Error generating document:', error)
                return false
            }
        },

        // Método para crear sección de licencia
        createLicenseSection(project) {
            if (project.public_type === 'private') {
                return []
            }

            return [
                this.createParagraph('License', { bold: true }),
                this.createParagraph(project.license_type || 'CC-BY-NC-ND'),
                new Paragraph('')
            ]
        },

        // Método para crear sección de referencias
        createReferencesSection(references, listReferences) {
            const allReferences = JSON.parse(JSON.stringify(references))
            const epReferences = allReferences
                .filter(reference => listReferences.includes(reference.id))
                .map(reference => reference.content)

            return epReferences.map(content =>
                new Paragraph({
                    children: [
                        new TextRun({
                            text: content,
                            size: 16
                        })
                    ]
                })
            )
        }
    }
}