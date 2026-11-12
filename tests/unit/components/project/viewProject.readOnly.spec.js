import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

// #242: quien sólo tiene `can_read` tiene que aterrizar en la tabla del iSoQ (con los
// botones a la worksheet), no en la vista de impresión. `mode` es presentación; lo que
// impide editar es `isEditing` (que exige can_write).

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  releaseRef: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function mountWithProject (project) {
  Api.get.mockImplementation((url) => {
    if (url === '/isoqf_projects/proj1') return Promise.resolve({ data: project })
    return Promise.resolve({ data: [] })
  })
  return shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'other-org', id: 7 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
}

describe('viewProject.vue — usuario de sólo lectura (#242)', () => {
  afterEach(() => {
    Api.get.mockReset()
    Api.get.mockResolvedValue({ data: [] })
  })

  it('al cargar ve la tabla del iSoQ, no la vista de impresión, y sin poder editar', async () => {
    const wrapper = mountWithProject({ id: 'proj1', name: 'P', can_write: [], can_read: [7] })
    await flushPromises()
    await wrapper.vm.$nextTick()

    const table = wrapper.find('viewtable-stub')
    expect(table.exists()).toBe(true)
    expect(table.classes()).not.toContain('d-none')
    expect(wrapper.find('printviewtable-stub').classes()).toContain('d-none')
    expect(table.attributes('canedit')).toBeUndefined()
    expect(wrapper.vm.isEditing).toBe(false)
    wrapper.destroy()
  })

  it('al cambiar de tab sigue en la tabla', async () => {
    const wrapper = mountWithProject({ id: 'proj1', name: 'P', can_write: [], can_read: [7] })
    await flushPromises()
    jest.spyOn(wrapper.vm, 'refreshPermissions').mockResolvedValue()

    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, 'iSoQ')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('viewtable-stub').classes()).not.toContain('d-none')
    wrapper.destroy()
  })

  it('quien escribe sigue aterrizando en la tabla editable (regresión)', async () => {
    const wrapper = mountWithProject({ id: 'proj1', name: 'P', can_write: [7], can_read: [] })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('viewtable-stub').classes()).not.toContain('d-none')
    expect(wrapper.vm.isEditing).toBe(true)
    wrapper.destroy()
  })
})
