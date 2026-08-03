import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@/utils/csvImporter', () => ({ parseTableRows: jest.fn(), parseCSVData: jest.fn() }))
jest.mock('@/utils/xlsxImporter', () => ({ parseXLSXData: jest.fn() }))
jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  filterDisplayFields: jest.fn(fields => fields)
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const ROWS = [
  { ref_id: 'R1', authors: 'Autor 1', column_0: 'dato 1' },
  { ref_id: 'R2', authors: 'Autor 2', column_0: 'dato 2' }
]

// shallowMount replaces every child component with a stub, and a stub never renders
// its default slot — so nothing inside <b-row>/<b-modal> reaches the DOM. Tests that
// need to look inside the content modal pass renderModals: true, which swaps the
// layout wrappers for slot-rendering stubs (b-form-textarea stays a stub, so its
// props remain assertable as attributes).
const SLOT_STUB = { template: '<div><slot /></div>' }
const LAYOUT_STUBS = {
  'b-row': SLOT_STUB, 'b-col': SLOT_STUB, 'b-modal': SLOT_STUB, 'b-form-group': SLOT_STUB,
  'b-alert': SLOT_STUB
}

function createWrapper ({ renderModals = false, ...props } = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'ch',
      canEdit: true,
      project: { is_public: false },
      references: [],
      refs: [],
      lists: [],
      ...props
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify
    },
    stubs: {
      'font-awesome-icon': true, 'videoHelp': true, 'BackToTop': true, 'draggable': true,
      ...(renderModals ? LAYOUT_STUBS : {})
    }
  })
  return { wrapper, $notify }
}

async function openRow (wrapper, index = 0, rows = ROWS, fields = []) {
  // mounted() runs updateMyDataTables(), whose getData() replaces this.dataTable.
  // Let it settle first or it wipes the id we set and every write silently no-ops.
  await flushPromises()
  await wrapper.setData({ dataTable: { id: 'tbl1', fields, items: rows } })
  // The content modal is opened through a $refs call; stub it after the render
  // that setData triggers, since Vue rebuilds $refs on every re-render.
  wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.addContentDataTable(index)
  await flushPromises()
}

// Endpoint B (`PATCH /<coll>/<id>/item/<ref_id>`) is guarded by @verify_ref_lock,
// which demands the caller HOLDS the lock — a write without one is a 409
// `lock_not_held` even when nobody else is editing. Pattern mirrors
// StepFour.vue's acquireStudyLock (the proven camelot flow).
describe('crudTables.vue — ref-lock de la fila (endpoint B)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  describe('al abrir el modal de contenido', () => {
    it('adquiere el lock del ref_id de esa fila', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper, 1)
      expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'R2')
      wrapper.destroy()
    })

    it('deja la fila editable cuando el lock se concede', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      wrapper.destroy()
    })

    it('marca la fila read-only y avisa quién la tiene cuando el lock está tomado', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper, $notify } = createWrapper()
      await openRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBe('Ana Pérez')
      expect($notify.warning).toHaveBeenCalledWith('lock.ref_locked_by')
      wrapper.destroy()
    })

    it('marca read-only sin nombre cuando el rechazo es por permisos revocados', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
      const { wrapper, $notify } = createWrapper()
      await openRow(wrapper)
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      expect($notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
      wrapper.destroy()
    })

    it('no pide lock cuando el usuario no tiene permiso de escritura', async () => {
      const { wrapper } = createWrapper({ canEdit: false })
      await openRow(wrapper)
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      expect(wrapper.vm.isRowReadOnly).toBe(true)
      wrapper.destroy()
    })

    it('no pide lock cuando la fila no tiene ref_id', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper, 0, [{ authors: 'Sin ref', column_0: '' }])
      expect(LockService.acquireRef).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('al cerrar el modal', () => {
    it('libera sólo el lock de esa fila, no todos los que sostiene la pestaña', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      wrapper.vm.onEditModalHidden()
      expect(LockService.releaseRef).toHaveBeenCalledWith('R1')
      wrapper.destroy()
    })

    it('resetea el estado de lock para la próxima fila', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      wrapper.vm.onEditModalHidden()
      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.rowLockedBy).toBeNull()
      wrapper.destroy()
    })
  })

  // The three bugs found in the live two-session run. All of them come from tying the
  // lock's lifetime to BootstrapVue's modal events, which are not guaranteed: `hidden`
  // is asynchronous (~300ms animation) and is not emitted at all if the modal never
  // finished opening.
  describe('ciclo de vida del lock frente a los eventos del modal', () => {
    it('libera el lock de la fila abierta al destruirse el componente', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)

      wrapper.destroy()

      // Verified live: navigating out of the project left the lock held until the TTL.
      expect(LockService.releaseRef).toHaveBeenCalledWith('R1')
    })

    it('no libera nada al destruirse si no había editor abierto', async () => {
      const { wrapper } = createWrapper()
      await flushPromises()
      wrapper.destroy()
      expect(LockService.releaseRef).not.toHaveBeenCalled()
    })

    it('un hidden que llega después de reabrir el editor no suelta el lock vigente', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      LockService.releaseRef.mockClear()

      // Real sequence when the user closes and reopens the same row quickly:
      // hide() → addContentDataTable() → [async] hidden of the previous session.
      wrapper.vm.addContentDataTable(0)
      await flushPromises()
      wrapper.vm.onEditModalHidden()

      expect(LockService.releaseRef).not.toHaveBeenCalled()
      expect(wrapper.vm.dataTableFieldsModal.editingRefId).toBe('R1')
      wrapper.destroy()
    })

    it('un cierre real sí libera el lock', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      LockService.releaseRef.mockClear()

      wrapper.vm.onEditModalHidden()

      expect(LockService.releaseRef).toHaveBeenCalledWith('R1')
      wrapper.destroy()
    })

    it('abrir otra fila libera el lock de la anterior aunque su modal nunca se cerrara', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper, 0)
      LockService.releaseRef.mockClear()

      // The modal never emitted hidden (it may not even have finished opening), and
      // the user goes straight to another row.
      wrapper.vm.addContentDataTable(1)
      await flushPromises()

      expect(LockService.releaseRef).toHaveBeenCalledWith('R1')
      expect(LockService.acquireRef).toHaveBeenLastCalledWith('proj1', 'R2')
      wrapper.destroy()
    })
  })

  describe('la fila read-only se ve en el modal', () => {
    it('deshabilita los textarea de las columnas', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper({ renderModals: true })
      await openRow(wrapper, 0, ROWS, [{ key: 'column_0', label: 'Col 0' }])

      const textareas = wrapper.findAll('b-form-textarea-stub')
      expect(textareas.length).toBeGreaterThan(0)
      expect(textareas.at(0).attributes('disabled')).toBeTruthy()
      wrapper.destroy()
    })

    it('deja los textarea habilitados cuando el lock se concede', async () => {
      const { wrapper } = createWrapper({ renderModals: true })
      await openRow(wrapper, 0, ROWS, [{ key: 'column_0', label: 'Col 0' }])

      const textareas = wrapper.findAll('b-form-textarea-stub')
      expect(textareas.length).toBeGreaterThan(0)
      expect(textareas.at(0).attributes('disabled')).toBeFalsy()
      expect(wrapper.text()).not.toContain('lock.ref_locked_by')
      wrapper.destroy()
    })

    it('muestra quién tiene la fila tomada', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper({ renderModals: true })
      await openRow(wrapper, 0, ROWS, [{ key: 'column_0', label: 'Col 0' }])

      expect(wrapper.text()).toContain('lock.ref_locked_by')
      wrapper.destroy()
    })
  })

  // The lock can vanish mid-edit: a failed heartbeat, or an offline grant that lost
  // the race on reconnect. LockService announces it with `ref-lock-lost`; before this,
  // nobody listened and the user kept typing into a save that would 409.
  describe('cuando se pierde el lock con el editor abierto', () => {
    it('pasa la fila a read-only e informa quién la tiene', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'R1', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(true)
      expect(wrapper.vm.rowLockedBy).toBe('Ana Pérez')
      wrapper.destroy()
    })

    it('ignora el aviso de otra fila', async () => {
      const { wrapper } = createWrapper()
      await openRow(wrapper)

      window.dispatchEvent(new CustomEvent('ref-lock-lost', {
        detail: { refId: 'R2', lockedBy: 'Ana Pérez' }
      }))
      await flushPromises()

      expect(wrapper.vm.isRowReadOnly).toBe(false)
      wrapper.destroy()
    })

    it('deja de escuchar al destruirse', async () => {
      const removeSpy = jest.spyOn(window, 'removeEventListener')
      const { wrapper } = createWrapper()
      wrapper.destroy()
      expect(removeSpy).toHaveBeenCalledWith('ref-lock-lost', expect.any(Function))
      removeSpy.mockRestore()
    })
  })

  describe('escrituras con la fila read-only', () => {
    it('el autosave no PATCHea', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      Api.patch.mockClear()

      await wrapper.vm.performAutoSave()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    it('el guardado explícito no PATCHea', async () => {
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
      const { wrapper } = createWrapper()
      await openRow(wrapper)
      Api.patch.mockClear()

      await wrapper.vm.saveContentDataTable()

      expect(Api.patch).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })
})
