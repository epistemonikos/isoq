
import { WordDocumentBuilder } from '@/utils/wordDocumentBuilder'
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
  HeadingLevel,
  AlignmentType
} from 'docx'

// Mock docx classes
jest.mock('docx', () => ({
  Document: jest.fn(),
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  Table: jest.fn(),
  TableCell: jest.fn(),
  TableRow: jest.fn(),
  HeadingLevel: {
    HEADING_1: 'heading1',
    HEADING_2: 'heading2',
    HEADING_3: 'heading3'
  },
  AlignmentType: {
    LEFT: 'left',
    CENTER: 'center'
  },
  WidthType: {
    PERCENTAGE: 'pct'
  },
  VerticalAlign: {
    CENTER: 'center'
  },
  BorderStyle: {
    SINGLE: 'single',
    NONE: 'none'
  },
  PageOrientation: {
    LANDSCAPE: 'landscape'
  },
  HeightRule: {
    EXACT: 'exact'
  },
  TableLayoutType: {
    FIXED: 'fixed'
  }
}))

describe('WordDocumentBuilder', () => {
  let builder

  beforeEach(() => {
    jest.clearAllMocks()
    builder = new WordDocumentBuilder()
  })

  describe('Section Management', () => {
    it('should start a new section with default properties', () => {
      builder.startSection()
      expect(builder.currentSection).toBeDefined()
      expect(builder.currentSection.children).toEqual([])
    })

    it('should end current section and add to sections list', () => {
      builder.startSection()
      builder.endSection()
      expect(builder.sections.length).toBe(1)
      expect(builder.currentSection).toBeNull()
    })

    it('should handle landscape orientation', () => {
      builder.startSection({ orientation: 'landscape' })
      expect(builder.currentSection.properties.page.orientation).toBe('landscape')
    })
  })

  describe('Content Addition', () => {
    it('should add a header', () => {
      builder.addHeader('Test Header', 1)
      
      expect(Paragraph).toHaveBeenCalledWith(expect.objectContaining({
        heading: 'heading1',
        children: expect.any(Array)
      }))
      
      expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Test Header',
        size: 36
      }))
    })

    it('should add a paragraph', () => {
      builder.addParagraph('Test Content')
      
      expect(Paragraph).toHaveBeenCalledWith(expect.objectContaining({
        children: expect.any(Array)
      }))
      
      expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Test Content'
      }))
    })

    it('should sanitize content in paragraphs', () => {
      const unsafeText = 'Test <script>'
      builder.addParagraph(unsafeText)
      
      // The builder uses textSanitizer which strips HTML/scripts
      // We expect the text to be cleaned
      expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({
        text: expect.not.stringContaining('<script>')
      }))
    })
  })

  describe('Table Generation', () => {
    it('should add a table with headers and rows', () => {
      const headers = [{ text: 'Col 1', width: { size: 50, type: 'pct' } }]
      const rows = [[{ text: 'Data 1' }]]
      
      builder.addTable(rows, headers)
      
      expect(Table).toHaveBeenCalled()
      expect(TableRow).toHaveBeenCalledTimes(2) // Header + 1 Data row
      expect(TableCell).toHaveBeenCalled()
    })

    it('should handle simple string data in rows', () => {
      const headers = [{ text: 'Col 1' }]
      const rows = [['Simple Data']]
      
      builder.addTable(rows, headers)
      
      expect(TextRun).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Simple Data'
      }))
    })
  })

  describe('Build', () => {
    it('should build the document', () => {
      builder.startSection()
      builder.addParagraph('Test')
      
      builder.build()
      
      expect(Document).toHaveBeenCalled()
    })

    it('should verify document structure', () => {
      builder.startSection()
          .addParagraph('P1')
          .endSection()
          .startSection()
          .addParagraph('P2')
      
      builder.build()
      
      // Should have closed the second section automatically and passed 2 sections to Document
      expect(builder.sections.length).toBe(2)
    })
  })
})
