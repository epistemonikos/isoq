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
  wrapper.vm.$refs['modal-extracted-data-data'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-extracted-data-remove-data-item'] = { show: jest.fn(), hide: jest.fn() }
  return { wrapper, $notify }
}

async function openEditRow (wrapper, index = 0) {
  // Vue rebuilds $refs on every re-render, so the modal stubs have to be reinstated
  // before each open or the component throws on $refs[...].show().
  wrapper.vm.$refs['modal-extracted-data-data'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-extracted-data-remove-data-item'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.openModalExtractedDataEditDataItem({ index, item: ROWS[index] })
  await flushPromises()
}

// Endpoint C (`PATCH /isoqf_extracted_data/<id>/item/<ref_id>`) is guarded by
// @verify_ref_lock: the unit of the lock is the row's ref_id, and a write without
// it is a 409 `lock_not_held` even with nobody else editing.
describe('editListExtractedData.vue — ref-lock por fila (endpoint C)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  describe('al abrir el editor de una fila', () => {
    it('adquiere el lock del ref_id de la fila usando el project_id de la lista', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper, 1)
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref2')
      wrapper.destroy()
    })

    it('deja la fila editable cuando el lock se concede', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      wrapper.destroy()
    })

    it('marca read-only y avisa quién la tiene cuando el lock está tomado', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper, $notify } = createWrapper()
      await openEditRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBe('Ana Pérez')
      expect($notify.warning).toHaveBeenCalledWith('lock.ref_locked_by')
      wrapper.destroy()
    })

    it('marca read-only sin nombre cuando el rechazo es por permisos revocados', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
      const { wrapper, $notify } = createWrapper()
      await openEditRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      expect($notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
      wrapper.destroy()
    })

    it('no pide lock cuando el usuario no tiene permiso de escritura', async () => {
      const { wrapper } = createWrapper({ permission: false })
      await openEditRow(wrapper)
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      wrapper.destroy()
    })
  })

  describe('al abrir el modal de borrado de una fila', () => {
    it('adquiere el lock de esa fila (el borrado también escribe por el endpoint C)', async () => {
      const { wrapper } = createWrapper()
      wrapper.vm.openModalExtractedDataRemoveDataItem({ index: 0, item: ROWS[0] })
      await flushPromises()
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
      wrapper.destroy()
    })

    it('no borra cuando la fila quedó read-only', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      wrapper.vm.openModalExtractedDataRemoveDataItem({ index: 0, item: ROWS[0] })
      await flushPromises()
      Api.patch.mockClear()

      await wrapper.vm.extractedDataRemoveDataItem()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('al cerrar el editor', () => {
    it('libera sólo el lock de esa fila', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      wrapper.vm.onRowEditorHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
      wrapper.destroy()
    })

    it('resetea el estado de lock para la próxima fila', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      wrapper.vm.onRowEditorHidden()
      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      wrapper.destroy()
    })
  })

  describe('cuando se pierde el lock con el editor abierto', () => {
    it('pasa la fila a read-only e informa quién la tiene', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBe('Ana Pérez')
      wrapper.destroy()
    })

    it('ignora el aviso de otra fila', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'ref2', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(false)
      wrapper.destroy()
    })
  })

  // Same three bugs as crudTables: the lock's lifetime cannot hang off BootstrapVue's
  // modal events. This component has two modals (edit and delete) sharing one handler.
  describe('ciclo de vida del lock frente a los eventos del modal', () => {
    it('libera el lock al destruirse el componente', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)

      wrapper.destroy()

      expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
    })

    it('un hidden que llega después de reabrir el editor no suelta el lock vigente', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      LockService.releaseRef.mockClear()

      await openEditRow(wrapper)
      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('un cierre real sí libera el lock', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      LockService.releaseRef.mockClear()

      wrapper.vm.onRowEditorHidden()

      expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
      wrapper.destroy()
    })

    it('abrir otra fila libera el lock de la anterior aunque su modal nunca se cerrara', async () => {
      const { wrapper } = createWrapper()
      await openEditRow(wrapper, 0)
      LockService.releaseRef.mockClear()

      await openEditRow(wrapper, 1)

      expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
      expect(LockService.acquireRef).toHaveBeenLastCalledWith('proj1', 'ref2')
      wrapper.destroy()
    })
  })

  describe('escrituras con la fila read-only', () => {
    it('el guardado no PATCHea', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openEditRow(wrapper)
      Api.patch.mockClear()

      await wrapper.vm.saveDataExtractedData()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('el estado read-only se ve en el modal', () => {
    it('deshabilita el textarea y muestra quién tiene la fila', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper({ renderModals: true })
      await openEditRow(wrapper)

      const textareas = wrapper.findAll('b-form-textarea-stub')
      expect(textareas.length).toBeGreaterThan(0)
      expect(textareas.at(0).attributes('disabled')).toBeTruthy()
      expect(wrapper.text()).toContain('lock.ref_locked_by')
      wrapper.destroy()
    })

    it('no deshabilita nada cuando el lock se concede', async () => {
      const { wrapper } = createWrapper({ renderModals: true })
      await openEditRow(wrapper)

      const textareas = wrapper.findAll('b-form-textarea-stub')
      expect(textareas.length).toBeGreaterThan(0)
      expect(textareas.at(0).attributes('disabled')).toBeFalsy()
      expect(wrapper.text()).not.toContain('lock.ref_locked_by')
      wrapper.destroy()
    })
  })
})
