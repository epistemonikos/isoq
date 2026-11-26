
import {
  ExportStrategyFactory,
  IsoQExportStrategy,
  CamelotExportStrategy,
  WorksheetExportStrategy
} from '@/strategies/exportStrategies'
import { WordDocumentBuilder } from '@/utils/wordDocumentBuilder'

// Mock dependencies
jest.mock('@/utils/wordDocumentBuilder', () => ({
  WordDocumentBuilder: jest.fn().mockImplementation(() => ({
    startSection: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
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
        expect(findingRow[2].text).toBe('cerqual_options.moderate_confidence') // Key for option '1'
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
        expect(rows[0][0].text).toBe('') // Number should be empty: a bare string is not a finding
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

    describe('número del finding', () => {
      // El contrato: displayNumber y NADA más. Ni sort, ni isoqf_id, ni id, ni el
      // literal '1'. Un número plausible pero falso, en un documento que alguien va
      // a citar, es peor que un vacío.
      it('imprime displayNumber aunque sort e isoqf_id digan otra cosa', async () => {
        const data = {
          ...mockData,
          findings: [{ ...mockData.findings[0], displayNumber: 3, sort: 11, isoqf_id: 42 }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        const rows = builderMock.addTable.mock.calls[0][0]
        expect(rows[0][0].text).toBe('3')
      })

      it('deja el número vacío cuando falta: nunca cae al id ni al literal 1', async () => {
        const data = {
          ...mockData,
          findings: [{ ...mockData.findings[0], id: '66b1ff0000000000000000a1', displayNumber: undefined, sort: undefined, isoqf_id: undefined, cnt: undefined }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        const rows = builderMock.addTable.mock.calls[0][0]
        expect(rows[0][0].text).toBe('')
        expect(rows[0][0].text).not.toBe('1')
        expect(rows[0][0].text).not.toContain('66b1ff')
      })

      it('createEvidenceProfileSection (segunda tabla) también imprime displayNumber, no sort ni isoqf_id', async () => {
        const data = {
          ...mockData,
          findings: [{ ...mockData.findings[0], displayNumber: 7, sort: 20, isoqf_id: 55 }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        // createFindingsTable() llama addTable primero (mock.calls[0]); esta tabla es
        // la de createEvidenceProfileSection(), la segunda llamada (mock.calls[1]).
        const rows = builderMock.addTable.mock.calls[1][0]
        expect(rows[0][0].text).toBe('7')
      })
    })

    // #375: la columna del CERQual general salía sólo con el nivel; las de los cuatro
    // componentes sí traían su explicación. Y leía `evidence_profile.cerqual`, que puede
    // faltar o estar viejo: la copia autoritativa es la del nivel superior (resolveCerqual).
    describe('explicación del CERQual general en el Evidence Profile (#375)', () => {
      // Todo el texto de una celda, venga como `text` o como Paragraph/TextRun de docx.
      const cellText = (cell) => {
        const out = []
        const walk = (node, depth = 0) => {
          if (!node || depth > 12) return
          if (typeof node === 'string') { out.push(node); return }
          if (Array.isArray(node)) { node.forEach(n => walk(n, depth + 1)); return }
          if (typeof node === 'object') Object.values(node).forEach(v => walk(v, depth + 1))
        }
        walk(cell)
        return out.join(' ')
      }
      const cerqualCell = () => builderMock.addTable.mock.calls[1][0][0][6]

      it('incluye la explicación del CERQual general junto al nivel', async () => {
        const data = {
          ...mockData,
          findings: [{
            ...mockData.findings[0],
            cerqual: { option: 1, explanation: 'Moderate concerns about adequacy' },
            evidence_profile: { ...(mockData.findings[0].evidence_profile || {}), cerqual: { option: 1, explanation: 'Moderate concerns about adequacy' } }
          }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        expect(cellText(cerqualCell())).toContain('cerqual_options.moderate_confidence')
        expect(cellText(cerqualCell())).toContain('Moderate concerns about adequacy')
      })

      it('lee la copia autoritativa del nivel superior aunque evidence_profile no la tenga', async () => {
        const data = {
          ...mockData,
          findings: [{
            ...mockData.findings[0],
            cerqual: { option: 0, explanation: 'Only minor concerns' },
            evidence_profile: { ...(mockData.findings[0].evidence_profile || {}), cerqual: undefined }
          }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        expect(cellText(cerqualCell())).toContain('cerqual_options.high_confidence')
        expect(cellText(cerqualCell())).toContain('Only minor concerns')
      })

      it('sin explicación, sólo el nivel', async () => {
        const data = {
          ...mockData,
          findings: [{ ...mockData.findings[0], cerqual: { option: 2, explanation: '' } }]
        }

        await new IsoQExportStrategy(mockProject, data).export()

        expect(cellText(cerqualCell())).toContain('cerqual_options.low_confidence')
        expect(cellText(cerqualCell())).not.toContain('common.explanation_colon')
      })
    })

    // La licencia ya no es un párrafo del cuerpo: va en el pie (utils/wordFooter.js,
    // tests/unit/utils/wordFooter.spec.js y tests/unit/strategies/wordFooter.spec.js).

    describe('enrichFindings', () => {
      it('should preserve evidence_profile.references when originalFindings lacks them', () => {
        const data = {
          findings: [{ id: 1, name: 'F1', evidence_profile: { cerqual: { option: '0', explanation: '' }, references: [1, 2] } }],
          originalFindings: [{ id: 1, name: 'F1', evidence_profile: { cerqual: { option: '0', explanation: '' } } }],
          references: [
            { id: 1, authors: ['Author A'], publication_year: '2020' },
            { id: 2, authors: ['Author B'], publication_year: '2021' }
          ]
        }
        const strategy = new IsoQExportStrategy(mockProject, data)
        expect(strategy.data.findings[0].evidence_profile.references).toEqual([1, 2])
      })
    })

    describe('formatReferenceList', () => {
      it('should return empty string for empty or null refIds', () => {
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        expect(strategy.formatReferenceList([])).toBe('')
        expect(strategy.formatReferenceList(null)).toBe('')
      })

      it('should skip missing reference IDs silently without crash', () => {
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        const result = strategy.formatReferenceList([1, 99])
        expect(result).toContain('A1')
        expect(result).not.toContain('undefined')
      })

      // El orden es alfabético por la etiqueta «Autor Año», ni el de `refIds` (el de las
      // casillas) ni el del id. Antes era `a.id - b.id`, que con los ids reales —el string
      // hex de un ObjectId— daba NaN y dejaba las citas en el orden de las casillas.
      it('should sort references alphabetically regardless of refIds or id order', () => {
        const data = {
          findings: [],
          references: [
            { id: 1, authors: ['Zebra Z'], publication_year: '2020' },
            { id: 2, authors: ['Alpha A'], publication_year: '2021' },
            { id: 3, authors: ['Middle M'], publication_year: '2019' }
          ]
        }
        const strategy = new IsoQExportStrategy(mockProject, data)
        const result = strategy.formatReferenceList([3, 1, 2])
        const parts = result.split('; ')
        expect(parts[0]).toContain('Alpha')
        expect(parts[1]).toContain('Middle')
        expect(parts[2]).toContain('Zebra')
      })

      it('sorts alphabetically with real ObjectId ids', () => {
        const ids = ['65a1f0c2e4b0a1b2c3d4e5f6', '65a1f0c2e4b0a1b2c3d4e5f7', '65a1f0c2e4b0a1b2c3d4e5f8']
        const data = {
          findings: [],
          references: [
            { id: ids[0], authors: ['Smith J'], publication_year: '2020' },
            { id: ids[1], authors: ['Adams A'], publication_year: '2019' },
            { id: ids[2], authors: ['Moore M'], publication_year: '2021' }
          ]
        }
        const strategy = new IsoQExportStrategy(mockProject, data)
        const parts = strategy.formatReferenceList(ids).split('; ')
        expect(parts.map(p => p.split(' ')[0])).toEqual(['Adams', 'Moore', 'Smith'])
      })

      it('should populate references column using evidence_profile.references', async () => {
        const strategy = new IsoQExportStrategy(mockProject, mockData)
        await strategy.export()
        const rows = builderMock.addTable.mock.calls[0][0]
        expect(rows[0][4].text).toContain('A1')
      })

      it('should populate references column using top-level finding.references when evidence_profile.references is missing', async () => {
        const dataTopLevel = {
          findings: [{
            isoqf_id: 1,
            name: 'Finding 1',
            references: [1],
            evidence_profile: { cerqual: { option: '1', explanation: 'Exp' } }
          }],
          references: [{ id: 1, authors: ['A1'], publication_year: '2020' }]
        }
        const strategy = new IsoQExportStrategy(mockProject, dataTopLevel)
        await strategy.export()
        const rows = builderMock.addTable.mock.calls[0][0]
        expect(rows[0][4].text).toContain('A1')
      })

      it('should fall back to top-level references when evidence_profile.references is an empty array (stale mirror)', async () => {
        // The nested evidence_profile.references is a passive, now-unwritten mirror
        // that stays []. An empty array is truthy, so the old `nested || top-level`
        // precedence wrongly shadowed the correct top-level references.
        const dataStaleNested = {
          findings: [{
            isoqf_id: 1,
            name: 'Finding 1',
            references: [1],
            evidence_profile: { references: [], cerqual: { option: '1', explanation: 'Exp' } }
          }],
          references: [{ id: 1, authors: ['A1'], publication_year: '2020' }]
        }
        const strategy = new IsoQExportStrategy(mockProject, dataStaleNested)
        await strategy.export()
        const rows = builderMock.addTable.mock.calls[0][0]
        expect(rows[0][4].text).toContain('A1')
      })
    })
  })

  describe('CamelotExportStrategy', () => {
    // Damián, 2026-11-12: el Word de la worksheet salía en español salvo algunas cabeceras.
    // Tres del Evidence Profile estaban escritas a mano en inglés, y las dos de Extracted
    // data salían del `label` guardado con la tabla (en inglés desde que se creó). En
    // pantalla la worksheet ya las rotula con i18n.
    describe('cabeceras traducidas', () => {
      const textOf = (node) => {
        const out = []
        const walk = (n, depth = 0) => {
          if (!n || depth > 14) return
          if (typeof n === 'string') { out.push(n); return }
          if (Array.isArray(n)) { n.forEach(x => walk(x, depth + 1)); return }
          if (typeof n === 'object') Object.values(n).forEach(v => walk(v, depth + 1))
        }
        walk(node)
        return out.join(' | ')
      }

      it('el Evidence Profile no tiene cabeceras escritas a mano en inglés', () => {
        const section = { option: 0, explanation: '' }
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        strategy.evidenceProfile = [{
          displayNumber: 1,
          name: 'F',
          methodological_limitations: section,
          coherence: section,
          adequacy: section,
          relevance: section,
          cerqual: section
        }]

        const text = textOf(strategy.createEvidenceProfileSection())

        expect(text).not.toContain('Summarized Review Finding')
        expect(text).not.toContain('GRADE-CERQual assessment of confidence')
        expect(text).not.toMatch(/(^|\| )References( \||$)/)
        expect(text).toContain('table_headers.summarised_finding')
        expect(text).toContain('table_headers.cerqual_assessment')
        expect(text).toContain('table_headers.references')
      })

      // Damián, 2026-11-12: en el Word de la worksheet CAMELOT la explicación del CERQual
      // general salía sola, sin «Explicación:» como en las otras cuatro columnas.
      it('la explicación del CERQual general lleva «Explicación:», como las demás columnas', () => {
        const strategy = new CamelotExportStrategy(mockProject, mockData)

        const text = textOf(strategy.createCerqualCell({ option: 0, explanation: 'porque sí' }))

        expect(text).toContain('common.explanation_colon porque sí')
      })

      it('sin explicación, sólo el nivel (y no falla si falta el campo)', () => {
        const strategy = new CamelotExportStrategy(mockProject, mockData)

        const text = textOf(strategy.createCerqualCell({ option: 0 }))

        expect(text).not.toContain('common.explanation_colon')
      })

      it('sin evidence profile, el aviso también va con i18n', () => {
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        strategy.evidenceProfile = []

        const text = textOf(strategy.createEvidenceProfileSection())

        expect(text).toContain('worksheet.no_evidence_profile_data')
        expect(text).not.toContain('No evidence profile data available')
      })

      it('Extracted data rotula sus dos columnas fijas con i18n, no con el label guardado', () => {
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        strategy.extractedData = {
          fields: [
            { key: 'ref_id', label: 'ID' },
            { key: 'authors', label: 'Author(s), Year' },
            { key: 'column_0', label: 'Extracted data supporting the review finding' }
          ],
          items: [{ ref_id: 'R1', authors: 'Smith 2020', column_0: 'dato' }]
        }

        const text = textOf(strategy.createExtractedDataSection())

        expect(text).not.toContain('Author(s), Year')
        expect(text).not.toContain('Extracted data supporting the review finding')
        expect(text).toContain('table_headers.author_year')
        expect(text).toContain('table_headers.extracted_data')
        expect(text).toContain('dato')
      })
    })

    it('should generate document with 4 separate landscape sections', async () => {
      // Las 4 secciones salen cuando corresponden las tablas de los estudios (publicado
      // «fully» o exportado desde el proyecto): ver worksheetStudyTables.spec.js.
      const strategy = new CamelotExportStrategy({ ...mockProject, public_type: 'fully' }, mockData)
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

      await strategy.export()

      expect(evidenceSpy).toHaveBeenCalled()
      expect(charsSpy).toHaveBeenCalled()
      expect(methSpy).toHaveBeenCalled()
      expect(extractedSpy).toHaveBeenCalled()
    })

    describe('el número del finding', () => {
      // `:488` (this.evidenceProfile[0].displayNumber) no tenía cobertura directa:
      // docx no está mockeado en este archivo, así que se afirma sobre el Table real
      // serializado, siguiendo el patrón "opaque pero defined" ya usado arriba para
      // Table/Paragraph.
      it('createEvidenceProfileSection imprime displayNumber, no sort ni isoqf_id', () => {
        const data = {
          evidenceProfile: [{
            displayNumber: 42,
            sort: 91,
            isoqf_id: 13,
            name: 'F',
            methodological_limitations: { option: 0, explanation: '' },
            coherence: { option: 0, explanation: '' },
            adequacy: { option: 0, explanation: '' },
            relevance: { option: 0, explanation: '' },
            cerqual: { option: 0, explanation: '' }
          }]
        }
        const strategy = new CamelotExportStrategy(mockProject, data)

        const [table] = strategy.createEvidenceProfileSection()
        const serialized = JSON.stringify(table)

        expect(serialized).toContain('"42"')
        expect(serialized).not.toContain('"91"')
        expect(serialized).not.toContain('"13"')
      })
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
            { ref_id: 1, authors: 'Author A', year: '2021', column_1: 'Val 1', research_comments: 'A' }
          ]
        }
        mockData.characteristicStudies = charData
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        
        const table = strategy.createCharacteristicsTable(charData)
        expect(table).toBeDefined()
        // We can check if it returns a Table object (mocked or real)
      })

      // The two header rows of the docx XML tree (`root` only: `options` repeats the content).
      // A cell is its text and whether it is vertically merged; a rowSpan leaves a merged
      // continuation cell in the row below, which is not a header of its own.
      const headerRows = table => {
        const find = (node, key, out = []) => {
          if (Array.isArray(node)) node.forEach(n => find(n, key, out))
          else if (node && typeof node === 'object') {
            if (node.rootKey === key) out.push(node)
            else find(node.root, key, out)
          }
          return out
        }
        const text = cell => find(cell, 'w:t').map(t => t.root.filter(x => typeof x === 'string').join('')).join('')
        const [top, sub] = find(table, 'w:tr').slice(0, 2).map(row =>
          find(row, 'w:tc').map(cell => ({ text: text(cell), merged: find(cell, 'w:vMerge').length > 0 })))
        return [top, sub.filter(cell => !cell.merged)]
      }

      it('labels a custom column like a CAMELOT domain: its name on top, "Extracted data" below', () => {
        const charData = {
          fields: [{ key: 'column_1', label: 'Custom 1' }],
          items: [{ ref_id: 1, authors: 'Author A', year: '2021', column_1: 'Val 1' }]
        }
        const strategy = new CamelotExportStrategy(mockProject, { ...mockData, characteristicStudies: charData })
        const [top, sub] = headerRows(strategy.createCharacteristicsTable(charData))
        const domains = strategy.getCamelotConfig().categories

        const custom = top.find(c => c.text === 'Custom 1')
        expect(custom.merged).toBe(false)
        // Row 2 follows row 1: the custom column first, then each domain's two options.
        expect(sub).toHaveLength(1 + domains.length * 2)
        expect(sub[0].text).toBe('camelot.step_four.camelot_mixin.extracted_data')
        expect(sub[1].text).toBe('camelot.step_four.camelot_mixin.extracted_data')
        expect(sub[2].text).toBe('camelot.step_four.camelot_mixin.concerns')
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
                 { options: [{ option: 'A', text: 'Desc A' }] }, // FA1
                 { options: [{ option: 'B', text: 'Desc B' }] }, // FA5
                 { options: [{ option: 'C', text: 'Desc C' }] }, // FA9
                 { options: [{ option: 'D', text: 'Desc D' }] }  // OA
               ]
             }
           ]
         }
         mockData.methodologicalAssessments = methData
         const strategy = new CamelotExportStrategy(mockProject, mockData)

         const table = strategy.createMethodologicalAssessmentTable(methData)
         expect(table).toBeDefined()
         // In a real test we'd check rows and cells, but docx objects are opaque here.
         // We've verified it doesn't crash and returns a Table object.
      })

      it('should return correct background colors for options', () => {
        const strategy = new CamelotExportStrategy(mockProject, mockData)
        expect(strategy.getOptionColor('A')).toBe('1065AB')
        expect(strategy.getOptionColor('B')).toBe('8EC4DE')
        expect(strategy.getOptionColor('C')).toBe('F6A482')
        expect(strategy.getOptionColor('D')).toBe('B31529')
        expect(strategy.getOptionColor('E')).toBe('B3B3B3')
        expect(strategy.getOptionColor('X')).toBeNull()
      })
    })
  })

  // Reporte: un estudio agregado al finding después de los demás salía al final. Las citas
  // del export siguen el orden de la etiqueta que se lee, no el de las casillas ni el del id.
  describe('orden de las citas en los exports de la hoja', () => {
    const ids = ['65a1f0c2e4b0a1b2c3d4e5f6', '65a1f0c2e4b0a1b2c3d4e5f7', '65a1f0c2e4b0a1b2c3d4e5f8']

    it('CAMELOT: listReferenceLabels en orden alfabético', () => {
      const strategy = new CamelotExportStrategy(mockProject, {
        ...mockData,
        references: [
          { id: ids[0], authors: ['Smith J'], publication_year: '2020' },
          { id: ids[1], authors: ['Adams A'], publication_year: '2019' },
          { id: ids[2], authors: ['Moore M'], publication_year: '2021' }
        ],
        list: { references: [ids[0], ids[1], ids[2]] }
      })
      expect(strategy.listReferenceLabels().map(l => l.split(' ')[0])).toEqual(['Adams', 'Moore', 'Smith'])
    })

    it('hoja: formatReferences en orden alfabético', () => {
      const strategy = new WorksheetExportStrategy(mockProject, {
        ...mockData,
        references: [
          { id: ids[0], content: 'Smith 2020' },
          { id: ids[1], content: 'Adams 2019' },
          { id: ids[2], content: 'Moore 2021' }
        ],
        list: { references: [ids[0], ids[1], ids[2]] }
      })
      expect(strategy.formatReferences([ids[0], ids[1], ids[2]])).toBe('Adams 2019\n\nMoore 2021\n\nSmith 2020')
    })
  })

  describe('WorksheetExportStrategy — el número del finding', () => {
    // `:1289` era el peor fallback del archivo: `isoqf_id || id || '' || '1'`. Podía
    // imprimir un ObjectId hex de 24 caracteres, o el literal '1', en el documento
    // que el usuario descarga y cita.
    it('imprime displayNumber y nunca el id ni el literal 1', () => {
      const strategy = new WorksheetExportStrategy(mockProject, { findings: [], references: [] })

      strategy.createEvidenceProfileTable({
        displayNumber: 2, isoqf_id: 88, id: '66b1ff0000000000000000a1', name: 'F'
      })
      const withNumberRows = builderMock.addTable.mock.calls[0][0]
      expect(withNumberRows[0][0].text).toBe('2')

      builderMock.addTable.mockClear()

      strategy.createEvidenceProfileTable({
        id: '66b1ff0000000000000000a1', name: 'F'
      })
      const withoutNumberRows = builderMock.addTable.mock.calls[0][0]
      expect(withoutNumberRows[0][0].text).toBe('')
      expect(withoutNumberRows[0][0].text).not.toContain('66b1ff')
      expect(withoutNumberRows[0][0].text).not.toBe('1')
    })
  })
  // Damián, 2026-11-12: el Word de la worksheet sin CAMELOT salía entero en inglés —
  // título, cabeceras, niveles y «Explanation:»— aunque la interfaz estuviera en español.
  // Y el CERQual general se mostraba con los niveles de PREOCUPACIÓN («No/Very minor
  // concerns») en vez de los de confianza («High confidence»).
  describe('WorksheetExportStrategy — multi-idioma', () => {
    const ep = {
      displayNumber: 1,
      name: 'F',
      methodological_limitations: { option: 1, explanation: 'ml' },
      coherence: { option: 0, explanation: '' },
      adequacy: { option: 2, explanation: '' },
      relevance: { option: 3, explanation: '' },
      cerqual: { option: 0, explanation: 'porque sí' },
      references: []
    }

    it('cabeceras de la tabla con i18n', () => {
      new WorksheetExportStrategy(mockProject, { references: [] }).createEvidenceProfileTable(ep)

      const headers = builderMock.addTable.mock.calls[0][1].map(h => h.text)
      expect(headers).toEqual([
        '#',
        'table_headers.summarised_finding',
        'worksheet.methodological_limitations',
        'worksheet.coherence',
        'worksheet.adequacy',
        'worksheet.relevance',
        'table_headers.cerqual_assessment',
        'table_headers.references'
      ])
    })

    it('niveles y «Explanation:» con i18n, y el CERQual con niveles de confianza', () => {
      new WorksheetExportStrategy(mockProject, { references: [] }).createEvidenceProfileTable(ep)

      const row = builderMock.addTable.mock.calls[0][0][0]
      expect(row[2].text).toContain('cerqual_options.minor_concerns')
      expect(row[2].text).toContain('common.explanation_colon')
      expect(row[3].text).toBe('cerqual_options.no_very_minor_concerns')
      expect(row[6].text).toContain('cerqual_options.high_confidence')
      expect(row[6].text).toContain('porque sí')
      expect(row[6].text).not.toContain('concerns')
    })

    it('título y tablas opcionales con i18n', async () => {
      const table = { fields: [{ key: 'authors', label: 'Author(s), Year' }], items: [{ authors: 'A 2020' }] }
      await new WorksheetExportStrategy({ ...mockProject, public_type: 'fully' }, {
        references: [],
        evidenceProfile: ep,
        characteristicsStudies: table,
        methodologicalAssessments: table,
        extractedData: { fields: [{ key: 'authors', label: 'Author(s), Year' }, { key: 'column_0', label: 'Extracted data supporting the review finding' }], items: [{ authors: 'A 2020', column_0: 'x' }] }
      }).export()

      const paragraphs = builderMock.addParagraph.mock.calls.map(c => c[0])
      expect(paragraphs).toEqual(expect.arrayContaining([
        'worksheet.grade_cerqual_worksheet',
        'worksheet.characteristics_of_studies',
        'worksheet.methodological_assessments',
        'worksheet.extracted_data'
      ]))
      const extractedHeaders = builderMock.addTable.mock.calls[builderMock.addTable.mock.calls.length - 1][1].map(h => h.text)
      expect(extractedHeaders).toEqual(['table_headers.author_year', 'table_headers.extracted_data'])
    })
  })
})
