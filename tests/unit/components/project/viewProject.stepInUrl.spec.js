import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

// #370: refrescar en el Paso 3 o 4 devolvía al Paso 2. Los botones de paso sólo
// cambiaban `stepStage` y nunca escribían `?step=`, así que la recarga no sabía dónde
// estaba la persona.

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

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

function createWrapper (query) {
  const $route = { params: { id: 'proj1', org_id: 'org1' }, query: { ...query } }
  const $router = {
    push: jest.fn().mockResolvedValue(),
    // Como el router real: replace cambia la ruta en el acto.
    replace: jest.fn(loc => { $route.query = { ...loc.query }; return Promise.resolve() })
  }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route,
      $router,
      $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
  return { wrapper, $router, $route }
}

describe('viewProject.vue — el paso vive en la URL (#370)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation((url) => Promise.resolve({
      data: url === '/isoqf_references' ? [{ id: 'r1', authors: [], publication_year: '2020' }] : []
    }))
  })

  it('al cambiar de paso escribe ?step= con replace, conservando el resto del query', async () => {
    const { wrapper, $router } = createWrapper({ tab: 'My-Data', step: '2' })
    await flushPromises()
    $router.replace.mockClear()

    wrapper.vm.stepStage = 2
    await wrapper.vm.$nextTick()

    expect($router.replace).toHaveBeenCalledWith({ query: { tab: 'My-Data', step: '3' } })
    expect($router.push).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('al recargar con ?step=4 queda en el Paso 4, sin pasar por el Paso 2', async () => {
    const { wrapper, $router, $route } = createWrapper({ tab: 'My-Data', step: '4' })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.stepStage).toBe(3)
    expect($route.query.step).toBe('4')
    const wroteStep2 = $router.replace.mock.calls.some(([loc]) => loc.query.step === '2')
    expect(wroteStep2).toBe(false)
    wrapper.destroy()
  })

  it('sin ?step= sigue abriendo el Paso 2', async () => {
    const { wrapper } = createWrapper({ tab: 'My-Data' })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.stepStage).toBe(1)
    wrapper.destroy()
  })

  it('no escribe nada si la URL ya dice ese paso', async () => {
    const { wrapper, $router } = createWrapper({ tab: 'My-Data', step: '3' })
    await flushPromises()
    $router.replace.mockClear()

    wrapper.vm.stepStage = 2
    await wrapper.vm.$nextTick()

    expect($router.replace).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
