import {
  generateAuthorInfo,
  getStandardBorders,
  getNoBorders,
  createParagraph,
  createInfoParagraph,
  createDocumentHeader,
  createProjectInfoSection,
  createTableCell,
  createTableHeader,
  createTableRows,
  createStandardTable,
  createLicenseSection,
  createReferencesSection,
  generateAndDownloadDocument
} from '@/utils/documentHelpers'

export const documentExportMixin = {
  methods: {
    generateAuthorInfo,
    getStandardBorders,
    getNoBorders,
    createParagraph,
    createInfoParagraph,
    createDocumentHeader,
    createProjectInfoSection,
    createTableCell,
    createTableHeader,
    createTableRows,
    createStandardTable,
    createLicenseSection,
    createReferencesSection,
    generateAndDownloadDocument
  }
}
