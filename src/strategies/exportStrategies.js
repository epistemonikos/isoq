import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import { documentExportMixin } from '@/mixins/documentExportMixin'

export class BaseExportStrategy {
    constructor(project, data) {
        this.project = project
        this.data = data
    }

    async export() {
        throw new Error('Method export() must be implemented')
    }

    async generateAndDownload(filename) {
        const doc = await this.export()
        return this.downloadDocument(doc, filename)
    }

    async downloadDocument(doc, filename) {
        try {
            const blob = await Packer.toBlob(doc)
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = filename
            link.click()
            URL.revokeObjectURL(link.href)
            return true
        } catch (error) {
            console.error('Error downloading document:', error)
            return false
        }
    }
}

export class IsoQExportStrategy extends BaseExportStrategy {
    constructor(project, data) {
        super(project, data)
        this.mixin = documentExportMixin
    }

    async export() {
        const doc = new Document()

        doc.addSection({
            margins: { top: 720, right: 720, bottom: 720, left: 720 },
            children: [
                ...this.createHeader(),
                ...this.createProjectInfo(),
                ...this.createFindingsTable()
            ]
        })

        return doc
    }

    createHeader() {
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                    new TextRun({
                        text: this.project.name,
                        bold: true,
                        size: 36,
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
                        text: 'Summary of Qualitative Findings Table',
                        bold: true,
                        size: 36,
                        font: { name: 'Times New Roman' },
                        color: '000000'
                    })
                ]
            }),
            new Paragraph('')
        ]
    }

    createProjectInfo() {
        return [
            this.createInfoParagraph('Review question', this.project.review_question),
            new Paragraph(''),
            this.createInfoParagraph('Authors of the review', this.project.authors),
            new Paragraph(''),
            this.createInfoParagraph('Corresponding author', this.generateAuthorInfo()),
            new Paragraph(''),
            this.createInfoParagraph('Has the review been published?',
                (this.project.published_status) ?
                    ('Yes' + (this.project.url_doi && this.project.url_doi.length) ? ' | DOI: ' + this.project.url_doi : '') :
                    'No'
            ),
            new Paragraph(''),
            this.createInfoParagraph('Additional Information', this.project.description),
            new Paragraph('')
        ]
    }

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
    }

    generateAuthorInfo() {
        let data = ''
        if (this.project.author && this.project.author.length) {
            data = this.project.author.toString()
            if (this.project.author_email && this.project.author_email.length) {
                const email = this.project.author_email.toString()
                data = data.concat(' - ' + email)
            }
        }
        return data
    }

    createFindingsTable() {
        if (!this.data.findings || this.data.findings.length === 0) {
            return []
        }

        const headers = [
            { text: '#', width: { size: '5%', type: WidthType.PERCENTAGE } },
            { text: 'Summarised review finding', width: { size: '40%', type: WidthType.PERCENTAGE } },
            { text: 'GRADE-CERQual Assessment of confidence', width: { size: '20%', type: WidthType.PERCENTAGE } },
            { text: 'Explanation of GRADE-CERQual Assessment', width: { size: '20%', type: WidthType.PERCENTAGE } },
            { text: 'References', width: { size: '15%', type: WidthType.PERCENTAGE } }
        ]

        const rows = this.data.findings.map((finding, index) => [
            { text: finding.cnt || (index + 1).toString(), alignment: AlignmentType.CENTER },
            { text: finding.name },
            { text: finding.cerqual_option, alignment: AlignmentType.CENTER },
            { text: finding.cerqual_explanation },
            { text: finding.ref_list, size: 16 }
        ])

        return [this.mixin.methods.createStandardTable(rows, headers)]
    }
}

export class CamelotExportStrategy extends BaseExportStrategy {
    constructor(project, data) {
        super(project, data)
        this.mixin = documentExportMixin
    }

    async export() {
        const doc = new Document()

        doc.addSection({
            size: { orientation: PageOrientation.LANDSCAPE },
            margins: { top: 720, right: 720, bottom: 720, left: 720 },
            children: [
                ...this.createHeader(),
                ...this.createEvidenceProfileSection(),
                ...this.createCharacteristicsSection(),
                ...this.createMethodologicalSection(),
                ...this.createExtractedDataSection(),
                this.createLicenseSection()
            ]
        })

        return doc
    }

    createHeader() {
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                    new TextRun({
                        text: this.project.name,
                        size: 24,
                        font: { name: 'Times New Roman' },
                        color: '000000'
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                heading: HeadingLevel.HEADING_1,
                children: [
                    new TextRun({
                        text: 'GRADE-CERQual Assessment Worksheet',
                        bold: true,
                        size: 28,
                        color: '000000'
                    })
                ]
            }),
            new Paragraph('')
        ]
    }

    createEvidenceProfileSection() {
        return [
            new Paragraph({
                alignment: AlignmentType.LEFT,
                heading: HeadingLevel.HEADING_1,
                children: [
                    new TextRun({
                        text: 'Evidence Profile',
                        bold: true,
                        size: 24,
                        color: '000000'
                    })
                ]
            }),
            new Paragraph('')
        ]
    }

    createCharacteristicsSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Characteristics of Studies',
                        size: 24,
                        bold: true
                    })
                ]
            })
        ]
    }

    createMethodologicalSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Methodological Assessments',
                        size: 24,
                        bold: true
                    })
                ]
            })
        ]
    }

    createExtractedDataSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Extracted Data',
                        size: 24,
                        bold: true
                    })
                ]
            })
        ]
    }

    createLicenseSection() {
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                    new TextRun({
                        text: this.project.license_type || '',
                        size: 20,
                        font: { name: 'Times New Roman' },
                        color: '000000'
                    })
                ]
            })
        ]
    }
}

export class ExportStrategyFactory {
    static createStrategy(type, project, data) {
        switch (type) {
            case 'isoq':
                return new IsoQExportStrategy(project, data)
            case 'camelot':
                return new CamelotExportStrategy(project, data)
            default:
                throw new Error(`Unknown export type: ${type}`)
        }
    }
}