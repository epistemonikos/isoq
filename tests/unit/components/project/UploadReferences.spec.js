
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

  describe('Import Logic', () => {
    it('correctly structures the reference object from PubMed data', () => {
      const pubmedData = {
        uid: '1111111',
        title: 'Test Title',
        authors: [{ name: 'Author A' }, { name: 'Author B' }],
        pubdate: '2024',
        issn: '1111-2222'
      }

      wrapper.vm.processPubmedData(pubmedData)
      
      const processedRef = wrapper.vm.pubmed_requested[0]
      
      expect(processedRef).toMatchObject({
        title: 'Test Title',
        database: 'PubMed',
        authors: ['Author A', 'Author B'],
        publication_year: '2024',
        isbn_issn: '1111-2222',
        organization: 'org-456',
        project_id: 'project-123',
        uid: '1111111'
      })
    })
  })
})
