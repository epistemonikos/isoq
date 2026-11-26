import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { impactOfListChange } from '@/utils/publicationState'
import InactivityWarning from '@/components/common/InactivityWarning.vue'

/**
 * #378 (Megan): el Evidence Profile se suelta solo tras 30 min sin actividad, igual que
 * los editores de los pasos 3 y 4: guarda, cierra y no avisa.
 *
 * A diferencia de esos, este modal no autoguarda y su guardado pasa por confirmaciones.
 * Al vencer se guarda «lo seguro»: una pregunta abierta de borrar el CERQual cuenta
 * como No, falta de explicación cuenta como «Después», y si el guardado ocultaría el
 * finding o pasaría el proyecto a privado se guardan sólo los textos, no los niveles
 * (pasar a privado es siempre una elección de la persona).
 */

const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  isEnabled: true,
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

jest.mock('@/utils/publicationState', () => ({
  impactOfListChange: jest.fn().mockResolvedValue('none'),
  publicationCheckErrorKey: jest.fn(() => 'publish.check_needs_connection')
}))

const FID = 'finding1'
const filled = (o = '1', e = 'texto') => ({ option: o, explanation: e, notes: '' })
const makeModalData = (overrides = {}) => ({
  type: 'coherence',
  title: 'Test finding',
  methodological_limitations: filled(),
  coherence: filled(),
  adequacy: filled(),
  relevance: filled(),
  cerqual: filled(),
  ...overrides
})

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(evidenceProfileForm, {
    localVue,
    propsData: {
      modalData: makeModalData(),
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
      ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
      methAssessments: { items: [], fieldsObj: [] },
      findings: { id: FID, list_id: 'list1' },
      extractedData: { id: 'ed1', items: [], fieldsObj: [] },
      refsWithTitle: [],
      permission: true,
      evidenceProfile: [makeModalData()],
      selectOptions: [{ text: 'High' }, { text: 'Moderate' }, { text: 'Low' }, { text: 'Very Low' }],
      show: {},
      modePrintFieldObject: [],
      mode: 'edit',
      charsOfStudies: { items: [], fieldsObj: [] },
      project: { use_camelot: false, review_question: 'q', inclusion: 'i', exclusion: 'e' }
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
      'b-form-radio': true, 'b-form-invalid-feedback': true,
      'b-tabs': true, 'b-tab': true, 'b-button': true, 'b-link': true,
      'b-col': true, 'b-row': true, 'b-container': true, 'b-table': true,
      'video-help': true, 'edit-review-finding': true, 'assessment-table': true,
      'camelot-characteristics-table': true, 'table-extracted-data': true,
      'font-awesome-icon': true, 'b-alert': true,
      // El cuerpo del modal tiene que renderizarse: ahí vive el aviso, y se usa el
      // componente real para afirmar sobre lo que se ve, no sobre el estado.
      'b-modal': { template: '<div><slot /></div>' },
      InactivityWarning
    }
  })
  const modal = () => ({ show: jest.fn(), hide: jest.fn(), isVisible: false })
  ;['modal-evidence-profile-form', 'modal-warning-same-txt', 'modal-warning-changed-option',
    'modal-warning-save-incomplete', 'modal-warning-cleaning-cerqual']
    .forEach(r => { wrapper.vm.$refs[r] = modal() })
  return { wrapper, $notify }
}

async function opened () {
  const ctx = createWrapper()
  ctx.wrapper.vm.openedSection = 'coherence'
  ctx.wrapper.vm.onModalShow()
  await flushPromises()
  return ctx
}

const patchedSections = () => Api.patch.mock.calls.map(([url, body]) => [url.split('/').pop(), body])

beforeEach(() => {
  jest.clearAllMocks()
  LockService.acquireRef.mockResolvedValue({ success: true })
  impactOfListChange.mockResolvedValue('none')
  Api.patch.mockResolvedValue({ data: {} })
})

describe('evidenceProfileForm — temporizador de inactividad (#378)', () => {
  it('arma el reloj al obtener el lock de la sección', async () => {
    const { wrapper } = await opened()
    expect(wrapper.vm.lastInactivityActivityAt()).not.toBeNull()
    wrapper.destroy()
  })

  it('no lo arma si el lock fue negado: no hay nada que soltar', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const { wrapper } = await opened()
    expect(wrapper.vm.lastInactivityActivityAt()).toBeNull()
    wrapper.destroy()
  })

  it('lo desarma al cerrar el modal', async () => {
    const { wrapper } = await opened()
    wrapper.vm.onModalHidden()
    expect(wrapper.vm.lastInactivityActivityAt()).toBeNull()
    wrapper.destroy()
  })

  it('muestra el aviso dentro del modal cuando corre la cuenta regresiva', async () => {
    const { wrapper } = await opened()
    const warning = () => wrapper.find('[data-testid="inactivity-warning"]')
    expect(warning().exists()).toBe(false)
    wrapper.vm.inactivityWarning = true
    wrapper.vm.inactivitySecondsLeft = 300
    await wrapper.vm.$nextTick()
    expect(warning().exists()).toBe(true)
    wrapper.destroy()
  })

  it('al vencer guarda lo escrito, cierra y no avisa con un toast', async () => {
    const { wrapper, $notify } = await opened()
    wrapper.vm.selectedOptions.coherence.explanation = 'escrito antes de almorzar'

    await wrapper.vm.onInactivityExpired()

    expect(patchedSections()).toEqual([['coherence', expect.objectContaining({ explanation: 'escrito antes de almorzar' })]])
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    expect($notify.warning).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('una explicación faltante no lo frena: cuenta como «Después»', async () => {
    const { wrapper } = await opened()
    wrapper.vm.selectedOptions.coherence = { option: '2', explanation: '', notes: '' }

    await wrapper.vm.onInactivityExpired()

    expect(wrapper.vm.$refs['modal-warning-same-txt'].show).not.toHaveBeenCalled()
    expect(patchedSections().map(([s]) => s)).toContain('coherence')
    wrapper.destroy()
  })

  it('una pregunta abierta de borrar el CERQual cuenta como No', async () => {
    const { wrapper } = await opened()
    wrapper.vm.selectedOptions.coherence.option = '3'
    wrapper.vm.selectedOptions.coherence.explanation = 'nuevo texto'
    wrapper.vm.$refs['modal-warning-changed-option'].isVisible = true

    await wrapper.vm.onInactivityExpired()

    expect(wrapper.vm.$refs['modal-warning-changed-option'].hide).toHaveBeenCalled()
    // El nivel vuelve al guardado; el texto se conserva.
    expect(patchedSections()).toEqual([['coherence', { option: '1', explanation: 'nuevo texto', notes: '' }]])
    wrapper.destroy()
  })

  it('si el guardado afectaría la publicación, guarda los textos y no los niveles', async () => {
    const { wrapper } = await opened()
    // La persona ya dijo «Sí» a borrar el CERQual (tiene su lock) y escribió en ambos.
    wrapper.vm.rememberSectionLock(`${FID}::ep::cerqual`)
    wrapper.vm.selectedOptions.coherence = { option: '3', explanation: 'texto coherencia', notes: '' }
    wrapper.vm.selectedOptions.cerqual = { option: null, explanation: 'texto cerqual', notes: '' }
    impactOfListChange.mockResolvedValue('project_private')

    await wrapper.vm.onInactivityExpired()

    expect(patchedSections()).toEqual([
      ['coherence', { option: '1', explanation: 'texto coherencia', notes: '' }],
      ['cerqual', { option: '1', explanation: 'texto cerqual', notes: '' }]
    ])
    wrapper.destroy()
  })

  it('si no se puede leer el impacto, tampoco arriesga los niveles', async () => {
    const { wrapper } = await opened()
    wrapper.vm.rememberSectionLock(`${FID}::ep::cerqual`)
    wrapper.vm.selectedOptions.cerqual = { option: '3', explanation: 'otro', notes: '' }
    impactOfListChange.mockRejectedValue(new Error('offline'))

    await wrapper.vm.onInactivityExpired()

    expect(patchedSections()).toEqual([['cerqual', { option: '1', explanation: 'otro', notes: '' }]])
    wrapper.destroy()
  })

  it('cierra y suelta aunque el guardado falle', async () => {
    const { wrapper } = await opened()
    wrapper.vm.selectedOptions.coherence.explanation = 'x'
    Api.patch.mockRejectedValue({ response: { status: 500, data: { status: 'error' } } })

    await wrapper.vm.onInactivityExpired()

    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('en solo lectura no escribe nada: sólo cierra', async () => {
    const { wrapper } = await opened()
    wrapper.vm.isFindingReadOnly = true
    wrapper.vm.selectedOptions.coherence.explanation = 'x'

    await wrapper.vm.onInactivityExpired()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.$refs['modal-evidence-profile-form'].hide).toHaveBeenCalled()
    wrapper.destroy()
  })
})
