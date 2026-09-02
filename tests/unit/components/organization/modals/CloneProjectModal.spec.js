import { shallowMount, createLocalVue } from '@vue/test-utils'
import CloneProjectModal from '@/components/organization/modals/CloneProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api')

describe('CloneProjectModal.vue', () => {
  let wrapper
  const mockProject = {
    id: 'test-id',
    name: 'Test Project'
  }

  const mocks = {
    $t: (msg) => msg,
    $route: { params: { id: 'org-123' } }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(CloneProjectModal, {
      localVue,
      mocks,
      propsData: {
        project: mockProject,
        uiCopy: {
          project: false,
          lists: false,
          references: false,
          findings: false,
          replaceReferences: false,
          copyOf: false,
          referencesTable: false,
          showWarning: null,
          disableCloneModalBtn: false
        }
      }
    })
    wrapper.vm.$refs['clone-modal'] = { hide: jest.fn(), show: jest.fn() }
  })

  it('renders instructions initially', () => {
    expect(wrapper.text()).toContain('common.duplicate_instruction_1')
    expect(wrapper.text()).toContain('Test Project')
  })

  it('disables buttons when copying', async () => {
    await wrapper.setProps({
      uiCopy: { ...wrapper.vm.uiCopy, project: true }
    })
    expect(wrapper.vm.isCopying).toBe(true)
  })

  it('shows loading spinner when showWarning and some copy state is true', async () => {
    await wrapper.setProps({
      uiCopy: { ...wrapper.vm.uiCopy, project: true, showWarning: true }
    })
    expect(wrapper.find('b-spinner-stub').exists()).toBe(true)
  })

  it('calls API and emits events on clone', async () => {
    Api.get.mockResolvedValue({})
    
    // Simulate OK event
    await wrapper.vm.startCloning(new Event('ok'))
    
    expect(wrapper.emitted('clone-started')).toBeTruthy()
    expect(Api.get).toHaveBeenCalledWith('/clone/project/test-id/org/org-123')
    expect(wrapper.emitted('project-cloned')).toBeTruthy()
  })
})