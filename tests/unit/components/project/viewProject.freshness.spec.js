// El listado de findings (tab iSoQ) no se enteraba de los cambios de otra persona.
//
// Reporte que originó esto: A crea dos review findings; B tiene el proyecto abierto en el
// tab "My data", pasa a "iSoQ" y no los ve. Espera 15 s, nada; tiene que recargar la
// página. Y no era un problema de tiempo: los cuatro tabs se ocultan con `d-none`, no con
// `v-if`, así que cambiar de tab no re-monta nada ni vuelve a pedir la lista. Nada, por
// ninguna vía, volvía a llamar a getLists() por un cambio ajeno.
//
// `projectFreshnessMixin` ya resuelve la mitad difícil (mira `isoqf_projects.last_update`);
// lo que faltaba era ponerlo acá, que es donde vive getLists(), y decirle cuándo NO
// refrescar: repintar la tabla debajo de un modal abierto le descarta el borrador a quien
// esté escribiendo, y deja colgados los ids que el modal capturó al abrir.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import BootstrapVue from 'bootstrap-vue'
import viewProject from '@/components/project/viewProject.vue'

jest.mock('axios')

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  getHeaders: jest.fn(() => ({}))
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

jest.mock('@/store', () => ({ store: { state: { isOnline: true } } }))
jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const LockService = require('@/services/lockService')
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper () {
  return shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
}

describe('viewProject — las dos mitades que pide el mixin de frescura', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: 1000 } })
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // Las tres, no sólo el listado: `processLists()` deriva el nombre del grupo del catálogo
  // de categorías y, vía Commons.sortFindings, el agrupamiento del que sale el NÚMERO del
  // finding. Con el catálogo viejo, una categoría recién creada por otra persona llega sin
  // nombre y su finding se ordena como si no tuviera grupo — medido en navegador: las dos
  // pantallas del mismo proyecto mostraban los findings 4 y 5 intercambiados.
  it('recargar significa releer el catálogo, las referencias y el listado', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    const getListCategories = jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    const getReferences = jest.spyOn(wrapper.vm, 'getReferences').mockResolvedValue()

    await wrapper.vm.applyProjectRefresh()

    expect(getListCategories).toHaveBeenCalled()
    expect(getReferences).toHaveBeenCalled()
    expect(getLists).toHaveBeenCalled()
  })

  // Con dos awaits de por medio, salir del proyecto a mitad de un refresco dejaba el
  // getLists() corriendo sobre una vista destruida. No existía cuando applyProjectRefresh
  // era síncrono.
  it('no recarga si la vista se destruyó mientras el refresco estaba en vuelo', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getReferences').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getListCategories').mockImplementation(async () => {
      wrapper.destroy()
    })

    await wrapper.vm.applyProjectRefresh()

    expect(getLists).not.toHaveBeenCalled()
  })

  // El watcher de `list_categories.options` también recarga el listado cuando el catálogo
  // cambia. Sin coordinarlos, un cambio ajeno de categoría pedía isoqf_lists + findings dos
  // veces — medido en navegador antes de arreglarlo.
  it('pide el listado una sola vez, aunque el catálogo haya cambiado de verdad', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getReferences').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getListCategories').mockImplementation(async () => {
      wrapper.vm.list_categories.options = [{ id: 'c1', text: 'renombrada' }]
    })
    await wrapper.setData({ initialLoad: false })
    wrapper.vm.list_categories.options = [{ id: 'c1', text: 'original' }]
    await flushPromises()
    getLists.mockClear()

    await wrapper.vm.applyProjectRefresh()
    await flushPromises()

    expect(getLists).toHaveBeenCalledTimes(1)
  })

  // Con su default `true`, getReferences reposiciona tabOpened y stepStage: un refresco de
  // fondo te sacaría del tab que estás mirando.
  it('el refresco no reposiciona el tab', async () => {
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    const getReferences = jest.spyOn(wrapper.vm, 'getReferences').mockResolvedValue()

    await wrapper.vm.applyProjectRefresh()

    expect(getReferences).toHaveBeenCalledWith(false)
  })

  // El listado se cruza con las dos dependencias, así que pedirlo antes de que resuelvan
  // lo pintaría con el catálogo viejo — el bug, otra vez, pero con más pasos.
  it('pide el listado después de que resuelvan sus dos dependencias', async () => {
    const orden = []
    jest.spyOn(wrapper.vm, 'getListCategories').mockImplementation(async () => { orden.push('cats') })
    jest.spyOn(wrapper.vm, 'getReferences').mockImplementation(async () => { orden.push('refs') })
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => { orden.push('lists') })

    await wrapper.vm.applyProjectRefresh()

    expect(orden[orden.length - 1]).toBe('lists')
    expect(orden).toContain('cats')
    expect(orden).toContain('refs')
  })

  it('sin nada abierto, la recarga puede aplicarse', () => {
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })

  // Los modales del listado viven en ViewTable, no acá, así que la señal llega por evento.
  it('un modal de ViewTable cuenta como editor abierto', () => {
    wrapper.vm.onIsoqEditorOpen(true)

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })

  // Reordenar importa especialmente: saveSortedLists escribe sort 1..N desde un clon, y un
  // refresco a mitad del arrastre dejaría fuera del guardado un finding recién creado.
  it('los modales propios de la vista también cuentan', () => {
    wrapper.vm.onProjectEditorOpen(true)

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })
})

describe('viewProject — el refresco espera a que se cierre el editor', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: 1000 } })
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('con un modal abierto, un cambio ajeno queda pendiente y no repinta', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    wrapper.vm.onIsoqEditorOpen(true)
    await wrapper.setData({ knownLastUpdate: 1000 })
    axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: 2000 } })

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.pendingRefresh).toBe(true)
    expect(getLists).not.toHaveBeenCalled()
  })

  it('al cerrar el modal se aplica el refresco pendiente, una sola vez', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true })

    wrapper.vm.onIsoqEditorOpen(false)
    await flushPromises()

    expect(getLists).toHaveBeenCalledTimes(1)
    expect(wrapper.vm.pendingRefresh).toBe(false)
  })

  it('cerrar un modal propio también lo aplica', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true })

    wrapper.vm.onProjectEditorOpen(false)
    await flushPromises()

    expect(getLists).toHaveBeenCalledTimes(1)
  })

  // El caso del reporte: nadie escribiendo, otro usuario creó findings.
  it('sin editores abiertos, un last_update nuevo recarga la lista sola', async () => {
    const getLists = jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    await wrapper.setData({ knownLastUpdate: 1000 })
    axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: 2000 } })

    await wrapper.vm.checkProjectFreshness()
    await flushPromises()

    expect(getLists).toHaveBeenCalled()
  })
})

describe('viewProject — el sondeo periódico', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: 1000 } })
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // Arranca en mounted y no al entrar al tab iSoQ: la primera lectura del mixin sólo ceba
  // knownLastUpdate sin refrescar, así que un sondeo que empezara al cambiar de tab nunca
  // detectaría nada en su primer tick — justo el caso reportado.
  it('queda sondeando desde el montaje', () => {
    expect(wrapper.vm.projectPollTimer).toBeTruthy()
  })

  // Con fake timers no se puede: jest 27 congela process.nextTick y el montaje nunca
  // resuelve. Se fija el protocolo — qué intervalo se registra y qué hace su callback.
  it('registra un tick de 15 s', () => {
    const setIntervalSpy = jest.spyOn(window, 'setInterval')
    wrapper.vm.stopProjectPolling()

    wrapper.vm.startProjectPolling()

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 15000)
    setIntervalSpy.mockRestore()
  })

  it('cada tick pregunta las dos cosas: quién tiene locks y si algo cambió', async () => {
    const setIntervalSpy = jest.spyOn(window, 'setInterval')
    wrapper.vm.stopProjectPolling()
    wrapper.vm.startProjectPolling()
    const tick = setIntervalSpy.mock.calls[0][0]
    const freshness = jest.spyOn(wrapper.vm, 'checkProjectFreshness').mockResolvedValue()
    LockService.fetchRefLocks.mockClear()

    tick()
    await flushPromises()

    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    expect(freshness).toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it('deja de sondear al destruirse la vista', () => {
    wrapper.destroy()

    expect(wrapper.vm.projectPollTimer).toBeNull()
    wrapper = null
  })
})
