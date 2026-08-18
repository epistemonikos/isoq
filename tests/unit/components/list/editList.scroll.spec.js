// El segundo mecanismo del salto al guardar, en la worksheet del Paso 2.
//
// Acá no hay router de por medio: getList() terminaba su `.then` con un
// `window.scrollTo` incondicional al ancla `evidence-profile`, que está prácticamente
// en el tope del contenido. Ese scroll era intencional para la carga inicial (commit
// 2f0c039: aterrizar en la ficha al abrir la worksheet), pero la misma función se
// reusa como recarga post-guardado vía el evento `update-list-data` — y ahí arrastrar
// al usuario hasta la sección es exactamente el bug reportado.
//
// Aparte, el `document.getElementsByName(...)[0]` no tenía guarda de null y el ancla
// vive dentro de un `v-if="evidenceProfile.length"`: en un finding sin evidence
// profile eso es un TypeError dentro de un `.then` sin `.catch`, o sea una promesa
// rechazada en silencio que se come el resto del handler. Tres specs de este repo ya
// parcheaban `getElementsByName` justamente para no explotar.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
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
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

// El ancla real es un `<a name>` sin altura propia; lo que se usa para posicionar es
// el offsetTop de su offsetParent.
const fakeAnchor = { offsetParent: { offsetTop: 420 } }

// El `.then` de getList() dispara siete cascadas antes de decidir el scroll
// (getProject, syncOrderWithProject, getAllReferences, getFinding,
// getCharsOfStudies, getMethAssessments, getExtractedData) y ninguna devuelve su
// promesa. Se stubean para aislar lo que se está probando: la política de scroll.
// Esa falta de promesas es, de paso, la razón por la que el mixin reintenta por
// frames en vez de esperar a que la recarga termine — no hay nada que esperar.
const CASCADE = [
  'getProject', 'syncOrderWithProject', 'getAllReferences', 'getFinding',
  'getCharsOfStudies', 'getMethAssessments', 'getExtractedData'
]

function createWrapper () {
  const stubbedMethods = {}
  CASCADE.forEach((name) => { stubbedMethods[name] = jest.fn() })
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: stubbedMethods
  })
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return wrapper
}

describe('editList — scroll de la worksheet', () => {
  let wrapper
  let originalGetElementsByName
  let originalScrollTo

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    originalGetElementsByName = document.getElementsByName
    originalScrollTo = window.scrollTo
    document.getElementsByName = jest.fn(() => [fakeAnchor])
    window.scrollTo = jest.fn()
  })

  afterEach(() => {
    document.getElementsByName = originalGetElementsByName
    window.scrollTo = originalScrollTo
    if (wrapper) wrapper.destroy()
  })

  it('la carga inicial sí aterriza en el evidence profile', async () => {
    Api.get.mockResolvedValue({ data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }] })
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 420, behavior: 'smooth' })
  })

  it('las recargas siguientes sostienen la posición en vez de scrollear', async () => {
    Api.get.mockResolvedValue({ data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }] })
    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.$nextTick()

    window.scrollTo.mockClear()
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    // Esto es lo que emite el guardado del evidence profile.
    wrapper.vm.getList(true)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(hold).toHaveBeenCalled()
  })

  it('un finding sin evidence profile no rompe la carga', async () => {
    // El ancla está detrás de un v-if, así que acá no existe.
    document.getElementsByName = jest.fn(() => [])
    Api.get.mockResolvedValue({ data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }] })

    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(window.scrollTo).not.toHaveBeenCalled()
    // Lo que importa no es sólo que no tire: es que el `.then` siga corriendo. Si
    // explotara, isBusy quedaría en true para siempre y la tabla giraría sin fin.
    expect(wrapper.vm.evidence_profile_table_settings.isBusy).toBe(false)
  })

  it('tampoco rompe si el ancla existe pero no está posicionada', async () => {
    document.getElementsByName = jest.fn(() => [{ offsetParent: null }])
    Api.get.mockResolvedValue({ data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }] })

    wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(window.scrollTo).not.toHaveBeenCalled()
    expect(wrapper.vm.evidence_profile_table_settings.isBusy).toBe(false)
  })
})
