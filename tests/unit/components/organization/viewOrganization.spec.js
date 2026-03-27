import { mount, createLocalVue } from '@vue/test-utils'
import ViewOrganization from '@/components/organization/viewOrganization.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'
import VueRouter from 'vue-router'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)
localVue.use(VueRouter)

jest.mock('@/utils/Api')
jest.mock('@/services/lockService')

describe('viewOrganization.vue', () => {
  let wrapper
  let store
  let router

  const mocks = {
    $t: (msg) => msg
  }

  const createProjects = (count) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `p-${i}`,
      name: `Project ${i}`,
      description: `Description ${i}`,
      review_question: `Question ${i}`,
      author: `Author ${i}`,
      list_authors: `List Author ${i}`,
      organization: 'org-123',
      created_at: Date.now() - i * 1000,
      can_read: [],
      can_write: []
    }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: { personal_organization: 'org-123', id: 'user-1' },
        isOnline: true
      }
    })
    router = new VueRouter({
      routes: [
        { path: '/workspace/:id', name: 'viewOrganization' },
        { path: '/workspace/:org_id/isoqf/:id', name: 'viewProject' }
      ]
    })
    router.push('/workspace/org-123')

    Api.get.mockResolvedValue({ data: [] })

    wrapper = mount(ViewOrganization, {
      localVue,
      store,
      router,
      mocks,
      mixins: [{ computed: { isOnline() { return true } } }]
    })
  })

  it('renders table correctly', () => {
    expect(wrapper.find('#organizations').exists()).toBe(true)
  })

  it('fetches projects on mount', () => {
    expect(Api.get).toHaveBeenCalledWith('/getProjects')
  })

  describe('Search and Pagination', () => {
    it('does not show search input if projects <= 10', async () => {
      const projects = createProjects(10)
      Api.get.mockResolvedValue({ data: projects })
      await wrapper.vm.getProjects()
      await localVue.nextTick()
      expect(wrapper.find('#filterInput').exists()).toBe(false)
    })

    it('shows search input if projects > 10', async () => {
      const projects = createProjects(11)
      Api.get.mockResolvedValue({ data: projects })
      await wrapper.vm.getProjects()
      await localVue.nextTick()
      expect(wrapper.find('#filterInput').exists()).toBe(true)
    })

    it('filters projects by name', async () => {
      const projects = [
        { id: '1', name: 'Alpha', organization: 'org-123', can_read: [], can_write: [] },
        { id: '2', name: 'Beta', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'alpha' })
      expect(wrapper.vm.filteredProjects).toHaveLength(1)
      expect(wrapper.vm.filteredProjects[0].name).toBe('Alpha')
    })

    it('filters projects by description', async () => {
      const projects = [
        { id: '1', name: 'P1', description: 'some description', organization: 'org-123', can_read: [], can_write: [] },
        { id: '2', name: 'P2', description: 'other', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'some' })
      expect(wrapper.vm.filteredProjects).toHaveLength(1)
      expect(wrapper.vm.filteredProjects[0].name).toBe('P1')
    })

    it('filters projects by review_question', async () => {
      const projects = [
        { id: '1', name: 'P1', review_question: 'how to search?', organization: 'org-123', can_read: [], can_write: [] },
        { id: '2', name: 'P2', review_question: 'nothing', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'how' })
      expect(wrapper.vm.filteredProjects).toHaveLength(1)
      expect(wrapper.vm.filteredProjects[0].name).toBe('P1')
    })

    it('filters projects by author', async () => {
      const projects = [
        { id: '1', name: 'P1', author: 'John Doe', organization: 'org-123', can_read: [], can_write: [] },
        { id: '2', name: 'P2', author: 'Jane Smith', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'doe' })
      expect(wrapper.vm.filteredProjects).toHaveLength(1)
      expect(wrapper.vm.filteredProjects[0].name).toBe('P1')
    })

    it('filters projects by list_authors', async () => {
      const projects = [
        { id: '1', name: 'P1', list_authors: 'List Team A', organization: 'org-123', can_read: [], can_write: [] },
        { id: '2', name: 'P2', list_authors: 'Team B', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'team a' })
      expect(wrapper.vm.filteredProjects).toHaveLength(1)
      expect(wrapper.vm.filteredProjects[0].name).toBe('P1')
    })

    it('shows pagination only when projects > perPage', async () => {
      const projects = createProjects(10)
      await wrapper.setData({ projects })
      await localVue.nextTick()
      expect(wrapper.find('.pagination').exists()).toBe(false)

      const moreProjects = createProjects(11)
      await wrapper.setData({ projects: moreProjects })
      await localVue.nextTick()
      expect(wrapper.find('.pagination').exists()).toBe(true)
    })
  })
})