import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import { documentExportMixin } from '@/mixins/documentExportMixin'
import { WordDocumentBuilder } from '@/utils/wordDocumentBuilder'
import { i18n } from '@/plugins/i18n'
import { TEXT_LIMITS } from '@/utils/textSanitizer'
import { displayExplanation } from '@/components/utils/commons'

export class BaseExportStrategy {
    constructor(project, data, locale = 'en') {
        this.project = project
        this.data = data
        this.builder = new WordDocumentBuilder()
        this.i18n = i18n
        this.locale = locale
    }

    t(key) {
        const originalLocale = this.i18n.locale
        this.i18n.locale = this.locale
        const translation = this.i18n.t(key)
        this.i18n.locale = originalLocale
        return translation
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
    constructor(project, data, locale = 'en') {
        super(project, data, locale)
        this.mixin = documentExportMixin
        this.enrichFindings()
    }

    enrichFindings() {
        if (!this.data.findings || !Array.isArray(this.data.findings)) return

        // Create a map of detailed findings for quick lookup
        const findingsMap = new Map()
        
        // Potential sources of detailed finding data
        const sources = [
            this.data.findings, // The main findings array
            this.data.lists,    // Sometimes data is in lists prop
            this.data.originalFindings // Custom source if provided
        ]

        sources.forEach(source => {
            if (Array.isArray(source)) {
                source.forEach(item => {
                    if (item && item.id && item.evidence_profile) {
                        findingsMap.set(item.id, item)
                    } else if (item && item.list_id && item.evidence_profile) {
                        findingsMap.set(item.list_id, item)
                    }
                })
            }
        })

        // Enrich the items in the display list (this.data.findings)
        this.data.findings = this.data.findings.map(item => {
            if (item.is_category) return item

            const detail = findingsMap.get(item.id) || findingsMap.get(item.list_id)
            if (detail) {
                return {
                    ...item,
                    evidence_profile: detail.evidence_profile || item.evidence_profile,
                    name: detail.name || item.name
                }
            }
            return item
        })
    }

    async export() {
        this.builder.addHeader(this.t('actionButtons.word_export.soqf_table_title'), 2, { alignment: AlignmentType.CENTER })
        this.builder.addInfoParagraph(this.t('actionButtons.word_export.review_question'), this.project.review_question)
        this.builder.addSpacing()
        this.builder.addInfoParagraph(this.t('actionButtons.word_export.authors_of_review'), this.project.authors)
        this.builder.addSpacing()
        this.builder.addInfoParagraph(this.t('actionButtons.word_export.corresponding_author'), this.generateAuthorInfo())
        this.builder.addSpacing()
        this.builder.addInfoParagraph(
            this.t('actionButtons.word_export.review_published_question'),
            this.project.published_status ? this.t('actionButtons.word_export.review_published_yes') : this.t('actionButtons.word_export.review_published_no')
        )
        this.builder.addSpacing()
        this.builder.addInfoParagraph(this.t('actionButtons.word_export.additional_information'), this.project.additional_information)
        this.builder.addSpacing()
        
        this.builder.addParagraph(this.getLicenseText(), { size: 20 })
        this.createFindingsTable()
        this.builder.endSection()
        
        this.builder.startSection()
        this.createEvidenceProfileSection()
        
        const doc = this.builder.build()
        
        return doc
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
            return
        }

        const headers = [
            { text: this.t('actionButtons.word_export.table_headers.number'), width: { size: 250, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.summarised_finding'), width: { size: 2000, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.cerqual_assessment'), width: { size: 800, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.cerqual_explanation'), width: { size: 1200, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.references'), width: { size: 750, type: WidthType.PERCENTAGE } }
        ]

        const rows = []
        this.data.findings.forEach((finding, index) => {
            if (finding.is_category) {
                // Add a category header row
                rows.push([
                    {
                        text: (finding.name || '').toUpperCase(),
                        bold: true,
                        shading: { fill: 'F2F2F2' },
                        color: '000000',
                        columnSpan: headers.length,
                        alignment: AlignmentType.CENTER
                    }
                ])
                return
            }

            // Get CERQual data from evidence_profile
            const cerqual = finding.evidence_profile?.cerqual || {}
            const cerqualOption = this.getCerqualConfidenceText(cerqual.option)
            const cerqualExplanation = cerqual.explanation || ''
            
            // Format references
            const refIds = finding.evidence_profile?.references || []
            const refList = this.formatReferenceList(refIds)
            
            rows.push([
                {
                    text: finding.isoqf_id?.toString() || finding.cnt?.toString() || (index + 1).toString(),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: finding.name || '',
                    maxLength: TEXT_LIMITS.findingName
                },
                {
                    text: cerqualOption,
                    alignment: AlignmentType.CENTER
                },
                {
                    text: cerqualExplanation,
                    maxLength: TEXT_LIMITS.findingExplanation
                },
                {
                    text: refList,
                    maxLength: TEXT_LIMITS.references
                }
            ])
        })

        this.builder.addTable(rows, headers)
    }

    formatReferenceList(refIds) {
        if (!refIds || refIds.length === 0) return ''
        
        const refs = refIds.map(id => {
            const ref = this.data.references?.find(r => r.id === id)
            if (!ref) return null
            
            const author = ref.authors?.[0] || 'Unknown'
            const year = ref.publication_year || ''
            return `${author}, ${year}`
        }).filter(Boolean)
        
        return refs.join('; ')
    }

    getConcernLevelText(option) {
        const concernMap = {
            '0': 'No or very minor concerns',
            '1': 'Minor concerns',
            '2': 'Moderate concerns',
            '3': 'Serious concerns'
        }
        return concernMap[option] || ''
    }

    createEvidenceProfileSection() {
        this.builder
            .addHeader(this.t('actionButtons.word_export.evidence_profile_table'), 3)
            .addSpacing()

        if (!this.data.findings || this.data.findings.length === 0) {
            return
        }

        const headers = [
            { text: this.t('actionButtons.word_export.table_headers.number'), width: { size: 250, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.summarised_finding'), width: { size: 1500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.methodological_limitations'), width: { size: 500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.coherence'), width: { size: 500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.adequacy'), width: { size: 500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.relevance'), width: { size: 500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.cerqual_assessment'), width: { size: 500, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.references'), width: { size: 750, type: WidthType.PERCENTAGE } }
        ]

        const rows = []
        this.data.findings.forEach((finding, index) => {
            if (finding.is_category) {
                // Add a category header row
                rows.push([
                    {
                        text: (finding.name || '').toUpperCase(),
                        bold: true,
                        shading: { fill: 'F2F2F2' },
                        color: '000000',
                        columnSpan: headers.length,
                        alignment: AlignmentType.CENTER
                    }
                ])
                return
            }

            const ep = finding.evidence_profile || {}
            const refIds = ep.references || []
            const refList = this.formatReferenceList(refIds)
            
            rows.push([
                {
                    text: finding.isoqf_id?.toString() || finding.cnt?.toString() || (index + 1).toString(),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: finding.name || '',
                    maxLength: TEXT_LIMITS.findingName
                },
                {
                    text: this.getConcernLevelText(ep.methodological_limitations?.option),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: this.getConcernLevelText(ep.coherence?.option),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: this.getConcernLevelText(ep.adequacy?.option),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: this.getConcernLevelText(ep.relevance?.option),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: this.getCerqualConfidenceText(ep.cerqual?.option),
                    alignment: AlignmentType.CENTER
                },
                {
                    text: refList,
                    maxLength: TEXT_LIMITS.references
                }
            ])
        })

        this.builder.addTable(rows, headers, {
            borders: this.builder.getNoBorders()
        })
    }

    getCerqualConfidenceText(option) {
        const confidenceMap = {
            '0': 'High confidence',
            '1': 'Moderate confidence',
            '2': 'Low confidence',
            '3': 'Very low confidence'
        }
        return confidenceMap[option] || ''
    }

    getLicenseText() {
        if (this.project.is_public) {
            return this.project.license_type || ''
        }
        return ''
    }
}

export class CamelotExportStrategy extends BaseExportStrategy {
    constructor(project, data, locale = 'en') {
        super(project, data, locale)
        this.mixin = documentExportMixin
        
        // Destructure data for easier access, matching original component props
        this.evidenceProfile = data.evidenceProfile || []
        this.characteristicStudies = data.characteristicStudies || {}
        this.methodologicalAssessments = data.methodologicalAssessments || {}
        this.extractedData = data.extractedData || {}
        this.selectOptions = data.selectOptions || []
        this.levelConfidence = data.levelConfidence || []
        this.references = data.references || []
        this.list = data.list || { references: [] }
        this.license = data.license || ''
    }

    async export() {
        const landscapePage = {
            orientation: PageOrientation.LANDSCAPE,
            margins: {
                top: 720,
                right: 720,
                bottom: 720,
                left: 720
            }
        }

        const doc = new Document({
            sections: [
                // Section 1: Header + Evidence Profile
                {
                    properties: { page: landscapePage },
                    children: [
                        ...this.createHeader(),
                        ...this.createEvidenceProfileSection()
                    ]
                },
                // Section 2: Characteristics of Studies
                {
                    properties: { page: landscapePage },
                    children: [
                        ...this.createCharacteristicsSection()
                    ]
                },
                // Section 3: Methodological Assessments
                {
                    properties: { page: landscapePage },
                    children: [
                        ...this.createMethodologicalSection()
                    ]
                },
                // Section 4: Extracted Data + License
                {
                    properties: { page: landscapePage },
                    children: [
                        ...this.createExtractedDataSection(),
                        ...this.createLicenseSection()
                    ]
                }
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
            new Paragraph(''),
            new Paragraph({
                alignment: AlignmentType.LEFT,
                heading: HeadingLevel.HEADING_1,
                children: [
                new TextRun({
                    text: this.t('worksheet.evidence_profile'),
                    bold: true,
                    size: 24,
                    color: '000000'
                })
                ]
            }),
            new Paragraph('')
        ]
    }

    createEvidenceProfileSection() {
        if (!this.evidenceProfile || this.evidenceProfile.length === 0) {
            return [new Paragraph('No evidence profile data available.')]
        }

        const table = new Table({
            borders: this.getBorders(),
            width: {
                size: 100,
                type: WidthType.PERCENTAGE
            },
            rows: [
                new TableRow({
                    children: [
                        this.createHeaderCell('#', 2),
                        this.createHeaderCell('Summarized Review Finding', 28),
                        this.createHeaderCell(this.t('worksheet.methodological_limitations'), 12),
                        this.createHeaderCell(this.t('worksheet.coherence'), 12),
                        this.createHeaderCell(this.t('worksheet.adequacy'), 12),
                        this.createHeaderCell(this.t('worksheet.relevance'), 12),
                        this.createHeaderCell('GRADE-CERQual assessment of confidence', 12),
                        this.createHeaderCell('References', 10)
                    ]
                }),
                new TableRow({
                    children: [
                        this.createCell([new TextRun({ text: this.evidenceProfile[0].isoqf_id, size: 22 })]),
                        this.createCell([new TextRun({ text: this.evidenceProfile[0].name, size: 22 })]),
                        this.createExplanationCell('methodological-limitations', this.evidenceProfile[0].methodological_limitations),
                        this.createExplanationCell('coherence', this.evidenceProfile[0].coherence),
                        this.createExplanationCell('adequacy', this.evidenceProfile[0].adequacy),
                        this.createExplanationCell('relevance', this.evidenceProfile[0].relevance),
                        this.createCerqualCell(this.evidenceProfile[0].cerqual),
                        new TableCell({
                            children: this.generateReferences()
                        })
                    ]
                })
            ]
        })

        return [table, new Paragraph('')]
    }

    createCharacteristicsSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: this.t('worksheet.characteristics_of_studies'),
                        size: 24,
                        bold: true
                    })
                ]
            }),
            this.createCharacteristicsTable(JSON.parse(JSON.stringify(this.characteristicStudies))),
            new Paragraph('')
        ]
    }

    createCharacteristicsTable(data) {
        if (!data || !data.items || data.items.length === 0) {
             return new Paragraph('No characteristics data available.')
        }

        const camelotConfig = this.getCamelotConfig()
        const customFields = this.getSortedCustomFields(data.items[0])
        const customFieldLabels = this.getCustomFieldLabels(data.fields)

        // Headers
        // Row 1: Author+Year, Custom Columns, Camelot Categories
        const headerRow1Cells = [
            // Authors, Year (Rowspan 2)
            new TableCell({
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#EEEEEE' },
                children: [new Paragraph({ children: [new TextRun({ text: 'Author(s), Year', bold: true, size: 22 })] })]
            })
        ]

        // Custom Fields (Rowspan 2)
        customFields.forEach(fieldKey => {
            headerRow1Cells.push(new TableCell({
                rowSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#EEEEEE' },
                children: [new Paragraph({ children: [new TextRun({ text: customFieldLabels[fieldKey] || fieldKey, bold: true, size: 22 })] })]
            }))
        })

        // Camelot Categories (Colspan 2)
        camelotConfig.categories.forEach(category => {
            headerRow1Cells.push(new TableCell({
                columnSpan: 2,
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#EEEEEE' },
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: category.label, bold: true, size: 22 })] })]
            }))
        })

        // Row 2: Camelot Options
        const headerRow2Cells = []
        camelotConfig.categories.forEach(category => {
            category.options.forEach(option => {
                headerRow2Cells.push(new TableCell({
                    verticalAlign: VerticalAlign.CENTER,
                    shading: { fill: '#EEEEEE' },
                    children: [new Paragraph({ children: [new TextRun({ text: option.label, bold: true, size: 22 })] })]
                }))
            })
        })

        const rows = [
            new TableRow({ children: headerRow1Cells, tableHeader: true }),
            new TableRow({ children: headerRow2Cells, tableHeader: true })
        ]

        // Body Rows
        data.items.forEach(item => {
            const cells = []
            
            // Authors, Year
            const authors = item.authors || ''
            const year = item.year || ''
            const authorYearText = `${authors} ${year}`.trim()
            
            cells.push(new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: authorYearText, size: 20 })] })]
            }))

            // Custom Fields
            customFields.forEach(fieldKey => {
                cells.push(new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: (item[fieldKey] || '').toString(), size: 20 })] })]
                }))
            })

            // Camelot Options
            camelotConfig.categories.forEach(category => {
                category.options.forEach(option => {
                    cells.push(new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: (item[option.key] || '').toString(), size: 20 })] })]
                    }))
                })
            })

            rows.push(new TableRow({ children: cells }))
        })

        return new Table({
            borders: this.getBorders(),
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows
        })
    }

    getSortedCustomFields(firstItem) {
        if (!firstItem) return []
        const customFields = Object.keys(firstItem).filter(key => key.startsWith('column_'))
        return customFields.sort((a, b) => {
            const numA = parseInt(a.replace('column_', ''))
            const numB = parseInt(b.replace('column_', ''))
            return numA - numB
        })
    }

    getCustomFieldLabels(fields) {
        const labelMap = {}
        if (fields) {
            fields.forEach(field => {
                labelMap[field.key] = field.label
            })
        }
        return labelMap
    }

    getCamelotConfig() {
        return {
            categories: [
                {
                    key: 'research',
                    label: this.t('camelot.step_four.camelot_mixin.meta_domain_1'),
                    options: [
                        { key: 'research_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'research_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'stakeholders',
                    label: this.t('camelot.step_four.camelot_mixin.meta_domain_2'),
                    options: [
                        { key: 'stakeholders_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'stakeholders_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'researchers',
                    label: this.t('camelot.step_four.camelot_mixin.meta_domain_3'),
                    options: [
                        { key: 'researchers_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'researchers_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'context',
                    label: this.t('camelot.step_four.camelot_mixin.meta_domain_4'),
                    options: [
                        { key: 'context_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'context_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'strategy',
                    label: this.t('camelot.step_four.camelot_mixin.research_design_1'),
                    options: [
                        { key: 'strategy_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'strategy_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'theory',
                    label: this.t('camelot.step_four.camelot_mixin.research_design_2'),
                    options: [
                        { key: 'theory_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'theory_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'ethical',
                    label: this.t('camelot.step_four.camelot_mixin.research_design_3'),
                    options: [
                        { key: 'ethical_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'ethical_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'equity',
                    label: this.t('camelot.step_four.camelot_mixin.research_design_4'),
                    options: [
                        { key: 'equity_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'equity_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'participant',
                    label: this.t('camelot.step_four.camelot_mixin.research_conduct_1'),
                    options: [
                        { key: 'participant_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'participant_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'data',
                    label: this.t('camelot.step_four.camelot_mixin.research_conduct_2'),
                    options: [
                        { key: 'data_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'data_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'analysis',
                    label: this.t('camelot.step_four.camelot_mixin.research_conduct_3'),
                    options: [
                        { key: 'analysis_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'analysis_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                },
                {
                    key: 'presentation',
                    label: this.t('camelot.step_four.camelot_mixin.research_conduct_4'),
                    options: [
                        { key: 'presentation_extractedData', label: this.t('camelot.step_four.camelot_mixin.extracted_data') },
                        { key: 'presentation_concerns', label: this.t('camelot.step_four.camelot_mixin.concerns') }
                    ]
                }
            ]
        }
    }

    createMethodologicalSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: this.t('worksheet.methodological_assessments'),
                        size: 24,
                        bold: true
                    })
                ]
            }),
            this.createMethodologicalAssessmentTable(JSON.parse(JSON.stringify(this.methodologicalAssessments))),
            new Paragraph('')
        ]
    }

    createMethodologicalAssessmentTable(data) {
        if (!data || !data.items || data.items.length === 0) {
            return new Paragraph('No methodological assessment data available.')
        }

        // Headers
        // Row 1: Group Headers
        const headerRow1Cells = [
            // Spacer for Authors
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#F8F9FA' },
                children: [new Paragraph('')]
            }),
             // Spacer for Overall Assessment
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#F8F9FA' },
                children: [new Paragraph('')]
            }),
            // Research Design (Colspan 4)
            new TableCell({
                columnSpan: 4,
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#E7F0F7' }, // Light blue tint
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: this.t('camelot.assessment_table.headers.research_design'), bold: true, size: 22 })] })]
            }),
            // Research Conduct (Colspan 4)
            new TableCell({
                columnSpan: 4,
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#F4F9FC' }, // Lighter blue tint
                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: this.t('camelot.assessment_table.headers.research_conduct'), bold: true, size: 22 })] })]
            }),
             // Spacer for Researchers Domain
            new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                shading: { fill: '#F8F9FA' },
                children: [new Paragraph('')]
            })
        ]

        // Row 2: Column Headers
        const columns = [
             { label: this.t('camelot.assessment_table.headers.authors') },
             { label: this.t('camelot.assessment_table.headers.overall_assessment') },
             // Research Design
             { label: this.t('camelot.assessment_table.headers.research') },
             { label: this.t('camelot.assessment_table.headers.stakeholders') },
             { label: this.t('camelot.assessment_table.headers.researchers') },
             { label: this.t('camelot.assessment_table.headers.context') },
             // Research Conduct
             { label: this.t('camelot.assessment_table.headers.research') },
             { label: this.t('camelot.assessment_table.headers.stakeholders') },
             { label: this.t('camelot.assessment_table.headers.researchers') },
             { label: this.t('camelot.assessment_table.headers.context') },
             // Researchers Domain
             { label: this.t('camelot.assessment_table.headers.researchers_domain') }
        ]

        const headerRow2Cells = columns.map(col => new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: '#F8F9FA' },
            children: [new Paragraph({ children: [new TextRun({ text: col.label, bold: true, size: 22 })] })]
        }))

        const rows = [
            new TableRow({ children: headerRow1Cells, tableHeader: true }),
            new TableRow({ children: headerRow2Cells, tableHeader: true })
        ]

        // Body Rows
        data.items.forEach(item => {
            const cells = []
            
            // Authors
            cells.push(new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: item.authors || '', size: 20 })] })]
            }))

            const stages = item.stages || []
            const lastStage = stages.length > 0 ? stages[stages.length - 1] : null
            const firstStage = stages.length > 0 ? stages[0] : null
            const secondStage = stages.length > 1 ? stages[1] : null
            const thirdStage = stages.length > 2 ? stages[2] : null

            // Overall Assessment (lastStage)
            cells.push(this.createStageOptionCell(lastStage ? lastStage.options : [], true))

            // Research Design (firstStage) - 4 columns
            if (firstStage && firstStage.options) {
                for (let i = 0; i < 4; i++) {
                    cells.push(this.createSingleOptionCell(firstStage.options[i]))
                }
            } else {
                 for (let i = 0; i < 4; i++) cells.push(new TableCell({ children: [] }))
            }

            // Research Conduct (secondStage) - 4 columns
            if (secondStage && secondStage.options) {
                for (let i = 0; i < 4; i++) {
                    cells.push(this.createSingleOptionCell(secondStage.options[i]))
                }
            } else {
                 for (let i = 0; i < 4; i++) cells.push(new TableCell({ children: [] }))
            }

            // Researchers Domain (thirdStage)
             cells.push(this.createStageOptionCell(thirdStage ? thirdStage.options : [], true))

            rows.push(new TableRow({ children: cells }))
        })

        return new Table({
             borders: this.getBorders(),
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: rows
        })
    }

    createSingleOptionCell(optionData) {
        if (!optionData || !optionData.option) {
            return new TableCell({ children: [] })
        }

        const optionText = this.getOptionText(optionData.option)
        
        return new TableCell({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: optionText, bold: true, size: 20 })
                    ]
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: optionData.text || '', size: 20 })
                    ]
                })
            ]
        })
    }

    createStageOptionCell(options, isMultiple = false) {
        if (!options || options.length === 0) {
             return new TableCell({ children: [] })
        }

        const children = []
        options.forEach(opt => {
             if (opt.option) {
                const optionText = this.getOptionText(opt.option)
                children.push(new Paragraph({
                    children: [new TextRun({ text: optionText, bold: true, size: 20 })]
                }))
                children.push(new Paragraph({
                    children: [new TextRun({ text: opt.text || '', size: 20 })]
                }))
                children.push(new Paragraph('')) // Spacer
             }
        })

        return new TableCell({ children: children })
    }

    getOptionText(option) {
        const optionsMap = {
            'A': this.t('camelot.assessment_table.options.no_minimal'),
            'B': this.t('camelot.assessment_table.options.minor'),
            'C': this.t('camelot.assessment_table.options.moderate'),
            'D': this.t('camelot.assessment_table.options.serious'),
            'E': this.t('camelot.assessment_table.options.unclear')
        }
        return optionsMap[option] || option
    }

    createExtractedDataSection() {
        return [
            new Paragraph({
                children: [
                    new TextRun({
                        text: this.t('worksheet.extracted_data'),
                        size: 24,
                        bold: true
                    })
                ]
            }),
            this.generateTable(JSON.parse(JSON.stringify(this.extractedData)))
        ]
    }

    createLicenseSection() {
        return [
            new Paragraph({
                heading: HeadingLevel.HEADING_2,
                children: [
                    new TextRun({
                        text: Object.prototype.hasOwnProperty.call(this.project, 'license_type') ? this.license : '',
                        size: 20,
                        font: { name: 'Times New Roman' },
                        color: '000000'
                    })
                ]
            })
        ]
    }

    // Helpers
    getBorders() {
        return {
            top: { size: 1, color: '000000', style: BorderStyle.SINGLE },
            bottom: { size: 1, color: '000000', style: BorderStyle.SINGLE },
            left: { size: 1, color: '000000', style: BorderStyle.SINGLE },
            right: { size: 1, color: '000000', style: BorderStyle.SINGLE },
            insideHorizontal: { size: 1, color: '000000', style: BorderStyle.SINGLE },
            insideVertical: { style: BorderStyle.NONE }
        }
    }

    createHeaderCell(text, widthPercent) {
        return new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            shading: { fill: '#EEEEEE' },
            width: { size: widthPercent, type: WidthType.PERCENTAGE },
            children: [
                new Paragraph({
                    children: [
                        new TextRun({ text: text, bold: true, size: 22 })
                    ]
                })
            ]
        })
    }

    createCell(children) {
        return new TableCell({
            children: [
                new Paragraph({ children: children })
            ]
        })
    }

    createExplanationCell(type, data) {
        return new TableCell({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: this.displaySelectedOption(data.option),
                            bold: true,
                            size: 22
                        })
                    ]
                }),
                new Paragraph(''),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: displayExplanation(type, data.option, data.explanation),
                            size: 22
                        })
                    ]
                })
            ]
        })
    }

    createCerqualCell(data) {
        return new TableCell({
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: this.displayLevelConfidence(data.option),
                            bold: true,
                            size: 22
                        })
                    ]
                }),
                new Paragraph(''),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: (data.explanation.length) ? data.explanation : '',
                            size: 22
                        })
                    ]
                })
            ]
        })
    }

    generateTable(data) {
        if (!data || !data.fields || !data.items) return new Paragraph('')
        
        return new Table({
            borders: this.getBorders(),
            width: {
                size: 100,
                type: WidthType.PERCENTAGE
            },
            rows: [
                this.generateHeaderRow(JSON.parse(JSON.stringify(data.fields))),
                ...this.generateBodyRow(JSON.parse(JSON.stringify(data.items)))
            ]
        })
    }

    generateHeaderRow(data) {
        return new TableRow({
            tableHeader: true,
            children: [
                ...this.generateGenericCell(data)
            ]
        })
    }

    generateBodyRow(data) {
        return data.map((item) => {
            return new TableRow({
                children: [
                    ...this.prepareBodyCell(item)
                ]
            })
        })
    }

    generateGenericCell(data) {
        let headers = []
        for (let d of data) {
            if (d.key !== 'ref_id' && d.key !== 'actions') {
                headers.push(d)
            }
        }
        const length = headers.length
        const size = length > 0 ? 100 / length : 100
        return headers.map((content) => {
            return new TableCell({
                verticalAlign: VerticalAlign.CENTER,
                width: {
                    size: size.toString() + '%',
                    type: WidthType.PERCENTAGE
                },
                children: [
                    this.generateParagraph(content, true)
                ]
            })
        })
    }

    prepareBodyCell(data) {
        if (Object.prototype.hasOwnProperty.call(data, 'index')) {
            delete data.index
        }
        let arr = []
        const keys = Object.keys(data)
        let numbers = []
        for (let key of keys) {
            if (key !== 'ref_id' && key !== 'authors') {
                const newKey = parseInt(key.split('_')[1])
                numbers.push(newKey)
            }
        }
        const len = numbers.sort((a, b) => { return a - b }).slice(-1)[0]
        if (len !== undefined) {
            if (len) {
                arr.push(this.generateBodyCell(data.authors, true, 20))
                for (var cnt = 0; cnt <= len; cnt++) {
                    if (Object.prototype.hasOwnProperty.call(data, 'column_' + cnt.toString())) {
                        arr.push(this.generateBodyCell(data['column_' + cnt.toString()], false, 20))
                    }
                }
            } else {
                arr.push(this.generateBodyCell(data.authors, true, 20))
                arr.push(this.generateBodyCell(data['column_0'], false, 20))
            }
        } else {
            arr.push(this.generateBodyCell(data.authors, true, 20))
            arr.push(this.generateBodyCell(' ', false, 20))
        }
        return arr
    }

    generateBodyCell(data, isBold, size) {
        return new TableCell({
            children: [
                this.generateParagraph(data, isBold, size)
            ]
        })
    }

    generateParagraph(data, isBold, size) {
        return new Paragraph({
            children: [
                this.generateText(data, isBold, size)
            ]
        })
    }

    generateText(data, isBold = false, size = 20) {
        if (data && Object.prototype.hasOwnProperty.call(data, 'label')) {
            return new TextRun({
                text: data.label,
                bold: isBold,
                size: size
            })
        } else {
            return new TextRun({
                text: typeof data === 'string' ? data : (data || '').toString(),
                bold: isBold,
                size: size
            })
        }
    }

    generateReferences() {
        const allReferences = JSON.parse(JSON.stringify(this.references))
        const listReferences = JSON.parse(JSON.stringify(this.list.references))
        let epReferences = []
        for (let reference of allReferences) {
            if (listReferences.indexOf(reference.id) !== -1) {
                epReferences.push(reference.content)
            }
        }
        let arr = []
        for (let epr of epReferences) {
            arr.push(new Paragraph({
                children: [
                    new TextRun({
                        text: epr,
                        size: 16
                    })
                ]
            })
            )
        }
        return arr
    }

    displaySelectedOption(option) {
        if (option === null) {
            return ''
        } else if (option >= 0) {
            return this.selectOptions[option] ? this.selectOptions[option].text : ''
        } else {
            return ''
        }
    }

    displayLevelConfidence(option) {
        if (option !== null) {
            return this.levelConfidence[option] ? this.levelConfidence[option].text : ''
        }
        return ''
    }
}

export class ExportStrategyFactory {
    static createStrategy(type, project, data, locale = 'en') {
        switch (type) {
            case 'isoq':
                return new IsoQExportStrategy(project, data, locale)
            case 'camelot':
                return new CamelotExportStrategy(project, data, locale)
            default:
                throw new Error(`Unknown export type: ${type}`)
        }
    }
}