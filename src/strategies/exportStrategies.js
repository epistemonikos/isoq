import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, VerticalAlign, BorderStyle, PageOrientation, HeightRule } from 'docx'
import { documentExportMixin } from '@/mixins/documentExportMixin'
import { WordDocumentBuilder } from '@/utils/wordDocumentBuilder'
import { i18n } from '@/plugins/i18n'
import { TEXT_LIMITS } from '@/utils/textSanitizer'

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
        
        console.log(`🌍 Translation [${this.locale}]: ${key} = ${translation}`)
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
    }

    async export() {
        console.log('📝 IsoQExportStrategy.export() - Starting export')
        console.log('📝 Project:', this.project.name)
        console.log('📝 Findings count:', this.data.findings?.length || 0)
        console.log('📝 References count:', this.data.references?.length || 0)
        
        console.log('📝 Creating header...')
        this.builder.addHeader(this.t('actionButtons.word_export.soqf_table_title'), 2, { alignment: AlignmentType.CENTER })
        console.log('📝 Creating project info...')
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
        
        console.log('📝 Creating license section...')
        this.builder.addParagraph(this.getLicenseText(), { size: 20 })
        console.log('📝 Creating findings table...')
        this.createFindingsTable()
        this.builder.endSection()
        
        console.log('📝 Creating evidence profile section...')
        this.builder.startSection()
        this.createEvidenceProfileSection()
        
        console.log('📝 Building document...')
        const doc = this.builder.build()
        console.log('📝 Document built successfully')
        
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

        console.log('📊 createFindingsTable - findings:', this.data.findings)

        const headers = [
            { text: this.t('actionButtons.word_export.table_headers.number'), width: { size: 250, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.summarised_finding'), width: { size: 2000, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.cerqual_assessment'), width: { size: 800, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.cerqual_explanation'), width: { size: 1200, type: WidthType.PERCENTAGE } },
            { text: this.t('actionButtons.word_export.table_headers.references'), width: { size: 750, type: WidthType.PERCENTAGE } }
        ]

        const rows = this.data.findings.map((finding, index) => {
            // Get CERQual data from evidence_profile
            const cerqual = finding.evidence_profile?.cerqual || {}
            const cerqualOption = this.getCerqualConfidenceText(cerqual.option)
            const cerqualExplanation = cerqual.explanation || ''
            
            // Format references
            const refIds = finding.evidence_profile?.references || []
            const refList = this.formatReferenceList(refIds)
            
            return [
                {
                    text: finding.isoqf_id?.toString() || (index + 1).toString(),
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
            ]
        })

        console.log('📊 Table rows created:', rows.length)
        
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

        const rows = this.data.findings.map((finding, index) => {
            const ep = finding.evidence_profile || {}
            const refIds = ep.references || []
            const refList = this.formatReferenceList(refIds)
            
            return [
                {
                    text: finding.isoqf_id?.toString() || (index + 1).toString(),
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
            ]
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
    }

    async export() {
        // Start landscape section for Camelot
        this.builder.startSection({
            orientation: 'landscape'
        })
        
        // Add all content using the old methods that return arrays
        const headerContent = this.createHeader()
        const evidenceProfile = this.createEvidenceProfileSection()
        const characteristics = this.createCharacteristicsSection()
        const methodological = this.createMethodologicalSection()
        const extractedData = this.createExtractedDataSection()
        const license = this.createLicenseSection()
        
        // Add all content to the section
        ;[...headerContent, ...evidenceProfile, ...characteristics, ...methodological, ...extractedData, license].forEach(item => {
            this.builder.addToCurrentSection(item)
        })
        
        this.builder.endSection()
        
        return this.builder.build()
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