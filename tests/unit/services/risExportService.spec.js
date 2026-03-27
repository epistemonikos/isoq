import RisExportService from '@/services/risExportService'

describe('RisExportService', () => {
  let service

  beforeEach(() => {
    service = new RisExportService()
  })

  describe('generateFilename', () => {
    it('should generate filename with project name', () => {
      const filename = service.generateFilename('My Research Project')
      expect(filename).toBe('My Research Project - references.ris')
    })

    it('should handle empty project name', () => {
      const filename = service.generateFilename('')
      expect(filename).toBe('references.ris')
    })

    it('should handle null project name', () => {
      const filename = service.generateFilename(null)
      expect(filename).toBe('references.ris')
    })

    it('should handle undefined project name', () => {
      const filename = service.generateFilename(undefined)
      expect(filename).toBe('references.ris')
    })

    it('should sanitize special characters in project name', () => {
      const filename = service.generateFilename('Project/with\\special:chars')
      expect(filename).toBe('Project-with-special-chars - references.ris')
    })

    it('should trim whitespace from project name', () => {
      const filename = service.generateFilename('  Spaced Project  ')
      expect(filename).toBe('Spaced Project - references.ris')
    })
  })

  describe('exportToRIS', () => {
    let mockDownloadFile

    beforeEach(() => {
      // Mock the downloadFile method
      mockDownloadFile = jest.spyOn(service, 'downloadFile').mockImplementation(() => {})
    })

    afterEach(() => {
      mockDownloadFile.mockRestore()
    })

    it('should export single reference', () => {
      const references = [
        {
          type: 'JOUR',
          title: 'Test Article',
          authors: ['Smith, J.']
        }
      ]

      service.exportToRIS(references)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [content, filename] = mockDownloadFile.mock.calls[0]
      
      expect(content).toContain('TY  - JOUR')
      expect(content).toContain('TI  - Test Article')
      expect(content).toContain('A1  - Smith, J.')
      expect(content).toContain('ER  - ')
      expect(filename).toBe('references.ris')
    })

    it('should export multiple references', () => {
      const references = [
        {
          type: 'JOUR',
          title: 'First Article'
        },
        {
          type: 'BOOK',
          title: 'Second Book'
        }
      ]

      service.exportToRIS(references)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [content] = mockDownloadFile.mock.calls[0]
      
      expect(content).toContain('TI  - First Article')
      expect(content).toContain('TI  - Second Book')
      
      // Should have 2 ER markers
      const erCount = (content.match(/ER  - /g) || []).length
      expect(erCount).toBe(2)
    })

    it('should use custom filename when provided', () => {
      const references = [{ type: 'JOUR', title: 'Test' }]
      const options = { filename: 'custom-export.ris' }

      service.exportToRIS(references, options)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [, filename] = mockDownloadFile.mock.calls[0]
      expect(filename).toBe('custom-export.ris')
    })

    it('should use project name in filename when provided', () => {
      const references = [{ type: 'JOUR', title: 'Test' }]
      const options = { projectName: 'My Project' }

      service.exportToRIS(references, options)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [, filename] = mockDownloadFile.mock.calls[0]
      expect(filename).toBe('My Project - references.ris')
    })

    it('should handle empty reference array', () => {
      service.exportToRIS([])

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [content] = mockDownloadFile.mock.calls[0]
      expect(content).toBe('')
    })

    it('should handle null references', () => {
      service.exportToRIS(null)

      expect(mockDownloadFile).toHaveBeenCalledTimes(1)
      const [content] = mockDownloadFile.mock.calls[0]
      expect(content).toBe('')
    })

    it('should preserve reference data integrity', () => {
      const references = [
        {
          type: 'JOUR',
          title: 'Original Title',
          authors: ['Author One', 'Author Two'],
          publication_year: '2024'
        }
      ]

      // Deep clone to ensure original isn't modified
      const originalRefs = JSON.parse(JSON.stringify(references))

      service.exportToRIS(references)

      // Verify original references weren't mutated
      expect(references).toEqual(originalRefs)
    })
  })

  describe('downloadFile', () => {
    let createElementSpy
    let mockElement
    let createObjectURLSpy
    let revokeObjectURLSpy
    let mockBlob

    beforeEach(() => {
      mockElement = {
        setAttribute: jest.fn(),
        click: jest.fn(),
        style: {}
      }
      createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockElement)
      
      // Mock Blob
      global.Blob = jest.fn((content, options) => {
        mockBlob = { content, options, type: 'blob' }
        return mockBlob
      })
      
      // Mock URL methods
      createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
      revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
      
      // Mock document.body methods
      jest.spyOn(document.body, 'appendChild').mockImplementation(() => {})
      jest.spyOn(document.body, 'removeChild').mockImplementation(() => {})
    })

    afterEach(() => {
      createElementSpy.mockRestore()
      createObjectURLSpy.mockRestore()
      revokeObjectURLSpy.mockRestore()
      document.body.appendChild.mockRestore()
      document.body.removeChild.mockRestore()
    })

    it('should create download link with Blob and UTF-8 encoding', () => {
      const content = 'TY  - JOUR\r\nTI  - Test\r\nER  - \r\n'
      const filename = 'test.ris'

      service.downloadFile(content, filename)

      // Verify Blob was created with UTF-8 BOM
      expect(global.Blob).toHaveBeenCalledWith(
        ['\uFEFF' + content],
        { type: 'text/plain;charset=utf-8' }
      )
      
      // Verify URL was created from Blob
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob)
      
      // Verify element setup
      expect(document.createElement).toHaveBeenCalledWith('a')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('download', filename)
      
      // Verify download triggered
      expect(document.body.appendChild).toHaveBeenCalledWith(mockElement)
      expect(mockElement.click).toHaveBeenCalled()
      
      // Verify cleanup
      expect(document.body.removeChild).toHaveBeenCalledWith(mockElement)
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('should handle special characters with UTF-8 BOM', () => {
      const content = 'TI  - Niño with ø and special chars: ñáéíóú\r\n'
      const filename = 'special.ris'

      service.downloadFile(content, filename)

      // Verify BOM is prepended
      const blobContent = global.Blob.mock.calls[0][0]
      expect(blobContent[0]).toBe('\uFEFF' + content)
      
      // Verify UTF-8 encoding
      const blobOptions = global.Blob.mock.calls[0][1]
      expect(blobOptions.type).toBe('text/plain;charset=utf-8')
    })

    it('should handle empty content', () => {
      service.downloadFile('', 'empty.ris')

      expect(mockElement.click).toHaveBeenCalled()
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    it('should handle special characters in filename', () => {
      service.downloadFile('content', 'file with spaces.ris')

      expect(mockElement.setAttribute).toHaveBeenCalledWith(
        'download',
        'file with spaces.ris'
      )
    })
  })
})
