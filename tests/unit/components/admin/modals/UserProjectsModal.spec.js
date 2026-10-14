import { shallowMount, createLocalVue } from '@vue/test-utils'
import UserProjectsModal from '@/components/admin/modals/UserProjectsModal.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeWrapper = (user = { id: 'u1', username: 'u@x.com', first_name: 'Ana', last_name: '' }) => {
  const wrapper = shallowMount(UserProjectsModal, {
    localVue,
    propsData: { user },
    mocks: { $t: key => key },
    stubs: { 'b-modal': true, 'b-alert': true, 'b-spinner': true, 'b-table': true, 'b-badge': true }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

// Ver los proyectos de un usuario —propios y donde colabora— desde el panel. Los trae
// GET /admin/users/<id>/projects?scope=all; sin scope esa ruta devuelve sólo los propios.
describe('UserProjectsModal.vue', () => {
  beforeEach(() => jest.clearAllMocks())

  it('pide scope=all al abrirse', async () => {
    Api.get.mockResolvedValueOnce({ data: [] })
    const wrapper = makeWrapper()
    wrapper.vm.show()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/users/u1/projects', { scope: 'all' })
    expect(wrapper.vm.$refs.modal.show).toHaveBeenCalled()
  })

  it('guarda lo que devuelve el servidor', async () => {
    const projects = [{ id: 'p1', name: 'P', role: 'owner', is_public: true }]
    Api.get.mockResolvedValueOnce({ data: projects })
    const wrapper = makeWrapper()
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.vm.projects).toEqual(projects)
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('una carga que falla se dice, no se muestra como lista vacía', async () => {
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = makeWrapper()
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.vm.error).toBe('admin.error_load_projects')
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('last_update viene en milisegundos epoch y se formatea', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.formatEpochMs(null)).toBe('')
    expect(wrapper.vm.formatEpochMs(1700000000000)).toBe(new Date(1700000000000).toLocaleString())
  })
})
