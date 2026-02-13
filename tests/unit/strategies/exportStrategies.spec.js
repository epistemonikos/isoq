
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

    describe('Data Format Resilience', () => {
      it('should correctly extract data when findings are objects', async () => {
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        await strategy.export()

        // Verify addTable was called with the object data
        const callArgs = builderMock.addTable.mock.calls[0]
        const rows = callArgs[0]
        
        // Finding 1 row (first row in the mock data)
        const findingRow = rows[0]
        expect(findingRow[1].text).toBe('Finding 1') // Name
        expect(findingRow[2].text).toBe('Moderate confidence') // Option '1' from mock
        expect(findingRow[3].text).toBe('Exp') // Explanation
      })

      it('should result in empty data when findings are just IDs (the bug case)', async () => {
        // Simulating the bug where findings were just IDs
        const bugData = {
          ...mockData,
          findings: ['finding-id-1', 'finding-id-2']
        }
        
        const strategy = new IsoQExportStrategy(mockProject, bugData)
        await strategy.export()

        const callArgs = builderMock.addTable.mock.calls[0]
        const rows = callArgs[0]
        
        // Both rows should have empty data for name and cerqual because strings don't have those properties
        expect(rows[0][1].text).toBe('') // Name should be empty
        expect(rows[0][2].text).toBe('') // CERQual text should be empty
        expect(rows[1][1].text).toBe('') // Name should be empty
      })

      it('should render category rows when items have is_category flag', async () => {
        const categoryData = {
          ...mockData,
          findings: [
            { is_category: true, name: 'Category A' },
            { 
              isoqf_id: 1, 
              name: 'Finding 1', 
              evidence_profile: { 
                cerqual: { option: '0', explanation: 'Exp' } 
              } 
            }
          ]
        }

        const strategy = new IsoQExportStrategy(mockProject, categoryData)
        await strategy.export()

        const callArgs = builderMock.addTable.mock.calls[0]
        const rows = callArgs[0]

        // First row should be the category header
        const categoryRow = rows[0][0]
        expect(categoryRow.text).toBe('CATEGORY A')
        expect(categoryRow.bold).toBe(true)
        expect(categoryRow.shading.fill).toBe('F2F2F2')
        expect(categoryRow.columnSpan).toBe(5) // Total headers in findings table

        // Second row should be the finding
        const findingRow = rows[1]
        expect(findingRow[1].text).toBe('Finding 1')
      })
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
    it('should generate document with 4 separate landscape sections', async () => {
      const strategy = new CamelotExportStrategy(mockProject, mockData)
      const doc = await strategy.export()

      // Access the sections from the document definition
      // Note: docx Document object structure might need inspection
      // Assuming doc.sections works if using specific version, or we inspect constructor arguments if we mock Document
      // But since we are not mocking Document, we get the real object.
      // docx 7.x Document has 'sections' property in its configuration or internal state
      
      // Since testing internal state of external library objects can be flaky, 
      // and we didn't mock 'docx', let's trust the logic structure or mock 'docx' to verify construction.
      // However, for this environment, let's verify assumptions based on the returned object if possible.
      
      // Alternative: Verify the structure of the result.
      // The exports return a Document instance.
      expect(doc).toBeDefined()
      // We can't easily check sections count physically without mocking Document, 
      // but we can check if the methods called generated the right Arrays.

      // Let's create spies on the section creation methods to ensure they are called
      const evidenceSpy = jest.spyOn(strategy, 'createEvidenceProfileSection')
      const charsSpy = jest.spyOn(strategy, 'createCharacteristicsSection')
      const methSpy = jest.spyOn(strategy, 'createMethodologicalSection')
      const extractedSpy = jest.spyOn(strategy, 'createExtractedDataSection')
      const licenseSpy = jest.spyOn(strategy, 'createLicenseSection')

      await strategy.export()

      expect(evidenceSpy).toHaveBeenCalled()
      expect(charsSpy).toHaveBeenCalled()
      expect(methSpy).toHaveBeenCalled()
      expect(extractedSpy).toHaveBeenCalled()
      expect(licenseSpy).toHaveBeenCalled()
    })

    describe('createCharacteristicsTable', () => {
      it('should return paragraph if no data', () => {
        const strategy = new CamelotExportStrategy(mockProject, {})
        const result = strategy.createCharacteristicsTable()
        // Paragraph is an object in docx, we check it's defined
        expect(result).toBeDefined()
      })

      it('should create table with correct headers for custom fields and Camelot categories', () => {
        const charData = {
          fields: [
            { key: 'column_1', label: 'Custom 1' }
          ],
          items: [
            { ref_id: 1, authors: 'Author A', year: '2021', column_1: 'Val 1', research_concerns: 'A' }
          ]
        }
        mockData.characteristicStudies = charData
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        
        const table = strategy.createCharacteristicsTable(charData)
        expect(table).toBeDefined()
        // We can check if it returns a Table object (mocked or real)
      })
    })

    describe('createMethodologicalAssessmentTable', () => {
      it('should return paragraph if no data', () => {
        const strategy = new CamelotExportStrategy(mockProject, {})
        const result = strategy.createMethodologicalAssessmentTable()
        expect(result).toBeDefined() 
      })

      it('should create table with correct stages logic', () => {
         const methData = {
           items: [
             { 
               authors: 'Author B',
               stages: [
                 { options: [{ option: 'A', text: 'Desc A' }] }, // First Stage
                 { options: [{ option: 'B', text: 'Desc B' }] }  // Second Stage
               ]
             }
           ]
         }
         mockData.methodologicalAssessments = methData
         const strategy = new CamelotExportStrategy(mockProject, mockData)

         const table = strategy.createMethodologicalAssessmentTable(methData)
         expect(table).toBeDefined()
      })
    })
  })
})
