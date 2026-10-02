import { shallowMount, createLocalVue } from '@vue/test-utils'
import LeaveProjectModal from '@/components/organization/modals/LeaveProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api')

describe('LeaveProjectModal.vue', () => {
  let wrapper
  let store
  const mockProject = {
    id: 'test-id',
    name: 'Test Project'
  }

  const mocks = {
    $t: (msg) => msg
  }

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: { id: 'user-123' }
      }
    })

    wrapper = shallowMount(LeaveProjectModal, {
      localVue,
      store,
      mocks,
      propsData: {
        project: mockProject
      }
    })
    wrapper.vm.$refs['unlink-project'] = { hide: jest.fn(), show: jest.fn() }
  })

  it('renders correctly', () => {
    expect(wrapper.find('b-modal-stub').attributes('title')).toBe('common.leave_project')
    expect(wrapper.text()).toContain('common.leave_project_confirm')
    expect(wrapper.text()).toContain('Test Project')
  })

  it('calls Api.post and emits "project-left" on success', async () => {
    Api.post.mockResolvedValue({ data: { status: true } })

    await wrapper.vm.leaveProject(new Event('ok'))

    expect(Api.post).toHaveBeenCalledWith('/project/test-id/unsubscribe?userId=user-123')
    expect(wrapper.emitted('project-left')).toBeTruthy()
  })

  it('handles API error gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    Api.post.mockRejectedValue(new Error('Network error'))

    await wrapper.vm.leaveProject(new Event('ok'))

    expect(Api.post).toHaveBeenCalledWith('/project/test-id/unsubscribe?userId=user-123')
    expect(wrapper.emitted('project-left')).toBeFalsy()
    consoleSpy.mockRestore()
  })

  it('emits "cancel" when cancelLeaveProject is called', () => {
    wrapper.vm.cancelLeaveProject()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})