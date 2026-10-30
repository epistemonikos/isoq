import { shallowMount, createLocalVue } from '@vue/test-utils'
import editListExtractedData from '@/components/list/editListExtractedData.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

// BootstrapVue must be installed for the b-* tags to resolve to components (and
// therefore to auto-stubs whose props are assertable as attributes). Without it
// they render as unknown elements.
const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const SLOT_STUB = { template: '<div><slot /></div>' }

const ROWS = [
  { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'texto 1' },
  { ref_id: 'ref2', authors: 'Jones 2021', column_0: 'texto 2' }
]

function createWrapper ({ permission = true, renderModals = false } = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(editListExtractedData, {
    localVue,
    propsData: {
      ui: {},
      show: { selected: ['ed'] },
      mode: 'edit',
      // The route param here is the LIST id — the project id only reaches this
      // component through the list prop, and that is what the lock endpoint needs.
      list: { id: 'list1', organization: 'org1', project_id: 'proj1' },
      permission,
      extractedData: { id: 'ed1', fields: [{ key: 'column_0' }, { key: 'actions' }], fieldsObj: [], items: ROWS },
      modePrintFieldObject: [],
      refsWithTitle: []
    },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $notify
    },
    stubs: {
      videoHelp: true, 'bc-filters': true, 'back-to-top': true,
      'b-table': true, 'b-button': true, 'font-awesome-icon': true,
      ...(renderModals
        ? { 'b-modal': SLOT_STUB, 'b-form-group': SLOT_STUB, 'b-alert': SLOT_STUB }
        : { 'b-modal': true, 'b-form-group': true, 'b-alert': true })
    }
  })
  return { wrapper, $notify }
}

async function openRemoveRow (wrapper, refId = 'ref1') {
  // Vue rebuilds $refs on every re-render, so the modal stub has to be reinstated
  // before each open or the component throws on $refs[...].show().
  wrapper.vm.$refs['modal-extracted-data-remove-data-item'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.openModalExtractedDataRemoveDataItem(refId)
  await flushPromises()
}

// Endpoint C (`PATCH /isoqf_extracted_data/<id>/item/<ref_id>`) is guarded by
// @verify_ref_lock: the unit of the lock is THIS document's row, `<doc>::ed::<ref_id>`, and a
// write without it is a 409 `lock_not_held` even with nobody else editing.
//
// Editing a row happens in the row itself: its lock is covered in
// `editListExtractedData.inline.spec.js`. Clearing a row still asks first, in a modal, and
// that modal's lock is what this file pins.
describe('editListExtractedData.vue — ref-lock de la fila al vaciarla (endpoint C)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  describe('al abrir el modal de vaciar una fila', () => {
    it('adquiere el lock de esa fila usando el project_id de la lista', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper, 'ref2')
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ed1::ed::ref2')
      wrapper.destroy()
    })

    it('no vacía cuando la fila quedó read-only', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      Api.patch.mockClear()

      await wrapper.vm.extractedDataRemoveDataItem()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    // Un evento, un canal: el cartel del modal ya lo dice y se queda mientras dure.
    it('marca read-only y lo dice SÓLO en el cartel cuando el lock está tomado', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper, $notify } = createWrapper({ renderModals: true })
      await openRemoveRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.text()).toContain('lock.ref_locked_by')
      expect($notify.warning).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('no pide lock cuando el usuario no tiene permiso de escritura', async () => {
      const { wrapper } = createWrapper({ permission: false })
      await openRemoveRow(wrapper)
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      wrapper.destroy()
    })
  })

  describe('al cerrar el modal', () => {
    it('libera sólo el lock de esa fila', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      wrapper.vm.onRowEditorHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
      wrapper.destroy()
    })

    it('resetea el estado de lock para la próxima fila', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      wrapper.vm.onRowEditorHidden()
      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      wrapper.destroy()
    })
  })

  describe('cuando se pierde el lock con el modal abierto', () => {
    it('el cartel explica el motivo del latido (desalojo por granularidad)', async () => {
      const { wrapper } = createWrapper({ renderModals: true })
      await openRemoveRow(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ed1::ed::ref1', lockedBy: 'Ana Pérez', reason: 'evicted_granularity_conflict' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.text()).toContain('lock.evicted_granularity')
      wrapper.destroy()
    })
  })

  // Same three bugs as crudTables: the lock's lifetime cannot hang off BootstrapVue's
  // modal events.
  describe('ciclo de vida del lock frente a los eventos del modal', () => {
    it('libera el lock al destruirse el componente', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)

      wrapper.destroy()

      expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
    })

    it('un hidden que llega después de reabrir el modal no suelta el lock vigente', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      LockService.releaseRef.mockClear()

      // Cerrar (el `hide` es síncrono) y reabrir antes de que llegue el `hidden`.
      wrapper.vm.onRowEditorHide({ defaultPrevented: false })
      await openRemoveRow(wrapper)
      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('un hidden del modal que llega con la fila ya abierta en sitio no suelta su lock', async () => {
      // Vaciar una fila, y antes de que el modal termine de cerrarse, editar otra.
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper, 'ref1')
      wrapper.vm.onRowEditorHide({ defaultPrevented: false })
      wrapper.vm.startRowEdit('ref2')
      await flushPromises()
      LockService.releaseRef.mockClear()

      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).not.toHaveBeenCalled()
      expect(wrapper.vm.editingRef).toBe('ref2')
      wrapper.destroy()
    })

    it('abrir dos veces sin cerrar y después cerrar una vez sí libera el lock', async () => {
      // Un doble clic: el segundo `show()` sobre un modal que ya se está abriendo es un
      // no-op de BootstrapVue, así que no hay un `hidden` viejo en camino. Tomar el único
      // `hidden` por viejo dejaba el lock colgado hasta salir.
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      await openRemoveRow(wrapper)
      LockService.releaseRef.mockClear()

      wrapper.vm.onRowEditorHide({ defaultPrevented: false })
      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
      wrapper.destroy()
    })

    it('un cierre cancelado no deja armada la guarda', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper)
      wrapper.vm.onRowEditorHide({ defaultPrevented: true })
      await openRemoveRow(wrapper)
      LockService.releaseRef.mockClear()

      wrapper.vm.onRowEditorHide({ defaultPrevented: false })
      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
      wrapper.destroy()
    })

    it('abrir otra fila libera el lock de la anterior aunque su modal nunca se cerrara', async () => {
      const { wrapper } = createWrapper()
      await openRemoveRow(wrapper, 'ref1')
      LockService.releaseRef.mockClear()

      await openRemoveRow(wrapper, 'ref2')

      expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
      expect(LockService.acquireRef).toHaveBeenLastCalledWith('proj1', 'ed1::ed::ref2')
      wrapper.destroy()
    })
  })
})
