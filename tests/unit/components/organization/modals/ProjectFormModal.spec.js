import { shallowMount, createLocalVue } from '@vue/test-utils'
import ProjectFormModal from '@/components/organization/modals/ProjectFormModal.vue'
import LockService from '@/services/lockService'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/services/lockService')

describe('ProjectFormModal.vue', () => {
  let wrapper
  const mockProject = {
    id: 'test-id',
    name: 'Test Project'
  }

  const mocks = {
    $t: (msg) => msg,
    $store: {
      state: {
        user: { personal_organization: 'org-123' }
      }
    },
    $route: { params: { id: 'org-123' } }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ProjectFormModal, {
      localVue,
      mocks,
      propsData: {
        project: mockProject,
        canEditProject: true,
        lockedByUser: null
      }
    })
    wrapper.vm.$refs['new-project'] = { hide: jest.fn(), show: jest.fn() }
    wrapper.vm.$refs['organizationForm'] = { save: jest.fn() }
  })

  it('renders read-only mode if lockedByUser is present', async () => {
    await wrapper.setProps({ lockedByUser: 'User A', canEditProject: false })
    expect(wrapper.text()).toContain('lock.project_locked_by')
  })

  it('calls lock release on hide', () => {
    wrapper.vm.closeModalProject()
    expect(LockService.release).toHaveBeenCalled()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('emits project-saved when organizationForm emits modal-notification', () => {
    wrapper.vm.modalNotification()
    expect(wrapper.emitted('project-saved')).toBeTruthy()
  })

  it('triggers child organizationForm save when ok is clicked', () => {
    const mockEvent = { preventDefault: jest.fn() }
    wrapper.vm.save(mockEvent)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(wrapper.vm.$refs['organizationForm'].save).toHaveBeenCalled()
  })
})