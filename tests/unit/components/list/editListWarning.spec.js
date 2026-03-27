
import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

// Mock Api utility
jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
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

describe('editList.vue Warning Logic', () => {
  let store
  let mocks
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: { id: 1, personal_organization: 'org1' },
        promise: Promise.resolve()
      }
    })
    mocks = {
      $t: (key) => key,
      $route: { params: { id: '1', org_id: 'org1' } },
      $router: { push: jest.fn() },
      $http: { get: jest.fn(() => Promise.resolve({ data: [] })) }
    }

    // Default mock implementation for getLists
    Api.get.mockImplementation((url) => {
      return Promise.resolve({ data: [] })
    })
  })

  it('should NOT show warning when items have empty orphan columns but all fields-defined columns are full', async () => {
    const listData = {
      id: 'list1',
      references: ['ref1'],
      fullreferences: [{ id: 'ref1', authors: ['Author, Name'], publication_year: '2021', title: 'Title' }],
      project: { use_camelot: false, review_question: 'Q?', inclusion: 'Inc', exclusion: 'Exc', organization: 'org1', id: 'p1' },
      characteristics: [{
        fields: [
          { key: 'ref_id', label: 'Reference ID' },
          { key: 'authors', label: 'Author(s), Year' },
          { key: 'column_0', label: 'Country' }
        ],
        items: [{
          ref_id: 'ref1',
          authors: 'Author 2021',
          column_0: 'UK',
          column_orphan: '' // This column is NOT in fields but is empty
        }]
      }],
      findings: [{
        id: 'f1',
        evidence_profile: {
          methodological_limitations: { option: 0 },
          coherence: { option: 0 },
          adequacy: { option: 0 },
          relevance: { option: 0 },
          cerqual: { option: 0 }
        }
      }],
      assessments: [{
        fields: [],
        items: []
      }],
      extracted_data: {
        fields: [],
        items: []
      },
      cerqual: { option: 0 }
    }

    Api.get.mockImplementation((url) => {
      if (url === '/getLists') {
        return Promise.resolve({ data: [listData] })
      }
      return Promise.resolve({ data: [] })
    })

    wrapper = shallowMount(editList, {
      localVue,
      store,
      mocks
    })

    // Wait for Api.get in mounted and subsequent calls
    await localVue.nextTick()
    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
    
    // Check that orphan column is removed
    const processedItem = wrapper.vm.characteristics_studies.items[0]
    expect(processedItem.column_orphan).toBeUndefined()
    expect(processedItem.column_0).toBe('UK')
  })

  it('should remove orphan columns from Methodological Assessments in non-Camelot project', async () => {
    const listData = {
      id: 'list1',
      references: ['ref1'],
      fullreferences: [{ id: 'ref1', authors: ['Author, Name'], publication_year: '2021', title: 'Title' }],
      project: { use_camelot: false, review_question: 'Q?', inclusion: 'Inc', exclusion: 'Exc', organization: 'org1', id: 'p1' },
      characteristics: [],
      findings: [{
        id: 'f1',
        evidence_profile: {
          methodological_limitations: { option: 0 },
          coherence: { option: 0 },
          adequacy: { option: 0 },
          relevance: { option: 0 },
          cerqual: { option: 0 }
        }
      }],
      assessments: [{
        fields: [
          { key: 'ref_id', label: 'Reference ID' },
          { key: 'authors', label: 'Author(s), Year' },
          { key: 'column_0', label: 'Assessment 1' }
        ],
        items: [{
          ref_id: 'ref1',
          authors: 'Author 2021',
          column_0: 'Good',
          column_orphan: 'Should be removed'
        }]
      }],
      extracted_data: { fields: [], items: [] },
      cerqual: { option: 0 }
    }

    Api.get.mockImplementation((url) => {
      if (url === '/getLists') {
        return Promise.resolve({ data: [listData] })
      }
      return Promise.resolve({ data: [] })
    })

    wrapper = shallowMount(editList, {
      localVue,
      store,
      mocks
    })

    await localVue.nextTick()
    await localVue.nextTick()
    await localVue.nextTick()

    // Check that orphan column is removed from assessments
    const processedItem = wrapper.vm.meth_assessments.items[0]
    expect(processedItem.column_orphan).toBeUndefined()
    expect(processedItem.column_0).toBe('Good')
  })

  it('should show warning when a field-defined column is empty', async () => {
    const listData = {
      id: 'list1',
      references: ['ref1'],
      fullreferences: [{ id: 'ref1', authors: ['Author, Name'], publication_year: '2021', title: 'Title' }],
      project: { use_camelot: false, review_question: 'Q?', inclusion: 'Inc', exclusion: 'Exc', organization: 'org1', id: 'p1' },
      characteristics: [{
        fields: [
          { key: 'ref_id', label: 'Reference ID' },
          { key: 'authors', label: 'Author(s), Year' },
          { key: 'column_0', label: 'Country' }
        ],
        items: [{
          ref_id: 'ref1',
          authors: 'Author 2021',
          column_0: '' // Empty column that IS in fields
        }]
      }],
      findings: [{
        id: 'f1',
        evidence_profile: {
          methodological_limitations: { option: 0 },
          coherence: { option: 0 },
          adequacy: { option: 0 },
          relevance: { option: 0 },
          cerqual: { option: 0 }
        }
      }],
      assessments: [{
        fields: [],
        items: []
      }],
      extracted_data: {
        fields: [],
        items: []
      },
      cerqual: { option: 0 }
    }

    Api.get.mockImplementation((url) => {
      if (url === '/getLists') {
        return Promise.resolve({ data: [listData] })
      }
      return Promise.resolve({ data: [] })
    })

    wrapper = shallowMount(editList, {
      localVue,
      store,
      mocks
    })

    await localVue.nextTick()
    await localVue.nextTick()
    await localVue.nextTick()

    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
  })
})
