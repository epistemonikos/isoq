import { shallowMount, createLocalVue } from '@vue/test-utils'
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
    $t: (msg) => msg,
    $route: { params: { id: 'org-123' }, query: {} }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: { personal_organization: 'org-123', id: 'user-1' },
        isOnline: true
      }
    })
    router = new VueRouter()

    Api.get.mockResolvedValue({ data: [] })

    wrapper = shallowMount(ViewOrganization, {
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

  it('opens modales correctly', () => {
    wrapper.vm.$refs = {
      projectFormModal: { show: jest.fn() },
      removeProjectModal: { show: jest.fn() },
      cloneProjectModal: { show: jest.fn() },
      shareProjectModal: { show: jest.fn() },
      leaveProjectModal: { show: jest.fn() }
    }

    const mockProject = { id: 'test-1', organization: 'org-123', name: 'Test' }
    
    wrapper.vm.openModalNewFindingTable()
    expect(wrapper.vm.$refs.projectFormModal.show).toHaveBeenCalled()

    wrapper.vm.modalRemoveProject(mockProject)
    expect(wrapper.vm.$refs.removeProjectModal.show).toHaveBeenCalled()

    wrapper.vm.openCloneModal(mockProject)
    expect(wrapper.vm.$refs.cloneProjectModal.show).toHaveBeenCalled()

    wrapper.vm.openModalLeaveProject(mockProject)
    expect(wrapper.vm.$refs.leaveProjectModal.show).toHaveBeenCalled()
  })
})