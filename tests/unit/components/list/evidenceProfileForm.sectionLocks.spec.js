import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const FID = 'finding1'
const ROWS = [
  { ref_id: 'ref1', index: 0, authors: 'Smith 2020', column_0: 'a' }
]
const K = section => `${FID}::ep::${section}`
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

function createWrapper (propsData = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(evidenceProfileForm, {
    localVue,
    propsData: {
      modalData: makeModalData(),
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
      ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
      methAssessments: { items: [], fieldsObj: [] },
      findings: { id: FID, list_id: 'list1' },
      extractedData: { id: 'ed1', items: ROWS, fieldsObj: [] },
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
      'font-awesome-icon': true, 'b-alert': true
    }
  })
  wrapper.vm.$refs['modal-evidence-profile-form'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-same-txt'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-changed-option'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-warning-cleaning-cerqual'] = { show: jest.fn(), hide: jest.fn() }
  return { wrapper, $notify }
}

async function openModal (wrapper) {
  wrapper.vm.onModalShow()
  await flushPromises()
}

describe('evidenceProfileForm — lock por sección', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
    LockService.refLocks.clear()
  })

  describe('al abrir: UN solo lock', () => {
    it('toma la clave de la sección que se abre, no el finding entero', async () => {
      const { wrapper } = createWrapper({ modalData: makeModalData({ type: 'coherence' }) })
      await openModal(wrapper)
      expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', K('coherence'))
      wrapper.destroy()
    })

    it('traduce la grafía con guión que le llega de la tabla', async () => {
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'methodological-limitations' })
      })
      await openModal(wrapper)
      expect(LockService.acquireRef)
        .toHaveBeenCalledWith('proj1', K('methodological_limitations'))
      wrapper.destroy()
    })

    it('NO toma el lock de cerqual al abrir una dimensión, aunque cerqual esté seteado', async () => {
      // Tomarlo al abrir es lo que anula la feature: quien abre coherence se lleva
      // cerqual, y quien abre adequacy queda en solo lectura. O sea, lo de siempre.
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
      expect(LockService.acquireRef).not.toHaveBeenCalledWith('proj1', K('cerqual'))
      wrapper.destroy()
    })

    it('abrir el panel de cerqual toma sólo la clave de cerqual', async () => {
      const { wrapper } = createWrapper({ modalData: makeModalData({ type: 'cerqual' }) })
      await openModal(wrapper)
      expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', K('cerqual'))
      wrapper.destroy()
    })

    it('un rechazo deja el formulario en solo lectura y nombra al titular', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      expect(wrapper.vm.findingLockedBy).toBe('Ana Pérez')
      wrapper.destroy()
    })
  })

  describe('cerqual perezoso: en el "Sí" del aviso de cambio de opción', () => {
    it('lo adquiere cuando el usuario confirma el cambio', async () => {
      // Ése es el instante exacto en que ya se sabe que habrá reset, y la persona está
      // parada frente a una confirmación: el rechazo llega ahí, no tras diez minutos.
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      LockService.acquireRef.mockClear()

      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()

      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', K('cerqual'))
      wrapper.destroy()
    })

    it('al confirmar, limpia cerqual', async () => {
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()
      expect(wrapper.vm.selectedOptions.cerqual.option).toBeNull()
      expect(wrapper.vm.selectedOptions.cerqual.explanation).toBe('')
      wrapper.destroy()
    })

    it('si el lock de cerqual está tomado, REVIERTE la opción y no limpia cerqual', async () => {
      // La respuesta honesta: el cambio de opción es justamente lo que obliga al reset,
      // así que negarlo es negar el cambio, por el mismo camino que el "No".
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      wrapper.vm.selectedOptions.coherence.option = '3'
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })

      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()

      expect(wrapper.vm.selectedOptions.coherence.option).toBe('1')
      expect(wrapper.vm.selectedOptions.cerqual.option).toBe('2')
      wrapper.destroy()
    })

    it('avisa a la persona cuando le niegan cerqual', async () => {
      const { wrapper, $notify } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()
      expect($notify.warning).toHaveBeenCalled()
      wrapper.destroy()
    })

    it('el "No" no adquiere ni libera nada', async () => {
      // Liberar en el "No" abriría una ventana entre dos decisiones de la misma
      // persona, en la que otro puede quedarse con cerqual.
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      LockService.acquireRef.mockClear()
      LockService.releaseRef.mockClear()

      await wrapper.vm.updateOptions('coherence', false)
      await flushPromises()

      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(LockService.releaseRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('desde el panel de cerqual no vuelve a pedir su propia clave', async () => {
      const { wrapper } = createWrapper({ modalData: makeModalData({ type: 'cerqual' }) })
      await openModal(wrapper)
      LockService.acquireRef.mockClear()
      await wrapper.vm.updateOptions('cerqual', true)
      await flushPromises()
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('pérdida del lock', () => {
    it('perder la clave de la dimensión pone el formulario en solo lectura', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: K('coherence'), lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      expect(wrapper.vm.lockLostWhileEditing).toBe(true)
      wrapper.destroy()
    })

    it('perder la clave de CERQUAL también, aunque la dimensión siga viva', async () => {
      // El desalojo del latido corre por clave, así que el lock de la dimensión
      // sobrevive un ciclo. Un handler que sólo escuche esa clave deja al usuario
      // 30 s creyendo que puede guardar.
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: K('cerqual'), lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      wrapper.destroy()
    })

    it('perder el lock del FINDING pelado también (bundle viejo / editor de identidad)', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: FID, lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      wrapper.destroy()
    })

    it('una clave que este cliente no conoce no cambia nada', async () => {
      // Test de camino: el aviso no debe desaparecer por un formato desconocido, ni
      // aparecer por uno ajeno.
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: `${FID}::ep::seccion_nueva`, lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()
      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      wrapper.destroy()
    })

    it('la clave perdida se saca del registro: el release no pide soltar la de otro', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: K('coherence'), lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()
      LockService.releaseRef.mockClear()
      wrapper.vm.onModalHidden()
      expect(LockService.releaseRef).not.toHaveBeenCalledWith(K('coherence'))
      wrapper.destroy()
    })
  })

  describe('al cerrar: suelta todas las claves sostenidas', () => {
    it('suelta la de la dimensión', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.onModalHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith(K('coherence'))
      wrapper.destroy()
    })

    it('suelta las DOS cuando también tomó cerqual', async () => {
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()
      LockService.releaseRef.mockClear()

      wrapper.vm.onModalHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith(K('coherence'))
      expect(LockService.releaseRef).toHaveBeenCalledWith(K('cerqual'))
      wrapper.destroy()
    })
  })

  describe('guardado', () => {
    it('PATCHea la sección con su propia clave sostenida', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.selectedOptions.coherence.explanation = 'cambiado'

      wrapper.vm.continueSavingDataModal()
      await flushPromises()

      expect(Api.patch).toHaveBeenCalledWith(
        `/isoqf_findings/${FID}/section/coherence`, expect.any(Object))
      wrapper.destroy()
    })

    it('escribe la dimensión ANTES de cerqual', async () => {
      // Escribir cerqual dispara `unpublish_if_not_publishable`, así que al revés un
      // fallo de la dimensión dejaría el proyecto despublicado con el dominio viejo.
      const { wrapper } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      await wrapper.vm.updateOptions('coherence', true)
      await flushPromises()
      wrapper.vm.selectedOptions.coherence.explanation = 'cambiado'
      Api.patch.mockClear()

      wrapper.vm.continueSavingDataModal()
      await flushPromises()

      const secciones = Api.patch.mock.calls.map(c => c[0].split('/section/')[1])
      expect(secciones).toContain('coherence')
      expect(secciones).toContain('cerqual')
      expect(secciones.indexOf('coherence')).toBeLessThan(secciones.indexOf('cerqual'))
      wrapper.destroy()
    })

    it('no PATCHea nada si falta la clave de una sección que cambió', async () => {
      // Convierte un 409 invisible (hoy sólo console.log, con el spinner colgado) en
      // un aviso. Con la regla del acquire perezoso esto no debería ocurrir; el guard
      // está para que un hook olvidado en el futuro no escriba a medias.
      const { wrapper, $notify } = createWrapper({
        modalData: makeModalData({ type: 'coherence', cerqual: filled('2', 'ya evaluado') })
      })
      await openModal(wrapper)
      wrapper.vm.selectedOptions.cerqual.option = null
      wrapper.vm.selectedOptions.cerqual.explanation = ''
      Api.patch.mockClear()

      wrapper.vm.continueSavingDataModal()
      await flushPromises()

      expect(Api.patch).not.toHaveBeenCalled()
      expect($notify.warning).toHaveBeenCalled()
      wrapper.destroy()
    })

    it('sigue cortando en solo lectura', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      Api.patch.mockClear()
      wrapper.vm.continueSavingDataModal()
      await flushPromises()
      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })
})
