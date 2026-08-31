import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

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
  parseReference: jest.fn((ref) => `Author-${ref.id || ''}`),
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

function createWrapper () {
  return shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
}

// ─── processExtractedData ────────────────────────────────────────────────────

describe('editList.vue — processExtractedData()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({ list: { references: ['r1', 'r2'], fullreferences: [] } })
  })

  afterEach(() => wrapper.destroy())

  it('does not change extracted_data when array is empty', () => {
    const before = wrapper.vm.extracted_data
    wrapper.vm.processExtractedData([])
    expect(wrapper.vm.extracted_data).toBe(before)
  })

  it('filters items to only those whose ref_id is in list.references', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'Smith', column_0: 'data' },
        { ref_id: 'r3', authors: 'Jones', column_0: 'data' }  // r3 not in references
      ]
    }])
    const ids = wrapper.vm.extracted_data.items.map(i => i.ref_id)
    expect(ids).toContain('r1')
    expect(ids).not.toContain('r3')
  })

  // Un estudio sin fila en el documento no aparecía en la tabla, y como el editor de datos
  // extraídos trabaja por índice sobre esa lista y no tiene «agregar fila», el estudio
  // quedaba sin ninguna forma de capturar datos. La fila se deriva de las referencias, que
  // es el patrón que el resto de las tablas ya usa.
  it('deriva la fila de un estudio que no la tiene en el documento', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'Smith', column_0: 'data' }]
    }])

    const ids = wrapper.vm.extracted_data.items.map(i => i.ref_id)
    expect(ids).toEqual(expect.arrayContaining(['r1', 'r2']))
    const derivada = wrapper.vm.extracted_data.items.find(i => i.ref_id === 'r2')
    expect(derivada.column_0).toBe('')
  })

  // Acá muere o sobrevive el `_v` de TODA la tabla de datos extraídos: los tres sitios que
  // la escriben reciben estas filas por prop. Si la reconstrucción las deja sin contador, el
  // servidor acepta sus PATCH por compatibilidad y deja de comprobar la frescura — sin 409 y
  // sin cartel. Lo que se comprueba es que el camino no lo descarte.
  it('conserva el contador de versión de la fila que el documento sí tiene', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'Smith', column_0: 'data', _v: 5 }]
    }])

    const guardada = wrapper.vm.extracted_data.items.find(i => i.ref_id === 'r1')
    expect(guardada._v).toBe(5)
  })

  // La derivada nunca se escribió, así que no tiene versión que conservar — y no hay que
  // inventarle una: el servidor rechaza con 400 un `_v` que no sea entero, y un 0 de relleno
  // sería una versión falsa sobre una fila que el documento no tiene.
  it('no le inventa un contador a la fila derivada', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'Smith', column_0: 'data', _v: 5 }]
    }])

    const derivada = wrapper.vm.extracted_data.items.find(i => i.ref_id === 'r2')
    expect('_v' in derivada).toBe(false)
  })

  // Y tiene que quedar en el array que el editor indexa, o abrirla escribiría en otra fila.
  it('la fila derivada es direccionable por su índice', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'Smith', column_0: 'data' }]
    }])

    const derivada = wrapper.vm.extracted_data.items.find(i => i.ref_id === 'r2')
    expect(wrapper.vm.extracted_data.items[derivada.index].ref_id).toBe('r2')
  })

  // El aviso de datos incompletos tiene que contarla: es una fila sin datos.
  it('la fila derivada cuenta para el aviso de datos incompletos', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'A', column_0: 'filled' }]
    }])

    expect(wrapper.vm.ui.coherence.display_warning).toBe(true)
  })

  it('sets all display_warning to false when all column_0 are filled', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'A', column_0: 'filled' },
        { ref_id: 'r2', authors: 'B', column_0: 'filled' }
      ]
    }])
    expect(wrapper.vm.ui.coherence.display_warning).toBe(false)
    expect(wrapper.vm.ui.methodological_assessments.extracted_data.display_warning).toBe(false)
    expect(wrapper.vm.ui.adequacy.extracted_data.display_warning).toBe(false)
  })

  it('sets all display_warning to true when some column_0 are empty', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [
        { ref_id: 'r1', authors: 'A', column_0: '' },
        { ref_id: 'r2', authors: 'B', column_0: 'filled' }
      ]
    }])
    expect(wrapper.vm.ui.coherence.display_warning).toBe(true)
    expect(wrapper.vm.ui.methodological_assessments.extracted_data.display_warning).toBe(true)
    expect(wrapper.vm.ui.adequacy.extracted_data.display_warning).toBe(true)
  })

  it('builds fieldsObj excluding ref_id', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }, { key: 'actions' }],
      items: []
    }])
    const keys = wrapper.vm.extracted_data.fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).toContain('column_0')
  })

  it('builds mode_print_fieldsObj excluding ref_id and actions', () => {
    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }, { key: 'actions' }],
      items: []
    }])
    const keys = wrapper.vm.mode_print_fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).not.toContain('actions')
    expect(keys).toContain('column_0')
  })
})

// ─── getStatus ───────────────────────────────────────────────────────────────

describe('editList.vue — getStatus()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('value=0 and variant="danger" when all options are null', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: null },
        coherence: { option: null },
        adequacy: { option: null },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(0)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('danger')
  })

  it('value=40 and variant="danger" when 2 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 1 },
        coherence: { option: 2 },
        adequacy: { option: null },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(40)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('danger')
  })

  it('value=60 and variant="warning" when 3 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 1 },
        coherence: { option: 2 },
        adequacy: { option: 0 },
        relevance: { option: null },
        cerqual: { option: null }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(60)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('warning')
  })

  it('value=100 and variant="success" when all 5 domains are set', async () => {
    await wrapper.setData({
      evidence_profile: [{
        methodological_limitations: { option: 0 },
        coherence: { option: 1 },
        adequacy: { option: 2 },
        relevance: { option: 3 },
        cerqual: { option: 0 }
      }]
    })
    wrapper.vm.getStatus()
    expect(wrapper.vm.status_evidence_profile.value).toBe(100)
    expect(wrapper.vm.status_evidence_profile.variant).toBe('success')
  })

  it('each domain contributes exactly 20 to the value', async () => {
    for (let count = 1; count <= 5; count++) {
      const domains = ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']
      const ep = {}
      domains.forEach((d, i) => { ep[d] = { option: i < count ? 0 : null } })
      await wrapper.setData({ evidence_profile: [ep] })
      wrapper.vm.getStatus()
      expect(wrapper.vm.status_evidence_profile.value).toBe(count * 20)
    }
  })
})

// ─── getFinding ──────────────────────────────────────────────────────────────

describe('editList.vue — getFinding()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    // Ya no hay `updateMyData` que silenciar: la siembra por PATCH de documento completo se
    // eliminó y las filas faltantes se derivan al mostrar.
    jest.spyOn(wrapper.vm, 'getStatus').mockImplementation(() => {})
  })

  afterEach(() => wrapper.destroy())

  it('does not modify findings when list.findings is empty', async () => {
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings).toBeNull()
  })

  it('sets findings from the first item in list.findings', async () => {
    const finding = {
      id: 'f1',
      evidence_profile: {
        methodological_limitations: { option: null, explanation: '' },
        coherence: { option: null, explanation: '' },
        adequacy: { option: null, explanation: '' },
        relevance: { option: null, explanation: '' },
        cerqual: { option: null, explanation: '' },
        references: []
      }
    }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 3, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings.id).toBe('f1')
  })

  it('sets findings.displayNumber to list.displayNumber', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 99, displayNumber: 7, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.findings.displayNumber).toBe(7)
  })

  it('sets evidence_profile[0].displayNumber to list.displayNumber', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 99, displayNumber: 4, references: [] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.evidence_profile[0].displayNumber).toBe(4)
  })

  it('syncs evidence_profile[0].references from list.references', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [finding], sort: 1, references: ['r1', 'r2'] } })
    wrapper.vm.getFinding()
    expect(wrapper.vm.evidence_profile[0].references).toEqual(['r1', 'r2'])
  })

  it('restores buffer_modal_stage_two title and type when fromModal=true', async () => {
    const finding = { id: 'f1', evidence_profile: { methodological_limitations: { option: null, explanation: '' }, coherence: { option: null, explanation: '' }, adequacy: { option: null, explanation: '' }, relevance: { option: null, explanation: '' }, cerqual: { option: null, explanation: '' }, references: [] } }
    await wrapper.setData({
      list: { ...wrapper.vm.list, findings: [finding], sort: 1, references: [] },
      buffer_modal_stage_two: { ...wrapper.vm.buffer_modal_stage_two, title: 'My Title', type: 'adequacy' }
    })
    wrapper.vm.getFinding(true)
    expect(wrapper.vm.buffer_modal_stage_two.title).toBe('My Title')
    expect(wrapper.vm.buffer_modal_stage_two.type).toBe('adequacy')
  })

  it('always calls getStatus', async () => {
    const getStatusSpy = jest.spyOn(wrapper.vm, 'getStatus').mockImplementation(() => {})
    await wrapper.setData({ list: { ...wrapper.vm.list, findings: [], sort: 1, references: [] } })
    wrapper.vm.getFinding()
    expect(getStatusSpy).toHaveBeenCalled()
  })
})

// ─── getProject ──────────────────────────────────────────────────────────────

describe('editList.vue — getProject()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('copies list.project into this.project', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'proj1', name: 'My Project', use_camelot: true } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.id).toBe('proj1')
    expect(wrapper.vm.project.use_camelot).toBe(true)
  })

  it('adds inclusion="" when project does not have it', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', exclusion: 'E' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.inclusion).toBe('')
  })

  it('adds exclusion="" when project does not have it', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', inclusion: 'I' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.exclusion).toBe('')
  })

  it('preserves existing inclusion and exclusion values', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, project: { id: 'p1', inclusion: 'Adults', exclusion: 'Children' } }
    })
    wrapper.vm.getProject()
    expect(wrapper.vm.project.inclusion).toBe('Adults')
    expect(wrapper.vm.project.exclusion).toBe('Children')
  })
})

// ─── getCharsOfStudies ───────────────────────────────────────────────────────

describe('editList.vue — getCharsOfStudies()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      project: { use_camelot: false },
      list: { ...wrapper.vm.list, references: [], characteristics: [] }
    })
  })

  afterEach(() => wrapper.destroy())

  it('uses empty data when list.characteristics is empty', () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.characteristics_studies.items).toEqual([])
    expect(wrapper.vm.characteristics_studies.fields).toEqual([])
  })

  it('sets display_warning=true when fields.length < 3 (non-Camelot)', () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies() // characteristics is [], so fields=[] (length 0 < 3)
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
    expect(wrapper.vm.ui.relevance.chars_of_studies.display_warning).toBe(true)
  })

  it('sets display_warning=false when fields >= 3 and haveContent=0', async () => {
    await wrapper.setData({
      list: {
        ...wrapper.vm.list,
        references: [],
        characteristics: [{
          fields: [{ key: 'ref_id' }, { key: 'col_0' }, { key: 'col_1' }, { key: 'actions' }],
          items: []
        }]
      }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(false)
  })

  it('sets display_warning=true when haveContent > 0 regardless of fields count', async () => {
    await wrapper.setData({
      list: {
        ...wrapper.vm.list,
        references: [],
        characteristics: [{
          fields: [{ key: 'ref_id' }, { key: 'col_0' }, { key: 'col_1' }, { key: 'actions' }],
          items: []
        }]
      }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 2 })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning).toBe(true)
  })

  it('sets the same warning value on both adequacy and relevance', async () => {
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], characteristics: [{ fields: [{ key: 'ref_id' }, { key: 'c0' }, { key: 'c1' }, { key: 'c2' }], items: [] }] }
    })
    wrapper.vm.getCharsOfStudies()
    expect(wrapper.vm.ui.adequacy.chars_of_studies.display_warning)
      .toBe(wrapper.vm.ui.relevance.chars_of_studies.display_warning)
  })
})

// ─── getMethAssessments ──────────────────────────────────────────────────────

describe('editList.vue — getMethAssessments()', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      project: { use_camelot: false },
      list: { ...wrapper.vm.list, references: [], assessments: [] }
    })
  })

  afterEach(() => wrapper.destroy())

  it('sets display_warning=false when haveContent=0 and fields>=3', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'q0' }, { key: 'q1' }, { key: 'actions' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getMethAssessments()
    expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(false)
  })

  it('sets display_warning=true when haveContent > 0', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'q0' }, { key: 'q1' }, { key: 'actions' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 1 })
    wrapper.vm.getMethAssessments()
    expect(wrapper.vm.ui.methodological_assessments.display_warning).toBe(true)
  })

  it('builds fieldsObj excluding ref_id', async () => {
    await wrapper.setData({
      list: { ...wrapper.vm.list, references: [], assessments: [{ fields: [{ key: 'ref_id' }, { key: 'question_1' }], items: [] }] }
    })
    jest.spyOn(wrapper.vm, 'filterItemsByReferences').mockReturnValue({ filteredItems: [], haveContent: 0 })
    wrapper.vm.getMethAssessments()
    const keys = wrapper.vm.meth_assessments.fieldsObj.map(f => f.key)
    expect(keys).not.toContain('ref_id')
    expect(keys).toContain('question_1')
  })
})
// `updateMyData` sembraba las filas faltantes de datos extraídos con un PATCH del documento
// completo: la ruta que pisa la edición ajena y que el servidor va a cerrar. Ahora
// `processExtractedData` las deriva al mostrar, así que no hay nada que escribir — y de paso
// se corrige que aquella siembra guardaba la cita completa en `authors` en vez del autor-año.
describe('editList.vue — la siembra de datos extraídos dejó de escribir', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await wrapper.setData({
      list: { references: ['r1', 'r2'], fullreferences: [] },
      findings: { id: 'f1' },
      references: [{ id: 'r1', content: 'Uno' }, { id: 'r2', content: 'Dos' }]
    })
  })

  afterEach(() => wrapper.destroy())

  it('completar la tabla no escribe el documento', async () => {
    Api.patch.mockClear()

    wrapper.vm.processExtractedData([{
      id: 'ed1',
      fields: [{ key: 'ref_id' }, { key: 'column_0' }],
      items: [{ ref_id: 'r1', authors: 'Uno', column_0: 'x' }]
    }])
    await new Promise(resolve => process.nextTick(resolve))

    // La fila de r2 aparece derivada, y ninguna escritura salió para que exista.
    expect(wrapper.vm.extracted_data.items.map(i => i.ref_id)).toContain('r2')
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('ya no existe la función que sembraba por documento completo', () => {
    expect(wrapper.vm.updateMyData).toBeUndefined()
  })
})
