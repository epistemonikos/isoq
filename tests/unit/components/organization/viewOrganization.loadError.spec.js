import { shallowMount, createLocalVue } from '@vue/test-utils'
import ViewOrganization from '@/components/organization/viewOrganization.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'
const Api = require('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } }, config: { method: 'get' } })

function createWrapper () {
  const store = new Vuex.Store({ state: { user: { personal_organization: 'org-123', id: 'user-1' }, isOnline: true } })
  return shallowMount(ViewOrganization, {
    localVue,
    store,
    mocks: { $t: (msg) => msg, $route: { params: { id: 'org-123' }, query: {} }, $router: { push: jest.fn() } },
    mixins: [{ computed: { isOnline () { return true } } }]
  })
}

// Si fallaba `/getProjects`, el workspace decía «no hay registros»: la persona creía que sus
// proyectos se habían perdido.
describe('viewOrganization.vue — no se pudo cargar no es «no tiene proyectos»', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  it('sin datos: dice que falló la carga y apaga el «no hay registros»', async () => {
    Api.get.mockImplementation(() => Promise.reject(error500()))
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    const aviso = wrapper.find('[data-test="projects-load-error"]')
    expect(aviso.exists()).toBe(true)
    expect(aviso.text()).toContain('organization.projects_load_error')
    expect(wrapper.find('#organizations').attributes('show-empty')).toBeUndefined()
    wrapper.destroy()
  })

  it('con datos viejos: avisa que pueden estar desactualizados', async () => {
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    await wrapper.setData({ projects: [{ id: 'p1', name: 'P', created_at: 1 }] })
    Api.get.mockImplementation(() => Promise.reject(error500()))
    wrapper.vm.getProjects()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="projects-load-error"]').text()).toContain('organization.projects_load_error_stale')
    wrapper.destroy()
  })

  it('Reintentar vuelve a pedir, y si sale bien el aviso se va', async () => {
    Api.get.mockImplementation(() => Promise.reject(error500()))
    const wrapper = createWrapper()
    for (let i = 0; i < 3; i++) await flushPromises()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
    wrapper.find('[data-test="projects-load-retry"]').trigger('click')
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="projects-load-error"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
