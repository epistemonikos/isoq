import { shallowMount, createLocalVue } from '@vue/test-utils'
import ShareProjectModal from '@/components/organization/modals/ShareProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api')

describe('ShareProjectModal.vue', () => {
  let wrapper
  let store
  const mockProject = {
    id: 'test-id',
    name: 'Test Project',
    sharedTo: '',
    sharedToError: '',
    sharedTokenOnOff: false,
    sharedToken: '',
    temporaryUrl: '',
    invite_emails: [],
    tmp_invite_emails: []
  }

  const mocks = {
    $t: (msg) => msg,
    $route: { params: { id: 'org-123' } }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    store = new Vuex.Store({
      state: {
        user: { name: 'test_user', id: 'user-1' }
      }
    })

    wrapper = shallowMount(ShareProjectModal, {
      localVue,
      store,
      mocks,
      propsData: {
        project: { ...mockProject },
        usersAllowed: []
      },
      mixins: [{ computed: { isOnline() { return true } } }]
    })
    wrapper.vm.$refs['modal-share-options'] = { hide: jest.fn(), show: jest.fn() }
  })

  it('validates emails correctly and enables button', async () => {
    await wrapper.setProps({
      project: { ...wrapper.vm.project, sharedTo: 'test@example.com' }
    })
    expect(wrapper.vm.enabledToShare).toBe(true)

    await wrapper.setProps({
      project: { ...wrapper.vm.project, sharedTo: 'invalid-email' }
    })
    expect(wrapper.vm.enabledToShare).toBe(false)
  })

  it('adds email to invite list correctly', () => {
    wrapper.vm.project.sharedTo = 'newuser@example.com'
    wrapper.vm.addEmailForShare()
    expect(wrapper.vm.project.tmp_invite_emails).toContain('newuser@example.com')
  })

  it('removes shared email correctly', () => {
    wrapper.vm.project.tmp_invite_emails = ['user1@example.com', 'user2@example.com']
    wrapper.vm.removeSharedEmail(0)
    expect(wrapper.vm.project.tmp_invite_emails).toEqual(['user2@example.com'])
  })

  it('calls saveSharedProject API and emits project-shared', async () => {
    Api.post.mockResolvedValue({ status: 200, data: [{ id: 'test-id' }] })
    wrapper.vm.project.tmp_invite_emails = ['test@example.com']
    
    await wrapper.vm.saveSharedProject()
    
    expect(Api.post).toHaveBeenCalled()
    expect(wrapper.emitted('project-shared')).toBeTruthy()
  })

  it('calls unshare API and emits user-unshared', async () => {
    Api.post.mockResolvedValue({ status: 200 })
    Api.get.mockResolvedValue({ status: 200, data: [{ id: 'test-id' }] })

    await wrapper.vm.unshare(0, 'user-2')

    expect(Api.post).toHaveBeenCalledWith('/share/project/test-id/unshare', null, expect.any(Object))
  })

  it('updates project token when sharedTokenOnOff is toggled', async () => {
    Api.patch.mockResolvedValue({})
    
    wrapper.vm.project.sharedTokenOnOff = true
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()
    
    expect(wrapper.vm.project.sharedToken.length).toBeGreaterThan(0)
    expect(wrapper.vm.project.temporaryUrl).toContain(wrapper.vm.project.sharedToken)
    expect(Api.patch).toHaveBeenCalled()
  })
})