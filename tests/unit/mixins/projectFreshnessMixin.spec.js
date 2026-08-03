import { shallowMount, createLocalVue } from '@vue/test-utils'
import axios from 'axios'
import projectFreshnessMixin from '@/mixins/projectFreshnessMixin'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({ store: { state: { isOnline: true } } }))

const { store } = require('@/store')
const localVue = createLocalVue()

// Host component: the mixin only knows WHEN to refresh; each view says WHAT to reload
// and whether an editor is open.
const Host = {
  mixins: [projectFreshnessMixin],
  template: '<div />',
  data () {
    return { reloads: 0, editorOpen: false }
  },
  methods: {
    applyProjectRefresh () { this.reloads++ },
    hasOpenEditor () { return this.editorOpen }
  }
}

function createWrapper () {
  return shallowMount(Host, {
    localVue,
    mocks: { $route: { params: { id: 'proj1', org_id: 'org1' } } }
  })
}

const respondWith = (lastUpdate) => axios.get.mockResolvedValue({ data: { id: 'proj1', last_update: lastUpdate } })

// `last_update` lives on isoqf_projects and the backend stamps it on EVERY write to any
// child of the project, including the granular per-item and per-section endpoints. That
// makes it a single cheap signal for "something changed in this project".
describe('projectFreshnessMixin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    store.state.isOnline = true
  })

  it('la primera lectura sólo guarda la referencia, sin refrescar', async () => {
    respondWith(1000)
    const wrapper = createWrapper()

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.knownLastUpdate).toBe(1000)
    expect(wrapper.vm.reloads).toBe(0)
    wrapper.destroy()
  })

  it('no refresca cuando el timestamp no cambió', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.reloads).toBe(0)
    wrapper.destroy()
  })

  it('refresca cuando el timestamp avanzó', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()
    respondWith(2000)

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.reloads).toBe(1)
    expect(wrapper.vm.knownLastUpdate).toBe(2000)
    wrapper.destroy()
  })

  // Repainting a table under somebody who is typing would throw away their draft.
  it('con un editor abierto posterga el refresco en vez de pisar lo que se escribe', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()
    await wrapper.setData({ editorOpen: true })
    respondWith(2000)

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.reloads).toBe(0)
    expect(wrapper.vm.pendingRefresh).toBe(true)
    wrapper.destroy()
  })

  it('aplica el refresco postergado al cerrar el editor', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()
    await wrapper.setData({ editorOpen: true })
    respondWith(2000)
    await wrapper.vm.checkProjectFreshness()

    await wrapper.setData({ editorOpen: false })
    wrapper.vm.flushPendingRefresh()

    expect(wrapper.vm.reloads).toBe(1)
    expect(wrapper.vm.pendingRefresh).toBe(false)
    wrapper.destroy()
  })

  it('flushPendingRefresh no hace nada si no había refresco pendiente', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()

    wrapper.vm.flushPendingRefresh()

    expect(wrapper.vm.reloads).toBe(0)
    wrapper.destroy()
  })

  it('no consulta nada estando offline', async () => {
    store.state.isOnline = false
    const wrapper = createWrapper()

    await wrapper.vm.checkProjectFreshness()

    expect(axios.get).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  // Api.get caches /isoqf_projects/<id> in IndexedDB, and a cached answer could never
  // reveal a change made by somebody else.
  it('consulta por la red, no por la capa cacheada de Api', async () => {
    respondWith(1000)
    const wrapper = createWrapper()

    await wrapper.vm.checkProjectFreshness()

    expect(axios.get).toHaveBeenCalledWith(
      '/api/isoqf_projects/proj1',
      expect.objectContaining({ headers: expect.any(Object) })
    )
    wrapper.destroy()
  })

  it('un error de red no rompe ni mueve la referencia', async () => {
    respondWith(1000)
    const wrapper = createWrapper()
    await wrapper.vm.checkProjectFreshness()
    axios.get.mockRejectedValue(new Error('network'))

    await expect(wrapper.vm.checkProjectFreshness()).resolves.not.toThrow()

    expect(wrapper.vm.knownLastUpdate).toBe(1000)
    expect(wrapper.vm.reloads).toBe(0)
    wrapper.destroy()
  })

  it('acepta la respuesta envuelta en array (contrato del endpoint plano)', async () => {
    axios.get.mockResolvedValue({ data: [{ id: 'proj1', last_update: 5000 }] })
    const wrapper = createWrapper()

    await wrapper.vm.checkProjectFreshness()

    expect(wrapper.vm.knownLastUpdate).toBe(5000)
    wrapper.destroy()
  })
})
