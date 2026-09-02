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

const ROWS = [
  { ref_id: 'ref1', index: 0, authors: 'Smith 2020', column_0: 'a' },
  { ref_id: 'ref2', index: 1, authors: 'Jones 2021', column_0: 'b' }
]

function createWrapper (propsData = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(evidenceProfileForm, {
    localVue,
    propsData: {
      modalData: makeModalData(),
      list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false }, publishable_lists: [] },
      ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
      methAssessments: { items: [], fieldsObj: [] },
      findings: { id: 'finding1' },
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

// Endpoint A (`PATCH /isoqf_findings/<id>/section/<name>`) locks the DOCUMENT: the
// ref_id of the lock is the finding_id itself. Editing an extracted_data row inline
// inside this same modal writes through endpoint C, whose lock unit is the row's
// ref_id — so this modal legitimately holds two locks at once (hence the multi-slot
// LockService).
describe('evidenceProfileForm.vue — ref-lock del finding (endpoint A)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  describe('al abrir el modal', () => {
    it('adquiere el lock del finding_id', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'finding1')
      wrapper.destroy()
    })

    it('deja el formulario editable cuando el lock se concede', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      expect(wrapper.vm.findingLockedBy).toBeNull()
      wrapper.destroy()
    })

    it('marca read-only y avisa quién lo tiene cuando el lock está tomado', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper, $notify } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      expect(wrapper.vm.findingLockedBy).toBe('Ana Pérez')
      expect($notify.warning).toHaveBeenCalledWith('lock.ref_locked_by')
      wrapper.destroy()
    })

    it('marca read-only sin nombre cuando el rechazo es por permisos revocados', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
      const { wrapper, $notify } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      expect(wrapper.vm.findingLockedBy).toBeNull()
      expect($notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
      wrapper.destroy()
    })

    it('no pide lock cuando el usuario no tiene permiso de escritura', async () => {
      const { wrapper } = createWrapper({ permission: false })
      await openModal(wrapper)
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('no pide lock cuando el finding todavía no existe (se crea al guardar)', async () => {
      const { wrapper } = createWrapper({ findings: {} })
      await openModal(wrapper)
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('al cerrar el modal', () => {
    it('libera el lock del finding', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.onModalHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
      wrapper.destroy()
    })

    it('resetea el estado de lock', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.onModalHidden()
      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      expect(wrapper.vm.findingLockedBy).toBeNull()
      wrapper.destroy()
    })
  })

  // The form's inputs bind their disabled state to this single flag rather than to
  // `permission` alone, so a lock we could not get greys out the whole form.
  describe('canEditFinding — el flag que gobierna los campos del formulario', () => {
    it('es true con permiso y lock concedido', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.canEditFinding).toBe(true)
      wrapper.destroy()
    })

    it('es false cuando el lock está tomado por otro', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      expect(wrapper.vm.canEditFinding).toBe(false)
      wrapper.destroy()
    })

    it('es false sin permiso de escritura, aunque no haya lock ajeno', async () => {
      const { wrapper } = createWrapper({ permission: false })
      await openModal(wrapper)
      expect(wrapper.vm.canEditFinding).toBe(false)
      wrapper.destroy()
    })
  })

  describe('cuando se pierde el lock con el modal abierto', () => {
    it('pasa el formulario a read-only e informa quién tiene el finding', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'finding1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isFindingReadOnly).toBe(true)
      expect(wrapper.vm.findingLockedBy).toBe('Ana Pérez')
      expect(wrapper.vm.canEditFinding).toBe(false)
      wrapper.destroy()
    })

    it('pasa a read-only sólo la fila inline cuando el lock perdido es de la fila', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.editExtractedDataInPlace(0)
      await flushPromises()

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      wrapper.destroy()
    })

    it('ignora avisos de otras entidades', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'otro-finding', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      wrapper.destroy()
    })
  })

  // Read-only alone is silent: the fields simply stop responding and the user keeps
  // typing into a form that will never save. Reported from the field as "user 1 was
  // still looking at the modal". The banner is the only thing that tells them.
  describe('aviso visible cuando el finding queda en solo lectura', () => {
    it('no muestra aviso mientras el finding se puede editar', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      expect(wrapper.vm.readOnlyNotice).toBeFalsy()
      wrapper.destroy()
    })

    it('muestra un aviso cuando el lock se pierde con el modal abierto', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'finding1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.readOnlyNotice).toBeTruthy()
      wrapper.destroy()
    })

    it('renderiza el aviso en el formulario, no sólo en el estado', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'finding1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.find('[data-testid="finding-readonly-notice"]').exists()).toBe(true)
      wrapper.destroy()
    })
  })

  // The inline row editor was the quietest of all: read-only did not disable its
  // textarea or its Save button, and updateContentExtractedDataItem returns early, so
  // the user typed, pressed Save, and nothing happened — no error, no explanation.
  describe('aviso visible cuando la fila inline queda en solo lectura', () => {
    it('no muestra aviso de fila mientras la fila se puede editar', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.editExtractedDataInPlace(0)
      await flushPromises()

      expect(wrapper.vm.rowReadOnlyNotice).toBeFalsy()
      wrapper.destroy()
    })

    it('muestra aviso de fila cuando se pierde el lock de la fila abierta', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      wrapper.vm.editExtractedDataInPlace(0)
      await flushPromises()

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowReadOnlyNotice).toBeTruthy()
      wrapper.destroy()
    })
  })

  describe('ciclo de vida del lock frente a los eventos del modal', () => {
    it('libera el lock del finding al destruirse el componente', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      wrapper.destroy()

      // Verified live: the POST succeeded, the modal never finished opening, and a later
      // hide() emitted no `hidden` — the lock stayed orphaned.
      expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
    })

    it('un hidden que llega después de reabrir el modal no suelta el lock vigente', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      LockService.releaseRef.mockClear()

      await openModal(wrapper)
      wrapper.vm.onModalHidden()

      expect(LockService.releaseRef).not.toHaveBeenCalled()
      expect(wrapper.vm.isFindingReadOnly).toBe(false)
      wrapper.destroy()
    })

    it('un cierre real sí libera el lock', async () => {
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      LockService.releaseRef.mockClear()

      wrapper.vm.onModalHidden()

      expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
      wrapper.destroy()
    })
  })

  describe('guardado del evidence profile con el finding read-only', () => {
    it('no PATCHea ninguna sección', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)
      await wrapper.setData({
        selectedOptions: { ...makeModalData(), coherence: { option: 2, explanation: 'nuevo', notes: '' } }
      })
      Api.patch.mockClear()

      wrapper.vm.continueSavingDataModal()
      await flushPromises()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('apaga el spinner de la tabla en vez de dejarlo colgado', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openModal(wrapper)

      wrapper.vm.continueSavingDataModal()
      await flushPromises()

      const busyEvents = wrapper.emitted('busyEvidenceProfileTable') || []
      expect(busyEvents[busyEvents.length - 1]).toEqual([false])
      wrapper.destroy()
    })
  })
})

// The second lock: a row edited inline inside the open modal.
describe('evidenceProfileForm.vue — segundo lock de la fila inline (endpoint C)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('adquiere el lock del ref_id de la fila sin soltar el del finding', async () => {
    const { wrapper } = createWrapper()
    await openModal(wrapper)
    LockService.releaseRef.mockClear()

    wrapper.vm.editExtractedDataInPlace(0)
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(LockService.releaseRef).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('cancelar la edición inline libera sólo el lock de la fila', async () => {
    const { wrapper } = createWrapper()
    await openModal(wrapper)
    wrapper.vm.editExtractedDataInPlace(0)
    await flushPromises()

    wrapper.vm.cancelExtractedDataInPlace()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
    expect(LockService.releaseRef).not.toHaveBeenCalledWith('finding1')
    wrapper.destroy()
  })

  it('guardar la fila inline libera su lock tras el PATCH', async () => {
    const { wrapper } = createWrapper({
      showEditExtractedDataInPlace: { display: true, item: { ...ROWS[0], column_0: 'editado' } }
    })
    await openModal(wrapper)
    wrapper.vm.editExtractedDataInPlace(0)
    await flushPromises()

    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_extracted_data/ed1/item/ref1', expect.any(Object))
    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
    wrapper.destroy()
  })

  it('no PATCHea la fila cuando su lock fue rechazado', async () => {
    const { wrapper } = createWrapper({
      showEditExtractedDataInPlace: { display: true, item: { ...ROWS[0], column_0: 'editado' } }
    })
    await openModal(wrapper)
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    wrapper.vm.editExtractedDataInPlace(0)
    await flushPromises()
    Api.patch.mockClear()

    await wrapper.vm.updateContentExtractedDataItem('ref1')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
