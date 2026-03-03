
import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

// Mock Api utility
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

// Mock font-awesome-icon
localVue.component('font-awesome-icon', { template: '<i></i>' })

// Mock window.scrollTo
global.scrollTo = jest.fn()

// Mock document.getElementsByName
document.getElementsByName = jest.fn().mockReturnValue([{
  offsetParent: { offsetTop: 100 }
}])

describe('Camelot Warning Logic Tests', () => {
  let store
  let mocks

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: {
          id: 1,
          personal_organization: 'org1'
        }
      }
    })
    mocks = {
      $t: (key) => key,
      $route: { params: { id: '1', org_id: 'org1' } },
      $router: { push: jest.fn() },
      parseReference: jest.fn((ref) => 'Author 2020')
    }
  })

  describe('editList.vue', () => {
    it('should NOT show warning for MethAssessments in Camelot project when data is complete', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      // Simulate a Camelot project
      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author, A.'], publication_year: '2020', title: 'Title' }]),
          assessments: [{
            fields: [{ key: 'ref_id' }], // Only 1 field, usually triggers warning
            items: [{
              ref_id: 'ref1',
              stages: [{
                options: [{ option: 'A' }] // Data is complete
              }]
            }]
          }]
        }
      })

      wrapper.vm.getMethAssessments()
      expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(false)
    })

    it('SHOULD show warning for MethAssessments in Camelot project when data is INCOMPLETE', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      // Simulate a Camelot project
      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author, A.'], publication_year: '2020', title: 'Title' }]),
          assessments: [{
            fields: [{ key: 'ref_id' }],
            items: [{
              ref_id: 'ref1',
              stages: [{
                options: [{ option: null }] // Data is INCOMPLETE
              }]
            }]
          }]
        }
      })

      wrapper.vm.getMethAssessments()
      expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(true)
    })

    it('SHOULD show warning for MethAssessments in NON-Camelot project when fields < 3', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      // Simulate a NON-Camelot project with few fields
      wrapper.setData({
        project: { use_camelot: false, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: false, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author, A.'], publication_year: '2020', title: 'Title' }]),
          assessments: [{
            fields: [{ key: 'ref_id' }, { key: 'col1' }], // fields.length = 2 (< 3)
            items: [{
              ref_id: 'ref1',
              col1: 'some data'
            }]
          }]
        }
      })

      wrapper.vm.getMethAssessments()
      expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(true)
    })

    it('should NOT show warning for CharsOfStudies in Camelot project when fields < 3 but Camelot data is complete', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }], // Only 1 field
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'data',
              stakeholders_extractedData: 'data',
              researchers_extractedData: 'data',
              context_extractedData: 'data',
              strategy_extractedData: 'data',
              theory_extractedData: 'data',
              ethical_extractedData: 'data',
              equity_extractedData: 'data',
              participant_extractedData: 'data',
              data_extractedData: 'data',
              analysis_extractedData: 'data',
              presentation_extractedData: 'data'
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    })

    it('SHOULD show warning for CharsOfStudies in Camelot when some Camelot domains are MISSING (undefined) from the item object', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'some data',
              stakeholders_extractedData: 'some data'
              // other keys like context_extractedData are UNDEFINED/MISSING
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('SHOULD show warning for CharsOfStudies in Camelot project when Camelot data is INCOMPLETE', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: '', // EMPTY
              stakeholders_extractedData: 'data'
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('SHOULD show warning for CharsOfStudies in NON-Camelot project when fields < 3', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      wrapper.setData({
        project: { use_camelot: false, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: false, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }, { key: 'col1' }], // 2 fields < 3
            items: [{ ref_id: 'ref1', col1: 'data' }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('should NOT show warning for CharsOfStudies in Camelot project when concerns are empty', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'some data',
              stakeholders_extractedData: 'data',
              researchers_extractedData: 'data',
              context_extractedData: 'data',
              strategy_extractedData: 'data',
              theory_extractedData: 'data',
              ethical_extractedData: 'data',
              equity_extractedData: 'data',
              participant_extractedData: 'data',
              data_extractedData: 'data',
              analysis_extractedData: 'data',
              presentation_extractedData: 'data',
              research_concerns: '' // EMPTY CONCERN - Should be allowed
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    })

    it('should NOT show warning for CharsOfStudies in Camelot when some _concerns fields are empty but all _extractedData are complete', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'data',
              stakeholders_extractedData: 'data',
              researchers_extractedData: 'data',
              context_extractedData: 'data',
              strategy_extractedData: 'data',
              theory_extractedData: 'data',
              ethical_extractedData: 'data',
              equity_extractedData: 'data',
              participant_extractedData: 'data',
              data_extractedData: 'data',
              analysis_extractedData: 'data',
              presentation_extractedData: 'data',
              research_concerns: '', // EMPTY CONCERN
              stakeholders_concerns: '' // EMPTY CONCERN
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    })

    it('should SHOW warning for CharsOfStudies in Camelot project if characteristics array is empty and there are references', () => {
      const wrapper = shallowMount(editList, {
        localVue,
        store,
        mocks,
        stubs: {
          'edit-header-list': true,
          'edit-list-actions-buttons': true,
          'evidence-profile-table': true,
          'table-chars-of-studies': true,
          'table-meth-assessments': true,
          'table-extracted-data': true
        }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [], // EMPTY ARRAY
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('SHOULD show warning for CharsOfStudies in Camelot when at least ONE domain is empty', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'some data',
              stakeholders_extractedData: '' // EMPTY - Now SHOULD trigger warning
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('SHOULD show warning for CharsOfStudies in Camelot when a CUSTOM field is empty', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: true, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: true, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }, { key: 'custom_col' }],
            items: [{ 
              ref_id: 'ref1', 
              research_extractedData: 'all good',
              stakeholders_extractedData: 'all good',
              researchers_extractedData: 'all good',
              context_extractedData: 'all good',
              strategy_extractedData: 'all good',
              theory_extractedData: 'all good',
              ethical_extractedData: 'all good',
              equity_extractedData: 'all good',
              participant_extractedData: 'all good',
              data_extractedData: 'all good',
              analysis_extractedData: 'all good',
              presentation_extractedData: 'all good',
              custom_col: '' // EMPTY CUSTOM FIELD
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('SHOULD show warning for CharsOfStudies in NON-Camelot project when a custom field is empty', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: false, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: false, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }, { key: 'col1' }, { key: 'col2' }, { key: 'col3' }],
            items: [{ 
              ref_id: 'ref1', 
              col1: 'data',
              col2: 'data',
              col3: '' // EMPTY FIELD
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    })

    it('should NOT show warning for CharsOfStudies in NON-Camelot project when all fields are complete', () => {
      const wrapper = shallowMount(editList, {
        localVue, store, mocks,
        stubs: { 'edit-header-list': true, 'edit-list-actions-buttons': true, 'evidence-profile-table': true, 'table-chars-of-studies': true, 'table-meth-assessments': true, 'table-extracted-data': true }
      })

      wrapper.setData({
        project: { use_camelot: false, organization: 'org1', id: 'p1' },
        list: {
          project: { use_camelot: false, organization: 'org1', id: 'p1' },
          references: ['ref1'],
          findings: [],
          characteristics: [{
            fields: [{ key: 'ref_id' }, { key: 'col1' }, { key: 'col2' }, { key: 'col3' }],
            items: [{ 
              ref_id: 'ref1', 
              col1: 'data',
              col2: 'data',
              col3: 'data' // ALL COMPLETE
            }]
          }],
          assessments: [],
          fullreferences: JSON.stringify([{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }])
        }
      })

      wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    })
  })

  describe('previewContentWorksheet.vue', () => {
    it('should NOT show warning for MethAssessments in Camelot project when data is complete', async () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks,
        data() {
          return {
            project: { use_camelot: true, id: 'p1' },
            list: { references: ['ref1'], organization: 'org1', project_id: 'p1' }
          }
        }
      })

      const Api = require('@/utils/Api')
      Api.get.mockImplementation((url) => {
        if (url.startsWith('/isoqf_lists/')) {
          return Promise.resolve({
            data: { id: '1', references: ['ref1'], organization: 'org1', project_id: 'p1' }
          })
        }
        if (url === '/isoqf_assessments') {
          return Promise.resolve({
            data: [{
              fields: [{ key: 'ref_id' }, { key: 'stages' }],
              items: [{
                ref_id: 'ref1',
                stages: [{
                  options: [{ option: 'A' }]
                }]
              }]
            }]
          })
        }
        if (url === '/isoqf_references') {
          return Promise.resolve({
            data: [{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }]
          })
        }
        if (url === '/isoqf_characteristics') {
          return Promise.resolve({
            data: [{
              fields: [{ key: 'ref_id' }, { key: 'col1' }],
              items: [{ ref_id: 'ref1', col1: 'data' }]
            }]
          })
        }
        if (url.startsWith('/isoqf_projects/')) {
          return Promise.resolve({
            data: { use_camelot: true, id: 'p1' }
          })
        }
        return Promise.resolve({ data: [] })
      })

      // The component calls getList which calls getAllReferences
      await wrapper.vm.getList()
      await wrapper.vm.getMethAssessments()
      expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(false)
    })

    it('should NOT show warning for CharsOfStudies in Camelot project when fields < 3', async () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks,
        data() {
          return {
            project: { use_camelot: true, id: 'p1' },
            list: { references: ['ref1'], organization: 'org1', project_id: 'p1' }
          }
        }
      })

      const Api = require('@/utils/Api')
      Api.get.mockImplementation((url) => {
        if (url.startsWith('/isoqf_lists/')) {
          return Promise.resolve({
            data: { id: '1', references: ['ref1'], organization: 'org1', project_id: 'p1' }
          })
        }
        if (url === '/isoqf_references') {
          return Promise.resolve({
            data: [{ id: 'ref1', authors: ['Author'], publication_year: '2020', title: 'Title' }]
          })
        }
        if (url === '/isoqf_characteristics') {
          return Promise.resolve({
            data: [{
              fields: [{ key: 'ref_id' }, { key: 'col1' }],
              items: [{ ref_id: 'ref1', col1: 'data' }]
            }]
          })
        }
        if (url === '/isoqf_projects/p1') {
          return Promise.resolve({
            data: { use_camelot: true, id: 'p1' }
          })
        }
        return Promise.resolve({ data: [] })
      })

      await wrapper.vm.getList()
      await wrapper.vm.getCharsOfStudies()
      expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    })
  })
})
