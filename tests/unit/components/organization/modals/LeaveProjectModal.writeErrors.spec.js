import { shallowMount, createLocalVue } from '@vue/test-utils'
import LeaveProjectModal from '@/components/organization/modals/LeaveProjectModal.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Salir de un proyecto que falla dejaba el modal abierto sin decir nada: la persona no
// sabía si seguía teniendo acceso.
describe('LeaveProjectModal — si no se puede salir, lo dice', () => {
  it('avisa y no da por abandonado el proyecto', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = shallowMount(LeaveProjectModal, {
      localVue,
      store: new Vuex.Store({ state: { user: { id: 'user-123' } } }),
      mocks: { $t: (k) => k, $notify },
      propsData: { project: { id: 'p1', name: 'P' } }
    })
    wrapper.vm.$refs['unlink-project'] = { hide: jest.fn(), show: jest.fn() }
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/x' } }))
    wrapper.vm.leaveProject()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.leave_project_error')
    expect(wrapper.emitted('project-left')).toBeFalsy()
    expect(wrapper.emitted('processing').slice(-1)[0]).toEqual([false])
  })
})
