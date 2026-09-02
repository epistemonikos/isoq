// El salto al tope al guardar la extracción de datos de un estudio.
//
// Síntoma reportado por un colaborador: "each time I save my data extraction for a
// study I am bumped back to the top of the page and have to scroll down to where I
// was". Y el dato que cerró el diagnóstico: "it does seem to stay in the place on
// the page when the page automatically refreshes".
//
// Esa asimetría era la pista. Los dos caminos llaman al mismo getData(), así que el
// re-render no podía ser la causa. La diferencia estaba en que sólo el guardado
// llegaba a routeAnchorHash(), que hacía un `$router.push` para escribir un hash en
// la URL. Ese push no navega a ninguna parte —mismo name, mismos params— pero
// vue-router no distingue y corre el `scrollBehavior` global de main.js, que es
// `() => ({x: 0, y: 0})`.
//
// Estos tests fijan las dos mitades del arreglo: no se navega nunca, y el scroll al
// ancla queda sólo para el deep-link entrante, una vez.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
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

function createWrapper (query = {}) {
  const $router = { push: jest.fn() }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query },
      $router,
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
  return { wrapper, $router }
}

describe('viewProject.vue — routeAnchorHash()', () => {
  let scrollIntoView
  let originalGetElementById

  beforeEach(() => {
    jest.clearAllMocks()
    scrollIntoView = jest.fn()
    originalGetElementById = document.getElementById
    document.getElementById = jest.fn(() => ({ scrollIntoView }))
  })

  afterEach(() => {
    document.getElementById = originalGetElementById
  })

  it('no navega al guardar una fila: sin hash en la URL no hace nada', async () => {
    const { wrapper, $router } = createWrapper({ tab: 'My-Data', step: '3' })
    await flushPromises()
    $router.push.mockClear()

    wrapper.vm.routeAnchorHash()
    await flushPromises()

    // Éste es el corazón del bug: cualquier push acá dispara el scrollBehavior
    // global y manda la página a y=0.
    expect($router.push).not.toHaveBeenCalled()
    expect(scrollIntoView).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('centra el finding del deep-link entrante, sin navegar', async () => {
    const { wrapper, $router } = createWrapper({ tab: 'iSoQ', hash: 'a-list1' })
    await flushPromises()
    $router.push.mockClear()
    scrollIntoView.mockClear()
    // El montaje ya consumió el flag (ver el test de abajo); lo rearmamos para
    // ejercitar el método en aislamiento.
    wrapper.vm.$_pendingAnchorScroll = true

    wrapper.vm.routeAnchorHash()
    await flushPromises()

    expect(document.getElementById).toHaveBeenCalledWith('a-list1')
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
    expect($router.push).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('el montaje consume el flag, así el deep-link se atiende una sola vez', async () => {
    const { wrapper } = createWrapper({ tab: 'iSoQ', hash: 'a-list1' })
    await flushPromises()

    expect(wrapper.vm.$_pendingAnchorScroll).toBe(false)
    wrapper.destroy()
  })

  // La trampa de esta refactorización. Antes el propio push reescribía `query` con
  // sólo `tab`, y de paso borraba `hash`, así que el scroll ocurría una vez y nunca
  // más. Sin push, `hash` se queda en la URL para siempre y cada getLists()
  // posterior —cada guardado, cada renombre de finding— volvería a arrastrar al
  // usuario hasta ese finding. Cambiaríamos un salto al tope por un salto al medio.
  it('scrollea una sola vez aunque el hash siga en la URL', async () => {
    const { wrapper } = createWrapper({ tab: 'iSoQ', hash: 'a-list1' })
    await flushPromises()
    scrollIntoView.mockClear()
    wrapper.vm.$_pendingAnchorScroll = true

    wrapper.vm.routeAnchorHash()
    await flushPromises()
    wrapper.vm.routeAnchorHash()
    wrapper.vm.routeAnchorHash()
    await flushPromises()

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('no explota si el ancla no está en el DOM', async () => {
    document.getElementById = jest.fn(() => null)
    const { wrapper } = createWrapper({ tab: 'iSoQ', hash: 'a-inexistente' })
    await flushPromises()

    expect(() => wrapper.vm.routeAnchorHash()).not.toThrow()
    await flushPromises()
    wrapper.destroy()
  })

  it('getLists() no navega: es el camino que corre en cada guardado', async () => {
    Api.get.mockResolvedValue({ data: [] })
    const { wrapper, $router } = createWrapper({ tab: 'My-Data', step: '3' })
    await flushPromises()
    $router.push.mockClear()

    wrapper.vm.getLists()
    await flushPromises()

    expect($router.push).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
