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

    // Trigger ok event
    await wrapper.vm.removeProject(new Event('ok'))

    expect(Api.delete).toHaveBeenCalledWith('/remove/project/test-id')
    expect(wrapper.emitted('project-removed')).toBeTruthy()
  })

  it('handles API error without emitting project-removed', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    Api.delete.mockRejectedValue(new Error('Network error'))

    await wrapper.vm.removeProject(new Event('ok'))

    expect(Api.delete).toHaveBeenCalledWith('/remove/project/test-id')
    expect(wrapper.emitted('project-removed')).toBeFalsy()
    consoleSpy.mockRestore()
  })

  it('handles API response with false status', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
    Api.delete.mockResolvedValue({ data: { status: false, error: 'Cannot delete' } })

    await wrapper.vm.removeProject(new Event('ok'))

    expect(Api.delete).toHaveBeenCalledWith('/remove/project/test-id')
    expect(wrapper.emitted('project-removed')).toBeFalsy()
    consoleSpy.mockRestore()
  })
})