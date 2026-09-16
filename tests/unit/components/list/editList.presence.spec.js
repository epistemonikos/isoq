// La worksheet marca presencia al entrar y la suelta al salir. Es el ÚNICO punto de
// alta: los editores (dimensión, nombre, referencias, borrado) ya sostienen un lock
// real que el listado lee, así que marcarles presencia además los nombraría dos veces.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import PresenceService from '@/services/presenceService'
import editList from '@/components/list/editList.vue'
import Api from '@/utils/Api'

jest.mock('@/services/presenceService', () => ({
  enter: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  fetch: jest.fn().mockResolvedValue([])
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
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

describe('editList — presencia', () => {
  beforeEach(() => {
    PresenceService.enter.mockClear()
    PresenceService.leave.mockClear()
    PresenceService.fetch.mockResolvedValue([])
  })

  it('entra al hallazgo con el project_id de la LISTA, no el de la ruta', async () => {
    // En `/worksheet/:id/edit` el `:id` es el de la list. El project_id sólo existe
    // tras getList(), y por eso el alta va ahí y no en mounted.
    const vm = {
      list: { project_id: 'p1' },
      findings: { id: 'f1' },
      enterPresence: editList.methods.enterPresence
    }

    await vm.enterPresence()

    expect(PresenceService.enter).toHaveBeenCalledWith('p1', 'f1')
  })

  it('sin finding todavía no marca nada', async () => {
    const vm = {
      list: { project_id: 'p1' },
      findings: null,
      enterPresence: editList.methods.enterPresence
    }

    await vm.enterPresence()

    expect(PresenceService.enter).not.toHaveBeenCalled()
  })

  it('el sondeo de la worksheet trae también la presencia', async () => {
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])
    const vm = {
      $_alive: true,
      list: { project_id: 'p1' },
      activePresence: [],
      fetchPresence: editList.methods.fetchPresence
    }

    await vm.fetchPresence()

    expect(vm.activePresence).toHaveLength(1)
  })

  it('un sondeo que llega tras destruir la vista no escribe', async () => {
    // Misma guarda `$_alive` que ya usa fetchAndUpdateRefLocks: salir a mitad de un
    // sondeo dejaba la promesa corriendo sobre un componente destruido.
    const vm = {
      $_alive: false,
      list: { project_id: 'p1' },
      activePresence: [],
      fetchPresence: editList.methods.fetchPresence
    }
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])

    await vm.fetchPresence()

    expect(vm.activePresence).toEqual([])
  })

  it('el aviso nombra a los OTROS, nunca a uno mismo', () => {
    const vm = {
      activePresence: [
        { finding_id: 'f1', user_id: 'u-yo', user_name: 'Yo Mismo' },
        { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
      ],
      foreignRefLocks: [],
      findings: { id: 'f1' },
      currentUserId: 'u-yo',
      $t: (key, params) => key === 'presence.reviewing_one'
        ? `${params.users} está revisando este hallazgo` : key,
      presenceNotice: editList.computed.presenceNotice
    }

    expect(vm.presenceNotice.call(vm)).toBe('Ana Soto está revisando este hallazgo')
  })
})

describe('editList — el aviso de presencia no se imprime', () => {
  // "Ana Soto is reviewing this finding" impreso en un worksheet exportado es ruido
  // en un documento citable, igual que #progress-status (su hermano inmediato en el
  // template) ya tiene `d-print-none`.
  const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

  it('el b-alert de presencia lleva la clase d-print-none', async () => {
    // Mismo aislamiento que editList.scroll.spec.js: getList() dispara siete
    // cascadas sin promesa propia (getProject, syncOrderWithProject,
    // getAllReferences, getFinding, getCharsOfStudies, getMethAssessments,
    // getExtractedData); se stubean para no ejercitarlas — lo que se prueba acá
    // es sólo la clase del aviso de presencia.
    const CASCADE = [
      'getProject', 'syncOrderWithProject', 'getAllReferences', 'getFinding',
      'getCharsOfStudies', 'getMethAssessments', 'getExtractedData'
    ]
    const stubbedMethods = {}
    CASCADE.forEach((name) => { stubbedMethods[name] = jest.fn() })

    Api.get.mockResolvedValue({
      data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }]
    })
    const wrapper = shallowMount(editList, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'list1' } },
        $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
      },
      stubs: {
        'edit-header-list': true, 'edit-list-actions-buttons': true,
        'evidence-profile-table': true, 'table-chars-of-studies': true,
        'table-meth-assessments': true, 'table-extracted-data': true,
        'font-awesome-icon': true
      },
      methods: stubbedMethods,
      computed: {
        presenceNotice: () => 'Ana Soto está revisando este hallazgo'
      }
    })
    await flushPromises()
    await wrapper.vm.$nextTick()

    const aviso = wrapper.find('[data-testid="worksheet-presence"]')
    expect(aviso.exists()).toBe(true)
    expect(aviso.classes()).toContain('d-print-none')

    wrapper.destroy()
  })
})

describe('editList — un solo GET de presencia por carga', () => {
  // fetchPresence() se llamaba dos veces por getList(): una directa al final de su
  // `.then`, y otra encadenada al final de fetchAndUpdateRefLocks() (que getList()
  // también dispara). Dos GET /api/presence idénticos por carga, y otra vez por
  // cada recarga de refreshIfSomebodyReleased(). Sólo debe quedar la encadenada.
  const CASCADE = [
    'getProject', 'syncOrderWithProject', 'getAllReferences', 'getFinding',
    'getCharsOfStudies', 'getMethAssessments', 'getExtractedData'
  ]
  // Mismos microtasks reales que editList.refLocks.spec.js: fetchAndUpdateRefLocks
  // arranca con Promise.resolve().then(...) y encadena fetchPresence() al final,
  // así que hacen falta varias vueltas de microtask, no un solo await.
  const flushMicrotasks = async () => {
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
  }

  function createWrapper () {
    const stubbedMethods = {}
    CASCADE.forEach((name) => { stubbedMethods[name] = jest.fn() })
    return shallowMount(editList, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'list1' } },
        $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
      },
      stubs: {
        'edit-header-list': true, 'edit-list-actions-buttons': true,
        'evidence-profile-table': true, 'table-chars-of-studies': true,
        'table-meth-assessments': true, 'table-extracted-data': true,
        'font-awesome-icon': true
      },
      methods: stubbedMethods
    })
  }

  beforeEach(() => {
    PresenceService.fetch.mockClear()
    PresenceService.enter.mockClear()
    Api.get.mockResolvedValue({
      data: [{ id: 'list1', organization: 'org1', project_id: 'proj1', references: [], cerqual: { option: null } }]
    })
  })

  it('getList() pide la presencia una sola vez', async () => {
    const wrapper = createWrapper()
    // mounted() ya dispara un getList(); espera esa carga inicial y limpia el
    // contador antes de ejercitar la que de verdad importa para este test.
    await flushMicrotasks()
    await wrapper.vm.$nextTick()
    PresenceService.fetch.mockClear()

    wrapper.vm.getList()
    await flushMicrotasks()
    await wrapper.vm.$nextTick()

    expect(PresenceService.fetch).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
