
import { WordExportService, getWordExportService } from '@/services/wordExportService'
import { ExportStrategyFactory } from '@/strategies/exportStrategies'

// Mock dependencies
jest.mock('@/strategies/exportStrategies', () => ({
  ExportStrategyFactory: {
    createStrategy: jest.fn()
  }
}))

jest.mock('@/utils/documentGenerator', () => ({
  DocumentGenerator: jest.fn().mockImplementation(() => ({
    setProgressCallback: jest.fn(),
    cancelGeneration: jest.fn()
  }))
}))

jest.mock('@/plugins/i18n', () => ({
  i18n: {
    locale: 'en',
    t: jest.fn(key => key)
  }
}))

describe('WordExportService', () => {
  let service
  let mockProject
  let mockData
  let mockStrategy

  beforeEach(() => {
    jest.clearAllMocks()
    
    service = new WordExportService()
    
    mockProject = {
      name: 'Test Project',
      use_camelot: false
    }
    
    mockData = {
      findings: [{ id: 1 }],
      references: [{ id: 1 }]
    }
    
    mockStrategy = {
      generateAndDownload: jest.fn().mockResolvedValue(true)
    }
    
    ExportStrategyFactory.createStrategy.mockReturnValue(mockStrategy)
  })

  describe('Validation', () => {
    it('should validate valid data', () => {
      const errors = service.validateExportData(mockProject, mockData)
      expect(errors).toHaveLength(0)
    })

    it('should detect missing project name', () => {
      mockProject.name = ''
      const errors = service.validateExportData(mockProject, mockData)
      expect(errors).toContain('Project name is required')
    })

    it('should require findings for iSoQ projects', () => {
      mockProject.use_camelot = false
      mockData.findings = []
      const errors = service.validateExportData(mockProject, mockData)
      expect(errors).toContain('At least one finding is required')
    })

    it('should not require findings for Camelot projects', () => {
      mockProject.use_camelot = true
      mockData.findings = []
      const errors = service.validateExportData(mockProject, mockData)
      expect(errors).toHaveLength(0)
    })
  })

  describe('Export Process', () => {
    it('should execute full export flow successfully', async () => {
      const result = await service.exportToWord(mockProject, mockData)
      
      expect(result).toBe(true)
      expect(ExportStrategyFactory.createStrategy).toHaveBeenCalledWith(
        'isoq',
        mockProject,
        mockData,
        'en'
      )
      expect(mockStrategy.generateAndDownload).toHaveBeenCalled()
    })

    it('should use provided locale', async () => {
      await service.exportToWord(mockProject, mockData, { locale: 'es' })
      
      expect(ExportStrategyFactory.createStrategy).toHaveBeenCalledWith(
        'isoq',
        mockProject,
        mockData,
        'es'
      )
    })

    it('should use Camelot strategy when configured', async () => {
      mockProject.use_camelot = true
      await service.exportToWord(mockProject, mockData)
      
      expect(ExportStrategyFactory.createStrategy).toHaveBeenCalledWith(
        'camelot',
        mockProject,
        mockData,
        'en'
      )
    })

    it('should use custom filename if provided', async () => {
      await service.exportToWord(mockProject, mockData, { filename: 'custom.docx' })
      
      expect(mockStrategy.generateAndDownload).toHaveBeenCalledWith('custom.docx')
    })
  })

  describe('Filename Generation', () => {
    it('should generate default filename with suffix', () => {
      const filename = service.generateFilename(mockProject, null, 'en')
      expect(filename).toContain('Test Project')
      // Suffix comes from mocked i18n
      expect(filename).toContain('actionButtons.word_export.filename_suffix')
    })

    it('should sanitize illegal characters in project name', () => {
      mockProject.name = 'Test/Project:With|Chars'
      const filename = service.generateFilename(mockProject, null, 'en')
      expect(filename).toBe('TestProjectWithChars - actionButtons.word_export.filename_suffix.docx')
    })
  })

  describe('Singleton Access', () => {
    it('should return the same instance', () => {
      const instance1 = getWordExportService()
      const instance2 = getWordExportService()
      expect(instance1).toBe(instance2)
    })
  })
})
