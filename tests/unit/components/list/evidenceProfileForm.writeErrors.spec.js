import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} })
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/isoqf_findings/finding1/section/coherence' } })
const offline = () => Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } })

const makeModalData = (overrides = {}) => ({
  type: 'cerqual',
  title: 'Test finding',
  isoqf_id: null,
  methodological_limitations: { option: null, explanation: '', notes: '' },
  coherence: { option: null, explanation: '', notes: '' },
  adequacy: { option: null, explanation: '', notes: '' },
  relevance: { option: null, explanation: '', notes: '' },
  cerqual: { option: null, explanation: '', notes: '' },
  ...overrides
})

const makeWrapper = (propsData = {}, $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }) => shallowMount(evidenceProfileForm, {
  localVue,
  propsData: {
    modalData: makeModalData(),
    list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
    ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
    methAssessments: { items: [], fieldsObj: [] },
    findings: { id: 'finding1' },
    extractedData: { id: 'ed1', items: [], fieldsObj: [] },
    refsWithTitle: [],
    permission: true,
    evidenceProfile: [makeModalData()],
    selectOptions: [{ text: 'High' }, { text: 'Moderate' }, { text: 'Low' }, { text: 'Very Low' }],
    show: {},
    modePrintFieldObject: [],
    mode: 'edit',
    showEditExtractedDataInPlace: { display: false, item: {} },
    charsOfStudies: { items: [], fieldsObj: [] },
    project: { use_camelot: false, review_question: 'q', inclusion: 'i', exclusion: 'e' },
    ...propsData
  },
  mocks: {
    $t: key => key,
    $route: { params: { org_id: 'org1', id: 'list1' } },
    $bvModal: { show: jest.fn(), hide: jest.fn() },
    $store: { state: {} },
    $notify
  },
  stubs: {
    'b-form-group': true, 'b-form-textarea': true, 'b-form-radio-group': true,
    'b-form-radio': true, 'b-form-invalid-feedback': true, 'b-modal': true,
    'b-tabs': true, 'b-tab': true, 'b-button': true, 'b-link': true,
    'b-col': true, 'b-row': true, 'b-container': true, 'b-table': true,
    'video-help': true, 'edit-review-finding': true, 'assessment-table': true,
    'camelot-characteristics-table': true, 'table-extracted-data': true,
    'font-awesome-icon': true
  }
})

function setupRefs (wrapper) {
  wrapper.vm.$refs['modal-evidence-profile-form'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-same-txt'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-changed-option'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-cleaning-cerqual'] = { show: jest.fn(), hide: jest.fn() }
  // El guardado exige sostener la clave de cada sección que escribe (el lock es por
  // sección desde `<fid>::ep::<name>`). Estos specs llaman a `continueSavingDataModal`
  // sin pasar por `onModalShow`, así que el registro se siembra acá: lo que afirman es
  // el PATCH, no la adquisición del lock — ésa tiene su propio spec.
  const fid = wrapper.vm.findings && wrapper.vm.findings.id
  wrapper.vm.lockedSectionRefs = [
    'methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual'
  ].map(s => `${fid}::ep::${s}`)
}


const lastBusy = (wrapper) => {
  const calls = wrapper.emitted('busyEvidenceProfileTable') || []
  return calls.length ? calls[calls.length - 1][0] : undefined
}

async function conCambioEnCoherence (wrapper) {
  await wrapper.setData({
    selectedOptions: { ...wrapper.vm.selectedOptions, coherence: { option: 2, explanation: 'x', notes: '' } }
  })
}

// Es el editor principal. Antes un fallo terminaba en `printErrors`, que no muestra nada:
// el modal quedaba abierto sin decir por qué y la tabla, en «cargando» para siempre
// (`busyEvidenceProfileTable` se prendía al empezar y ningún catch lo apagaba).
describe('evidenceProfileForm — si no se guarda, lo dice y suelta la tabla', () => {
  beforeEach(() => jest.clearAllMocks())

  it('editar una sección falla', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = makeWrapper({ findings: { id: 'finding1' } }, $notify)
    setupRefs(wrapper)
    await conCambioEnCoherence(wrapper)
    Api.patch.mockRejectedValueOnce(error500())
    wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(lastBusy(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    // Lo escrito sigue en el modal para reintentar.
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('un 409 de lock en la sección no suma aviso: ya lo dio el canal de conflicto', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = makeWrapper({ findings: { id: 'finding1' } }, $notify)
    setupRefs(wrapper)
    await conCambioEnCoherence(wrapper)
    Api.patch.mockRejectedValueOnce(Object.assign(error500(), { response: { status: 409, data: { locked_by: 'Ana' } } }))
    wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(lastBusy(wrapper)).toBe(false)
    expect($notify.error).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('crear el finding falla', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = makeWrapper({ findings: {} }, $notify)
    setupRefs(wrapper)
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/isoqf_findings' } }))
    wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_findings', expect.anything())
    expect(lastBusy(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.create_error')
    wrapper.destroy()
  })

  it('sin conexión suelta la tabla sin sumar aviso', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = makeWrapper({ findings: { id: 'finding1' } }, $notify)
    setupRefs(wrapper)
    await conCambioEnCoherence(wrapper)
    Api.patch.mockRejectedValueOnce(offline())
    wrapper.vm.continueSavingDataModal()
    await flushPromises()
    expect(lastBusy(wrapper)).toBe(false)
    expect($notify.error).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('evidenceProfileForm — la fila de datos extraídos que no se guarda', () => {
  beforeEach(() => jest.clearAllMocks())

  it('avisa y deja la edición abierta', async () => {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = makeWrapper({}, $notify)
    setupRefs(wrapper)
    Api.patch.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/isoqf_extracted_data/ed1/item/R1' } }))
    wrapper.vm.updateContentExtractedDataItem('R1')
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    expect(wrapper.emitted('setShowEditExtractedDataInPlace')).toBeFalsy()
    wrapper.destroy()
  })
})

