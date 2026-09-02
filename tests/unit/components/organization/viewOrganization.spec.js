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

    it('shows "no results for" message when search returns no matches', async () => {
      const projects = [
        { id: '1', name: 'Alpha', organization: 'org-123', can_read: [], can_write: [] }
      ]
      await wrapper.setData({ projects })
      await wrapper.setData({ searchQuery: 'Non-existent' })
      await localVue.nextTick()

      const table = wrapper.find('#organizations')
      expect(table.text()).toContain('common.no_results_for')
    })
  })

  describe('processProject - backend permission booleans', () => {
    it('trusts backend is_owner/allow_to_write/allow_to_read when present, even if they contradict local computation', () => {
      // El proyecto pertenece a la organización personal del usuario (localmente sería owner),
      // pero el backend manda lo contrario a propósito para probar que NO se recalcula por encima
      const project = {
        id: 'p-1',
        organization: 'org-123', // coincide con personal_organization del usuario
        can_read: [],
        can_write: [],
        is_owner: false,
        allow_to_write: false,
        allow_to_read: true
      }
      const result = wrapper.vm.processProject(project)
      expect(result.is_owner).toBe(false)
      expect(result.allow_to_write).toBe(false)
      expect(result.allow_to_read).toBe(true)
    })

    it('falls back to local computation for owner project when backend booleans are absent (simulating stale offline cache)', () => {
      const project = {
        id: 'p-2',
        organization: 'org-123', // = personal_organization del usuario → debería ser owner
        can_read: [],
        can_write: []
        // is_owner/allow_to_write/allow_to_read ausentes
      }
      const result = wrapper.vm.processProject(project)
      expect(result.is_owner).toBe(true)
      expect(result.allow_to_write).toBe(true)
      expect(result.allow_to_read).toBe(true)
    })

    it('falls back to local computation for shared (non-owner, read-only) project when backend booleans are absent', () => {
      const project = {
        id: 'p-3',
        organization: 'other-org',
        can_read: ['user-1'],
        can_write: []
      }
      const result = wrapper.vm.processProject(project)
      expect(result.is_owner).toBe(false)
      expect(result.allow_to_write).toBe(false)
      expect(result.allow_to_read).toBe(true)
    })

    it('still defaults can_write/can_read to empty arrays when absent, independent of backend booleans', () => {
      const project = {
        id: 'p-4',
        organization: 'org-123',
        is_owner: true,
        allow_to_write: true,
        allow_to_read: true
        // can_write/can_read ausentes por completo
      }
      const result = wrapper.vm.processProject(project)
      expect(result.can_write).toEqual([])
      expect(result.can_read).toEqual([])
    })

    it('allows access to shared project via can_read/can_write even when backend booleans are absent (permission gate unaffected)', () => {
      const project = {
        id: 'p-5',
        organization: 'other-org',
        can_read: [],
        can_write: ['user-1']
      }
      const result = wrapper.vm.processProject(project)
      expect(result).not.toEqual({}) // no debe ser rechazado por el gate de acceso
      expect(result.allow_to_write).toBe(true)
    })

    it('rejects (returns {}) a project the user has no access to, regardless of backend booleans presence', () => {
      const project = {
        id: 'p-6',
        organization: 'other-org',
        can_read: [],
        can_write: [],
        is_owner: false,
        allow_to_write: false,
        allow_to_read: false
      }
      const result = wrapper.vm.processProject(project)
      expect(result).toEqual({})
    })

    // /getProjects ya filtra por permisos (project_service.py:288-293): todo lo
    // que llega es visible. Recalcular el filtro en el cliente sólo puede QUITAR
    // proyectos — si el backend amplía la regla de acceso, esta copia los
    // esconde y el síntoma es "me compartieron un proyecto y no lo veo".
    it('no oculta un proyecto que el backend autorizó por una regla que el cliente no conoce', () => {
      const project = {
        id: 'p-7',
        organization: 'other-org',
        can_read: [],
        can_write: [],
        is_owner: false,
        allow_to_write: false,
        allow_to_read: true
      }
      expect(wrapper.vm.processProject(project).id).toBe('p-7')
    })
  })

  describe('usersCanList - Fase 2 (eliminar N+1)', () => {
    beforeEach(() => {
      wrapper.vm.buffer_project = {
        id: 'proj-123',
        can_read_users: [
          {
            id: 'charlie_id',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            username: 'charlie_b',
            first_name: 'Charlie',
            last_name: 'Brown',
            status: 'active'
          }
        ],
        can_write_users: [
          {
            id: 'alice_id',
            name: 'Alice Smith',
            email: 'alice@example.com',
            username: 'alice_s',
            first_name: 'Alice',
            last_name: 'Smith',
            status: 'active'
          },
          {
            id: 'bob_id',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            username: 'bob_j',
            first_name: 'Bob',
            last_name: 'Johnson',
            status: 'inactive'
          }
        ]
      }
    })

    it('populates usersAllowed from can_read_users and can_write_users without N+1 requests', () => {
      wrapper.vm.usersCanList('proj-123')
      expect(wrapper.vm.users_allowed).toHaveLength(3)
      expect(wrapper.vm.users_allowed.some(u => u.id === 'charlie_id')).toBe(true)
      expect(wrapper.vm.users_allowed.some(u => u.id === 'alice_id')).toBe(true)
      expect(wrapper.vm.users_allowed.some(u => u.id === 'bob_id')).toBe(true)
    })

    it('assigns user_can=0 for can_read_users and user_can=1 for can_write_users', () => {
      wrapper.vm.usersCanList('proj-123')
      const charlie = wrapper.vm.users_allowed.find(u => u.id === 'charlie_id')
      const alice = wrapper.vm.users_allowed.find(u => u.id === 'alice_id')
      expect(charlie.user_can).toBe(0)
      expect(alice.user_can).toBe(1)
    })

    it('assigns project_id to each user', () => {
      wrapper.vm.usersCanList('proj-123')
      wrapper.vm.users_allowed.forEach(user => {
        expect(user.project_id).toBe('proj-123')
      })
    })

    it('filters out current user from usersAllowed', () => {
      wrapper.vm.buffer_project.can_read_users.push({
        id: 'user-1', // current user
        name: 'Current User',
        email: 'current@example.com',
        username: 'current_user',
        first_name: 'Current',
        last_name: 'User',
        status: 'active'
      })
      wrapper.vm.usersCanList('proj-123')
      expect(wrapper.vm.users_allowed.some(u => u.id === 'user-1')).toBe(false)
    })

    it('handles missing can_read_users gracefully (empty or absent)', () => {
      wrapper.vm.buffer_project.can_read_users = []
      wrapper.vm.usersCanList('proj-123')
      // should still have can_write users
      expect(wrapper.vm.users_allowed.length).toBeGreaterThan(0)
    })

    it('handles missing can_write_users gracefully (empty or absent)', () => {
      wrapper.vm.buffer_project.can_write_users = []
      wrapper.vm.usersCanList('proj-123')
      // should still have can_read users
      expect(wrapper.vm.users_allowed.some(u => u.id === 'charlie_id')).toBe(true)
    })

    it('deduplicates users that appear in both can_read_users and can_write_users (prefers can_write)', () => {
      // Scenario: backend devuelve un usuario en ambos arrays (data corruption edge case)
      wrapper.vm.buffer_project.can_read_users = [
        {
          id: 'shared_user_id',
          name: 'Shared User',
          email: 'shared@example.com',
          username: 'shared_u',
          first_name: 'Shared',
          last_name: 'User',
          status: 'active'
        }
      ]
      wrapper.vm.buffer_project.can_write_users = [
        {
          id: 'shared_user_id',
          name: 'Shared User',
          email: 'shared@example.com',
          username: 'shared_u',
          first_name: 'Shared',
          last_name: 'User',
          status: 'active'
        }
      ]
      wrapper.vm.usersCanList('proj-123')
      // Should have only one entry, with user_can = 1 (write takes precedence)
      const duplicates = wrapper.vm.users_allowed.filter(u => u.id === 'shared_user_id')
      expect(duplicates).toHaveLength(1)
      expect(duplicates[0].user_can).toBe(1) // write takes precedence
    })
  })
})