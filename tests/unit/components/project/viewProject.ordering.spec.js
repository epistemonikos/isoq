
import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

// Mock dependencies
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))
jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn()
}))
jest.mock('vuedraggable', () => ({
  render: h => h('div')
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('viewProject.vue ordering logic', () => {
  let wrapper
  let mocks

  beforeEach(() => {
    mocks = {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } }
    }

    // Basic mount to get access to methods
    wrapper = shallowMount(viewProject, {
      localVue,
      mocks,
      stubs: {
        'action-buttons': true,
        'propertiesProject': true,
        'UploadReferences': true,
        'InclusionExclusioCriteria': true,
        'crudTables': true,
        'PrintViewTable': true,
        'ViewTable': true,
        'CamelotStepThree': true,
        'CamelotStepFour': true,
        'videoHelp': true,
        'back-to-top': true,
        'content-guidance': true
      }
    })
  })

  it('correctly orders findings by category and then by sort', async () => {
    // Setup state
    wrapper.setData({
      list_categories: {
        options: [
          { id: null, text: 'No group' },
          { id: 'cat-b', text: 'B Category' },
          { id: 'cat-a', text: 'A Category' }
        ]
      },
      references: [],
      translatedCerqualConfidence: [
        { value: 'hc', text: 'High' },
        { value: 'mc', text: 'Moderate' },
        { value: 'lc', text: 'Low' },
        { value: 'vc', text: 'Very low' }
      ]
    })

    const mockResponse = {
      data: [
        { id: 'f1', name: 'Finding 1', sort: 1, category: 'cat-b', cerqual: { option: 0, explanation: '' } },
        { id: 'f2', name: 'Finding 2', sort: 2, category: 'cat-a', cerqual: { option: 0, explanation: '' } },
        { id: 'f3', name: 'Finding 3', sort: 3, category: 'cat-b', cerqual: { option: 0, explanation: '' } },
        { id: 'f4', name: 'Finding 4', sort: 4, category: null, cerqual: { option: 0, explanation: '' } }
      ]
    }

    // Call the method
    const processedData = await wrapper.vm.processLists(mockResponse)

    // Expected order:
    // 1. A Category (f2)
    // 2. B Category (f1)
    // 3. B Category (f3)
    // 4. Uncategorised (f4)
    
    // Check internal data sorting (this is what is returned or stored in this.lists)
    // The current implementation of processLists only sorts by sort. 
    // This test SHOULD FAIL initially because it doesn't sort by category.
    
    // We want to change the logic so that 'processedData' (which becomes this.lists)
    // reflects the category-first order.
    
    expect(processedData[0].id).toBe('f2') // From A Category
    expect(processedData[0].sort).toBe(1)
    expect(processedData[1].id).toBe('f1') // From B Category (sort 1)
    expect(processedData[1].sort).toBe(2)
    expect(processedData[2].id).toBe('f3') // From B Category (sort 3)
    expect(processedData[2].sort).toBe(3)
    expect(processedData[3].id).toBe('f4') // Uncategorised
    expect(processedData[3].sort).toBe(4)
  })
})
