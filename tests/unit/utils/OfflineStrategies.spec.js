
import { strategies } from '@/utils/OfflineStrategies'

jest.mock('@/services/db', () => ({
  saveProject: jest.fn(),
  getProject: jest.fn(),
  getAllProjects: jest.fn(),
  saveWorksheet: jest.fn(),
  getWorksheet: jest.fn(),
  getWorksheetsByProject: jest.fn(),
  saveFinding: jest.fn(),
  getFinding: jest.fn(),
  getFindingsByWorksheet: jest.fn(),
  saveReference: jest.fn(),
  getReferencesByProject: jest.fn(),
  saveCharacteristic: jest.fn(),
  getCharacteristicsByProject: jest.fn(),
  saveAssessment: jest.fn(),
  getAssessmentsByProject: jest.fn(),
  saveExtractedData: jest.fn(),
  getExtractedDataByFinding: jest.fn(),
  saveListCategory: jest.fn(),
  getListCategoriesByProject: jest.fn(),
  db: {
    extractedData: { get: jest.fn() }
  }
}))

const db = require('@/services/db')

const getStrategy = (name) => strategies.find(s => s.name === name)

describe('OfflineStrategies', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('list-categories', () => {
    const strategy = () => getStrategy('list-categories')

    describe('serve()', () => {
      it('returns [] when project_id is present but cache is empty', async () => {
        db.getListCategoriesByProject.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_list_categories', { project_id: 'proj1', organization: 'org1' })

        expect(result).toEqual([])
        expect(db.getListCategoriesByProject).toHaveBeenCalledWith('proj1')
      })

      it('returns cached data when categories exist', async () => {
        const categories = [{ id: 'cat1', project_id: 'proj1', text: 'Category 1' }]
        db.getListCategoriesByProject.mockResolvedValue(categories)

        const result = await strategy().serve('/isoqf_list_categories', { project_id: 'proj1' })

        expect(result).toEqual(categories)
      })

      it('returns null when params has no project_id', async () => {
        const result = await strategy().serve('/isoqf_list_categories', {})

        expect(result).toBeNull()
        expect(db.getListCategoriesByProject).not.toHaveBeenCalled()
      })

      it('returns null when params is null', async () => {
        const result = await strategy().serve('/isoqf_list_categories', null)

        expect(result).toBeNull()
      })
    })
  })

  describe('characteristics', () => {
    const strategy = () => getStrategy('characteristics')

    describe('serve()', () => {
      it('returns [] when project_id is present but cache is empty', async () => {
        db.getCharacteristicsByProject.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_characteristics', { project_id: 'proj1' })

        expect(result).toEqual([])
        expect(db.getCharacteristicsByProject).toHaveBeenCalledWith('proj1')
      })

      it('returns cached data when characteristics exist', async () => {
        const chars = [{ id: 'ch1', project_id: 'proj1', fields: [] }]
        db.getCharacteristicsByProject.mockResolvedValue(chars)

        const result = await strategy().serve('/isoqf_characteristics', { project_id: 'proj1' })

        expect(result).toEqual(chars)
      })

      it('returns null when params has no project_id', async () => {
        const result = await strategy().serve('/isoqf_characteristics', {})

        expect(result).toBeNull()
      })
    })

    describe('update()', () => {
      it('calls saveCharacteristic with the full document', async () => {
        const charDoc = {
          id: 'ch1',
          project_id: 'proj1',
          fields: [],
          items: [
            { ref_id: 'ref1', authors: 'Smith 2020' },
            { ref_id: 'ref2', authors: 'Doe 2021' }
          ]
        }

        await strategy().update(charDoc, '/isoqf_characteristics/ch1/')

        expect(db.saveCharacteristic).toHaveBeenCalledWith(charDoc)
      })

      it('does nothing when data is null', async () => {
        await strategy().update(null, '/isoqf_characteristics/ch1/')

        expect(db.saveCharacteristic).not.toHaveBeenCalled()
      })

      it('does nothing when data has no id', async () => {
        await strategy().update({ project_id: 'proj1', fields: [] }, '/isoqf_characteristics/ch1/')

        expect(db.saveCharacteristic).not.toHaveBeenCalled()
      })
    })
  })

  describe('assessments', () => {
    const strategy = () => getStrategy('assessments')

    describe('serve()', () => {
      it('returns [] when project_id is present but cache is empty', async () => {
        db.getAssessmentsByProject.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_assessments', { project_id: 'proj1' })

        expect(result).toEqual([])
        expect(db.getAssessmentsByProject).toHaveBeenCalledWith('proj1')
      })

      it('returns cached data when assessments exist', async () => {
        const assessments = [{ id: 'as1', project_id: 'proj1', fields: [] }]
        db.getAssessmentsByProject.mockResolvedValue(assessments)

        const result = await strategy().serve('/isoqf_assessments', { project_id: 'proj1' })

        expect(result).toEqual(assessments)
      })

      it('returns null when params has no project_id', async () => {
        const result = await strategy().serve('/isoqf_assessments', null)

        expect(result).toBeNull()
      })
    })
  })

  describe('references', () => {
    const strategy = () => getStrategy('references')

    describe('serve()', () => {
      it('returns [] when project_id is present but cache is empty', async () => {
        db.getReferencesByProject.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_references', { project_id: 'proj1' })

        expect(result).toEqual([])
        expect(db.getReferencesByProject).toHaveBeenCalledWith('proj1')
      })

      it('returns extracted reference data (not raw db records) when references exist', async () => {
        // getReferencesByProject returns raw IndexedDB records { id, projectId, data, lastSync }
        // The strategy must extract .data to return proper reference objects to the components
        const rawRecords = [
          {
            id: 'ref1',
            projectId: 'proj1',
            data: { id: 'ref1', project_id: 'proj1', authors: ['Smith, J'], title: 'Study 1' },
            lastSync: '2024-01-01T00:00:00.000Z'
          }
        ]
        db.getReferencesByProject.mockResolvedValue(rawRecords)

        const result = await strategy().serve('/isoqf_references', { project_id: 'proj1' })

        expect(result).toEqual([{ id: 'ref1', project_id: 'proj1', authors: ['Smith, J'], title: 'Study 1' }])
        expect(result[0]).not.toHaveProperty('projectId')
        expect(result[0]).not.toHaveProperty('lastSync')
      })

      it('returns null when params has no project_id', async () => {
        const result = await strategy().serve('/isoqf_references', {})

        expect(result).toBeNull()
      })
    })
  })

  describe('worksheets', () => {
    const strategy = () => getStrategy('worksheets')

    describe('serve() with project_id in params', () => {
      it('returns [] when project_id is present but cache is empty', async () => {
        db.getWorksheetsByProject.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_lists', { project_id: 'proj1' })

        expect(result).toEqual([])
        expect(db.getWorksheetsByProject).toHaveBeenCalledWith('proj1')
      })

      it('returns mapped data when worksheets exist', async () => {
        const rawRecords = [
          { id: 'ws1', projectId: 'proj1', data: { id: 'ws1', name: 'Finding 1', project_id: 'proj1' } }
        ]
        db.getWorksheetsByProject.mockResolvedValue(rawRecords)

        const result = await strategy().serve('/isoqf_lists', { project_id: 'proj1' })

        expect(result).toEqual([{ id: 'ws1', name: 'Finding 1', project_id: 'proj1' }])
      })

      it('returns null when params has no project_id', async () => {
        db.getWorksheet.mockResolvedValue(null)

        const result = await strategy().serve('/isoqf_lists', {})

        expect(result).toBeNull()
      })
    })
  })

  describe('findings', () => {
    const strategy = () => getStrategy('findings')

    describe('serve() with list_id in params', () => {
      it('returns [] when list_id is present but no findings in cache', async () => {
        db.getFindingsByWorksheet.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_findings', { list_id: 'list1' })

        expect(result).toEqual([])
        expect(db.getFindingsByWorksheet).toHaveBeenCalledWith('list1')
      })

      it('returns mapped findings when list_id matches cached data', async () => {
        const rawRecords = [
          { id: 'f1', worksheetId: 'list1', data: { id: 'f1', name: 'Finding 1' } }
        ]
        db.getFindingsByWorksheet.mockResolvedValue(rawRecords)

        const result = await strategy().serve('/isoqf_findings', { list_id: 'list1' })

        expect(result).toEqual([{ id: 'f1', name: 'Finding 1' }])
      })

      it('returns null when params is null', async () => {
        const result = await strategy().serve('/isoqf_findings', null)

        expect(result).toBeNull()
      })
    })

    describe('serve() with list_ids in params', () => {
      it('returns [] when list_ids is present but no findings in cache', async () => {
        db.getFindingsByWorksheet.mockResolvedValue([])

        const result = await strategy().serve('/isoqf_findings', { list_ids: 'list1,list2' })

        expect(result).toEqual([])
      })

      it('returns combined findings from multiple list_ids', async () => {
        const record1 = { id: 'f1', worksheetId: 'list1', data: { id: 'f1', name: 'Finding 1' } }
        const record2 = { id: 'f2', worksheetId: 'list2', data: { id: 'f2', name: 'Finding 2' } }
        db.getFindingsByWorksheet
          .mockResolvedValueOnce([record1])
          .mockResolvedValueOnce([record2])

        const result = await strategy().serve('/isoqf_findings', { list_ids: 'list1,list2' })

        expect(result).toEqual([
          { id: 'f1', name: 'Finding 1' },
          { id: 'f2', name: 'Finding 2' }
        ])
      })
    })
  })
})
