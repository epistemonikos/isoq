import { shallowMount, createLocalVue } from '@vue/test-utils'
import RemoveProjectModal from '@/components/organization/modals/RemoveProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api')

describe('RemoveProjectModal.vue', () => {
  let wrapper
  const mockProject = {
    id: 'test-id',
    name: 'Test Project'
  }

  const mocks = {
    $t: (msg) => msg
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(RemoveProjectModal, {
      localVue,
      mocks,
      propsData: {
        project: mockProject
      }
    })
    wrapper.vm.$refs['modal-remove-project'] = { hide: jest.fn(), show: jest.fn() }
  })

  it('renders the correct title and message', () => {
    expect(wrapper.find('b-modal-stub').attributes('title')).toBe('common.delete_project')
    expect(wrapper.text()).toContain('common.confirm_remove_project')
    expect(wrapper.text()).toContain('Test Project')
    expect(wrapper.text()).toContain('common.and_all_data')
  })

  it('calls Api.delete and emits "project-removed" when ok is clicked and API returns success', async () => {
    Api.delete.mockResolvedValue({ data: { status: true } })
    wrapper.setData({ password: 'my-password' })

    // Trigger ok event
    await wrapper.vm.removeProject(new Event('ok'))

    expect(Api.delete).toHaveBeenCalledWith('/remove/project/test-id', { password: 'my-password' })
    expect(wrapper.emitted('project-removed')).toBeTruthy()
  })

  it('shows shared project warning and select if project is shared', async () => {
    const sharedProject = { ...mockProject, can_write: ['user-2'] }
    const usersAllowed = [{ id: 'user-2', username: 'User 2', user_can: 1 }]
    
    await wrapper.setProps({ project: sharedProject, usersAllowed })

    expect(wrapper.text()).toContain('common.delete_shared_project_warning')
    expect(wrapper.find('b-form-select-stub').exists()).toBe(true)
  })

  it('disables ok button if project is shared and no new owner is selected', async () => {
    const sharedProject = { ...mockProject, can_write: ['user-2'] }
    const usersAllowed = [{ id: 'user-2', username: 'User 2', user_can: 1 }]
    
    await wrapper.setProps({ project: sharedProject, usersAllowed })
    await wrapper.setData({ password: 'my-password' })
    
    expect(wrapper.vm.isOkDisabled).toBe(true)
    
    await wrapper.setData({ newOwner: 'user-2' })
    expect(wrapper.vm.isOkDisabled).toBe(false)
  })

  it('calls Api.delete with newOwner and password when shared project is removed', async () => {
    const sharedProject = { ...mockProject, can_write: ['user-2'] }
    const usersAllowed = [{ id: 'user-2', username: 'User 2', user_can: 1 }]
    Api.delete.mockResolvedValue({ data: { status: true } })

    await wrapper.setProps({ project: sharedProject, usersAllowed })
    await wrapper.setData({ newOwner: 'user-2', password: 'my-password' })

    await wrapper.vm.removeProject(new Event('ok'))

    expect(Api.delete).toHaveBeenCalledWith('/remove/project/test-id', {
      password: 'my-password', new_owner: 'user-2'
    })
    expect(wrapper.emitted('project-removed')).toBeTruthy()
  })

  it('handles API error and displays message', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    const errorMessage = 'Incorrect password'
    Api.delete.mockRejectedValue({
      response: { data: { message: errorMessage } }
    })
    await wrapper.setData({ password: 'my-password' })

    await wrapper.vm.removeProject(new Event('ok'))

    expect(wrapper.vm.serverError).toBe(errorMessage)
    expect(wrapper.text()).toContain(errorMessage)
    expect(wrapper.emitted('project-removed')).toBeFalsy()
    consoleSpy.mockRestore()
  })

  it('handles API response with false status and displays message', async () => {
    const errorMessage = 'Project is shared. A new owner is required.'
    Api.delete.mockResolvedValue({ data: { status: false, message: errorMessage } })
    await wrapper.setData({ password: 'my-password' })

    await wrapper.vm.removeProject(new Event('ok'))

    expect(wrapper.vm.serverError).toBe(errorMessage)
    expect(wrapper.text()).toContain(errorMessage)
    expect(wrapper.emitted('project-removed')).toBeFalsy()
  })
})