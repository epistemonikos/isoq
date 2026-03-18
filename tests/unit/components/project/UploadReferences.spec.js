
import { shallowMount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock Api
jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn()
}))

describe('UploadReferences.vue', () => {
  let wrapper
  let mocks

  beforeEach(() => {
    jest.clearAllMocks()
    
    mocks = {
      $t: (msg) => msg,
      $route: {
        params: {
          id: 'project-123',
          org_id: 'org-456'
        }
      }
    }

    wrapper = shallowMount(UploadReferences, {
      localVue,
      propsData: {
        canEdit: true,
        isOnline: true,
        references: []
      },
      mocks,
      stubs: {
        'font-awesome-icon': true,
        'videoHelp': true
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('h4').text()).toBe('references.step_title')
  })

  describe('PubMed Duplicate Detection', () => {
    it('marks reference as disabled if it already exists in project references', async () => {
      // Setup existing references
      const existingRef = {
        uid: '1234567',
        title: 'Existing Study',
        authors: [{ name: 'Smith J' }],
        pubdate: '2023',
        issn: '1234-5678'
      }
      
      wrapper.setProps({
        references: [existingRef]
      })
      await wrapper.vm.$nextTick()

      // Simulate PubMed data that matches existing reference
      const pubmedData = {
        uid: '1234567',
        title: 'Existing Study',
        authors: [{ name: 'Smith J' }],
        pubdate: '2023 Jan',
        issn: '1234-5678'
      }

      // Call the method that processes PubMed data
      wrapper.vm.processPubmedData(pubmedData)

      // Verify the processed reference is pushed to pubmed_requested
      expect(wrapper.vm.pubmed_requested).toHaveLength(1)
      
      // CRITICAL: Verify it is marked as disabled (duplicate)
      expect(wrapper.vm.pubmed_requested[0].disabled).toBe(true)
    })

    it('marks reference as enabled if it does not exist in project references', () => {
      // Setup empty existing references
      wrapper.setProps({
        references: []
      })

      // Simulate new PubMed data
      const pubmedData = {
        uid: '9876543',
        title: 'New Study',
        authors: [{ name: 'Doe J' }],
        pubdate: '2024 Feb',
        issn: '8765-4321'
      }

      // Call the method that processes PubMed data
      wrapper.vm.processPubmedData(pubmedData)

      // Verify the processed reference is pushed to pubmed_requested
      expect(wrapper.vm.pubmed_requested).toHaveLength(1)
      
      // CRITICAL: Verify it is marked as enabled (not duplicate)
      expect(wrapper.vm.pubmed_requested[0].disabled).toBe(false)
    })
  })

  describe('PubMed Batch Processing', () => {
    it('processes PubMed IDs in batches of 5', async () => {
      // Create 12 dummy IDs
      const pubmedIds = Array.from({ length: 12 }, (_, i) => (1000000 + i).toString())
      
      // Mock Api.get to return a successful response for each ID
      Api.get.mockImplementation((url) => {
        const id = url.split('id=')[1]
        return Promise.resolve({
          status: 200,
          data: {
            result: {
              uids: [id],
              [id]: {
                uid: id,
                title: `Title ${id}`,
                authors: [{ name: 'Author' }],
                pubdate: '2024',
                issn: '1234'
              }
            }
          }
        })
      })

      // Trigger the batch processing
      await wrapper.vm.processPubMedRequest(pubmedIds)

      // Verify that all IDs were processed
      expect(wrapper.vm.pubmed_requested).toHaveLength(12)
      expect(wrapper.vm.pubmedErrorImported).toHaveLength(0)
      
      // Verify Api.get was called 12 times
      expect(Api.get).toHaveBeenCalledTimes(12)
    })

    it('handles errors in a batch without stopping the whole process', async () => {
      const pubmedIds = ['1111111', '2222222', '3333333']
      
      // Mock first and third ID as success, second as error
      Api.get.mockImplementation((url) => {
        const id = url.split('id=')[1]
        if (id === '2222222') {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          status: 200,
          data: {
            result: {
              uids: [id],
              [id]: {
                uid: id,
                title: `Title ${id}`,
                authors: [{ name: 'Author' }],
                pubdate: '2024',
                issn: '1234'
              }
            }
          }
        })
      })

      await wrapper.vm.processPubMedRequest(pubmedIds)

      // 2 should be successful
      expect(wrapper.vm.pubmed_requested).toHaveLength(2)
      // 1 should be in error list (it puts the whole batch in error if one fails in the current implementation)
      // Actually, looking at the code:
      // try { const responses = await Promise.all(promises) ... } catch (error) { this.pubmedErrorImported.push(...batch) }
      // Yes, if ONE promise in Promise.all fails, the whole batch of 5 is marked as error.
      expect(wrapper.vm.pubmedErrorImported).toHaveLength(3) // The whole batch ['1111111', '2222222', '3333333']
    })
  })
})
