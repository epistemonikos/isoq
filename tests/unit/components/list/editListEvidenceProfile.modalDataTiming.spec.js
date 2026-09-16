/**
 * La clave de `ref_locks` que se pide al abrir el modal tiene que ser la de la sección
 * que la persona acaba de clickear.
 *
 * `editStageTwo` emite `modalDataChanged` hacia el padre y, en la MISMA tarea, llama
 * a `openModalEvidenceProfie()`. El `@show` de bootstrap-vue se emite síncrono dentro
 * de `show()`, así que el hijo lee `modalData` antes de que Vue haya propagado el prop
 * nuevo. El desfase de un tick hace que se pida el lock de la sección ANTERIOR — y
 * ninguno en la primera apertura, porque el buffer inicial de `editList` no trae
 * `type`.
 *
 * Es el caso que los specs del propio formulario no pueden ver: ahí `modalData` se
 * monta ya correcto y `onModalShow` se llama a mano. La aserción va sobre lo que sale
 * hacia el servidor —`acquireRef`— y no sobre un estado interno: el fallo que esto
 * cubre es MUDO (una clave `null` no pide ningún lock y nadie se entera), así que lo
 * único que lo delata es el camino completo.
 */
import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListEvidenceProfile from '@/components/list/editListEvidenceProfile.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

// Sólo registra con qué sección la tabla abre el modal. La resolución de la clave de
// lock a partir de eso la cubre `evidenceProfileForm.sectionLocks.spec.js` contra el
// componente real: replicarla acá sería testear el mock.
const abiertoCon = []
const FormSpy = {
  name: 'evidence-profile-form',
  props: ['modalData'],
  render: h => h('div'),
  methods: {
    openModalEvidenceProfie (section = null) {
      abiertoCon.push({ section, prop: this.modalData && this.modalData.type })
    }
  }
}

const warn = () => ({ display_warning: false })
const UI_SHAPE = {
  methodological_limitations: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  methodological_assessments: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  coherence: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  adequacy: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  relevance: { ...warn(), chars_of_studies: warn(), extracted_data: warn() },
  cerqual: { ...warn(), chars_of_studies: warn(), extracted_data: warn() }
}

function fullProfile () {
  const filled = { option: '1', explanation: 'texto', notes: '' }
  return [{
    displayNumber: 1,
    methodological_limitations: { ...filled },
    coherence: { ...filled },
    adequacy: { ...filled },
    relevance: { ...filled },
    cerqual: { ...filled },
    references: []
  }]
}

// Réplica del padre real: sostiene el buffer y lo devuelve como prop. Ahí vive el
// tick de desfase, así que el test no puede montar el hijo suelto.
const Parent = {
  components: { 'evidence-profile-table': editListEvidenceProfile },
  // Espejo del `buffer_modal_stage_two` inicial de editList.vue: las cinco secciones
  // vacías y NINGÚN `type`.
  data: () => ({
    buffer: {
      methodological_limitations: { option: null, explanation: '', notes: '' },
      coherence: { option: null, explanation: '', notes: '' },
      adequacy: { option: null, explanation: '', notes: '' },
      relevance: { option: null, explanation: '', notes: '' },
      cerqual: { option: null, explanation: '', notes: '' }
    }
  }),
  template: `
    <evidence-profile-table ref="table"
      :evidenceProfile="profile" :ui="ui" :evidenceProfileTableSettings="{ isBusy: false }"
      :references="[]" mode="edit" :list="list" :refsWithTitle="[]" :project="project"
      :permission="true" :selectOptions="[]" :levelConfidence="[]" :findings="findings"
      :methAssessments="{ items: [] }" :extractedData="{ id: 'ed1', fields: [], items: [] }"
      :showEditExtractedDataInPlace="{ display: false, item: {} }" :modalData="buffer"
      :charsOfStudies="{ items: [] }" :show="{ selected: ['ep'] }" :modePrintFieldObject="[]"
      :activeRefLocks="[]"
      @modalDataChanged="buffer = JSON.parse(JSON.stringify($event))" />`,
  computed: {
    profile: () => fullProfile(),
    ui: () => UI_SHAPE,
    list: () => ({ id: 'list1', organization: 'org1', project_id: 'proj1', cerqual: { option: null } }),
    findings: () => ({ id: 'finding1', list_id: 'list1' }),
    project: () => ({ id: 'proj1', organization: 'org1', review_question: 'q', inclusion: 'i', exclusion: 'e' })
  }
}

function createWrapper () {
  return mount(Parent, {
    localVue,
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $notify: { warning: jest.fn(), error: jest.fn(), success: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    },
    stubs: { videoHelp: true, 'evidence-profile-form': FormSpy }
  })
}

describe('editListEvidenceProfile — con qué sección abre el modal', () => {
  beforeEach(() => { abiertoCon.length = 0 })

  it('la primera apertura le pasa la sección clickeada, que el prop todavía no trae', () => {
    const wrapper = createWrapper()
    wrapper.vm.$refs.table.editStageTwo(fullProfile()[0], 'methodological-limitations')
    expect(abiertoCon[0].section).toBe('methodological-limitations')
    // El prop viene del buffer inicial de `editList`, sin `type`: confiar en él dejaba
    // la apertura SIN lock, y los demás sin ver que esa persona estaba trabajando ahí.
    expect(abiertoCon[0].prop).toBeUndefined()
    wrapper.destroy()
  })

  it('la segunda apertura no le pasa la sección anterior', async () => {
    const wrapper = createWrapper()
    wrapper.vm.$refs.table.editStageTwo(fullProfile()[0], 'methodological-limitations')
    await wrapper.vm.$nextTick()
    wrapper.vm.$refs.table.editStageTwo(fullProfile()[0], 'coherence')
    expect(abiertoCon[1].section).toBe('coherence')
    // Y así es como se veía el bug: el prop iba una sección atrasado, así que el lock
    // caía sobre la dimensión que la persona acababa de dejar.
    expect(abiertoCon[1].prop).toBe('methodological-limitations')
    wrapper.destroy()
  })
})
