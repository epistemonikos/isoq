
import { 
  ExportStrategyFactory, 
  IsoQExportStrategy, 
  CamelotExportStrategy 
} from '@/strategies/exportStrategies'
import { WordDocumentBuilder } from '@/utils/wordDocumentBuilder'

// Mock dependencies
jest.mock('@/utils/wordDocumentBuilder', () => ({
  WordDocumentBuilder: jest.fn().mockImplementation(() => ({
    startSection: jest.fn().mockReturnThis(),
    endSection: jest.fn().mockReturnThis(),
    addHeader: jest.fn().mockReturnThis(),
    addParagraph: jest.fn().mockReturnThis(),
    addSpacing: jest.fn().mockReturnThis(),
    addInfoParagraph: jest.fn().mockReturnThis(),
    addTable: jest.fn().mockReturnThis(),
    addToCurrentSection: jest.fn().mockReturnThis(),
    getNoBorders: jest.fn(),
    build: jest.fn()
  }))
}))

// Mock i18n
jest.mock('@/plugins/i18n', () => ({
  i18n: {
    locale: 'en',
    t: jest.fn(key => key)
  }
}))

describe('ExportStrategies', () => {
  let mockProject
  let mockData
  let builderMock

  beforeEach(() => {
    jest.clearAllMocks()
    
    mockProject = {
      name: 'Test Project',
      review_question: 'Question?',
      authors: 'Authors',
      published_status: true,
      additional_information: 'Info'
    }
    
    mockData = {
      findings: [
        {
          isoqf_id: 1,
          name: 'Finding 1',
          evidence_profile: {
            cerqual: { option: '1', explanation: 'Exp' },
            references: [1, 2]
          }
        }
      ],
      references: [
        { id: 1, authors: ['A1'], publication_year: '2020' }
      ]
    }

    // Get the mock instance
    builderMock = new WordDocumentBuilder()
    WordDocumentBuilder.mockClear()
    WordDocumentBuilder.mockImplementation(() => builderMock)
  })

  describe('Factory', () => {
    it('should create IsoQ strategy', () => {
      const strategy = ExportStrategyFactory.createStrategy('isoq', mockProject, mockData)
      expect(strategy).toBeInstanceOf(IsoQExportStrategy)
    })

    it('should create Camelot strategy', () => {
      const strategy = ExportStrategyFactory.createStrategy('camelot', mockProject, mockData)
      expect(strategy).toBeInstanceOf(CamelotExportStrategy)
    })

    it('should throw error for unknown strategy', () => {
      expect(() => {
        ExportStrategyFactory.createStrategy('unknown', mockProject, mockData)
      }).toThrow('Unknown export type')
    })
  })

  describe('IsoQExportStrategy', () => {
    it('should generate export content correctly', async () => {
      const strategy = new IsoQExportStrategy(mockProject, mockData)
      await strategy.export()

      // Check Header
      expect(builderMock.addHeader).toHaveBeenCalledWith(
        'actionButtons.word_export.soqf_table_title', 
        2, 
        expect.any(Object)
      )

      // Check Project Info
      expect(builderMock.addInfoParagraph).toHaveBeenCalledWith(
        'actionButtons.word_export.review_question', 
        'Question?'
      )

      // Verify Table Creation
      // The strategy calls createFindingsTable which calls addTable
      expect(builderMock.addTable).toHaveBeenCalled()
      
      // Verify Evidence Profile Section
      expect(builderMock.startSection).toHaveBeenCalled()
    })

    describe('License Logic', () => {
      it('should return empty string for private projects', () => {
        mockProject.is_public = false
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        expect(strategy.getLicenseText()).toBe('')
      })

      it('should return license type for public projects', () => {
        mockProject.is_public = true
        mockProject.license_type = 'CC-BY-NC 4.0'
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        expect(strategy.getLicenseText()).toBe('CC-BY-NC 4.0')
      })

      it('should return empty string if public but no license type', () => {
        mockProject.is_public = true
        mockProject.license_type = null
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        expect(strategy.getLicenseText()).toBe('')
      })
    })
  })

  describe('CamelotExportStrategy', () => {
    it('should generate landscape content', async () => {
      const strategy = new CamelotExportStrategy(mockProject, mockData)
      await strategy.export()

      // Verify landscape orientation
      expect(builderMock.startSection).toHaveBeenCalledWith({
        orientation: 'landscape'
      })

      // Verify content additions
      expect(builderMock.addToCurrentSection).toHaveBeenCalled()
      expect(builderMock.build).toHaveBeenCalled()
    })
  })
})
