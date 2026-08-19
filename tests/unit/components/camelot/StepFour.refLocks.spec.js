import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map()
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper (overrideProps = {}) {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true, ...overrideProps },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

// jest.clearAllMocks() borra las llamadas pero NO las implementaciones: un test que
// hace fetchRefLocks.mockResolvedValue([...]) deja ese listado de locks para todos los
// que siguen. Se resetea acá porque el estado del estudio ahora se deriva de él.
beforeEach(() => {
  LockService.fetchRefLocks.mockResolvedValue([])
  LockService.acquireRef.mockResolvedValue({ success: true })
})

describe('StepFour.vue — isRefLocked()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
  })

  it('retorna true cuando ref_id está en activeRefLocks', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    expect(wrapper.vm.isRefLocked('ref2')).toBe(false)
    wrapper.destroy()
  })

  // Endpoint D means a study can be blocked by a lock on one of its cells, a
  // key the old exact-equality check could never match.
  it('retorna true cuando otro tiene bloqueada una hoja del estudio', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({
      activeRefLocks: [{ ref_id: 'ref1::s0::o2', user_name: 'Ana' }]
    })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    wrapper.destroy()
  })

  it('no confunde un estudio cuyo id empieza igual que otro', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({
      activeRefLocks: [{ ref_id: 'ref1X::s0::o0', user_name: 'Ana' }]
    })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(false)
    wrapper.destroy()
  })

  it('ignora mis propios locks, tanto por nombre como por registro local', async () => {
    const wrapper = createWrapper()
    LockService.refLocks.set('ref2::s1::o0', 'proj1')
    await wrapper.setData({
      activeRefLocks: [
        { ref_id: 'ref1::s0::o0', user_name: 'Yo Mismo' },
        // Same person in another tab: the name no longer matches, but the local
        // registry still knows this lock is ours.
        { ref_id: 'ref2::s1::o0', user_name: 'Yo Mismo (otra pestaña)' }
      ]
    })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(false)
    expect(wrapper.vm.isRefLocked('ref2')).toBe(false)
    wrapper.destroy()
  })

  it('nombra a quien tiene el estudio, sea por el estudio entero o por una hoja', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({
      activeRefLocks: [
        { ref_id: 'ref1', user_name: 'Ana' },
        { ref_id: 'ref2::s0::o0', user_name: 'Beto' }
      ]
    })
    expect(wrapper.vm.refLockedByName('ref1')).toContain('Ana')
    expect(wrapper.vm.refLockedByName('ref2')).toContain('Beto')
    expect(wrapper.vm.refLockedByName('ref3')).toBe('')
    wrapper.destroy()
  })

  it('fetchAndUpdateRefLocks actualiza activeRefLocks', async () => {
    LockService.fetchRefLocks.mockResolvedValue([{ ref_id: 'ref1', user_name: 'Ana' }])
    const wrapper = createWrapper()
    await wrapper.vm.fetchAndUpdateRefLocks()
    await flushPromises()
    expect(wrapper.vm.activeRefLocks).toEqual([{ ref_id: 'ref1', user_name: 'Ana' }])
    wrapper.destroy()
  })

  it('re-pollea al recibir el evento window ref-locks-changed', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    LockService.fetchRefLocks.mockClear()
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    await flushPromises()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })
})

describe('StepFour.vue — lock a nivel modal (una adquisición por estudio)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  // The bare study lock (endpoint B on isoqf_characteristics) is NOT taken on open
  // any more: it clashes with every cell of the same study, so holding it from the
  // moment the modal opened made the first reader block the other nine cells for
  // everybody. Now it is acquired on demand, when a study field is actually edited.
  it('openModal toma sólo el lock de la celda, no el del estudio', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1::s0::o0')
    expect(LockService.acquireRef).not.toHaveBeenCalledWith('proj1', 'ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })

  it('marca isRefReadOnly y notifica cuando el lock devuelve 409', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana López' })
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBe('Ana López')
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.ref_locked_by {"user":"Ana López"}')
    wrapper.destroy()
  })

  it('marca isRefReadOnly SIN nombre de usuario y notifica "permisos revocados" cuando el lock devuelve permissionDenied (403)', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBeNull()
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
    wrapper.destroy()
  })

  it('al cambiar de pestaña libera la hoja anterior y toma la nueva, sin soltar el estudio', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    LockService.acquireRef.mockClear()
    LockService.releaseRef.mockClear()

    wrapper.vm.selectedMeta = 2
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1::s0::o0')
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1::s0::o2')
    // The bare study lock is untouched — Step 3 fields stay editable.
    expect(LockService.releaseRef).not.toHaveBeenCalledWith('ref1')
    wrapper.destroy()
  })

  it('al cambiar de etapa toma la hoja de la etapa nueva', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    LockService.acquireRef.mockClear()

    wrapper.vm.goToStage(3)
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1::s3::o0')
    wrapper.destroy()
  })

  it('no toma locks de celda cuando canEdit es false', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('no toma locks de celda con el modal cerrado', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    LockService.acquireRef.mockClear()

    wrapper.vm.selectedMeta = 1
    await flushPromises()

    expect(LockService.acquireRef).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  // The /refs listing lets the UI disable cells before anyone clicks, instead of
  // letting the user type and then rejecting the save.
  it('deshabilita solo las celdas que otro tiene tomadas, no el estudio entero', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    await wrapper.setData({
      activeRefLocks: [{ ref_id: 'ref1::s0::o2', user_name: 'Ana' }]
    })

    expect(wrapper.vm.isCellReadOnly(0, 2)).toBe(true)
    expect(wrapper.vm.isCellReadOnly(0, 1)).toBe(false)
    expect(wrapper.vm.isCellReadOnly(3, 0)).toBe(false)
    wrapper.destroy()
  })

  it('deshabilita las 10 celdas cuando el estudio entero está en solo lectura', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ isRefReadOnly: true })

    expect(wrapper.vm.isCellReadOnly(0, 0)).toBe(true)
    expect(wrapper.vm.isCellReadOnly(3, 0)).toBe(true)
    wrapper.destroy()
  })

  it('no deshabilita celdas con el modal cerrado', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({
      activeRefLocks: [{ ref_id: 'ref1::s0::o2', user_name: 'Ana' }]
    })

    expect(wrapper.vm.pollBlockedCells).toEqual([])
    wrapper.destroy()
  })

  describe('cuando no se puede tomar el lock de una celda', () => {
    async function openModalOn (wrapper, stage, tab) {
      wrapper.vm.openModal(stage, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, tab)
      await flushPromises()
    }

    it('marca en solo lectura la celda rechazada y deja el resto editable', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      LockService.acquireRef.mockImplementation((_p, ref) => Promise.resolve(
        ref === 'ref1::s0::o1' ? { success: false, lockedBy: 'Ana' } : { success: true }
      ))

      await openModalOn(wrapper, 0, 1)

      expect(wrapper.vm.isCellReadOnly(0, 1)).toBe(true)
      expect(wrapper.vm.isCellReadOnly(0, 2)).toBe(false)
      // Only the cell — the study fields of Step 3 keep their own lock.
      expect(wrapper.vm.isRefReadOnly).toBe(false)
      wrapper.destroy()
    })

    it('guarda quién tiene la celda y avisa al usuario', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      LockService.acquireRef.mockImplementation((_p, ref) => Promise.resolve(
        ref === 'ref1::s0::o0' ? { success: false, lockedBy: 'Ana López' } : { success: true }
      ))

      await openModalOn(wrapper, 0, 0)

      expect(wrapper.vm.leafLockedBy).toBe('Ana López')
      expect(wrapper.vm.$notify.warning)
        .toHaveBeenCalledWith('lock.ref_locked_by {"user":"Ana López"}')
      wrapper.destroy()
    })

    // A 403 is not "someone else has it": this user's can_write was revoked, so
    // nothing in the study is editable — same call acquireStudyLock makes.
    it('un 403 deja el estudio entero en solo lectura, no una celda', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      LockService.acquireRef.mockImplementation((_p, ref) => Promise.resolve(
        ref.includes('::') ? { success: false, permissionDenied: true } : { success: true }
      ))

      await openModalOn(wrapper, 0, 0)

      expect(wrapper.vm.isRefReadOnly).toBe(true)
      expect(wrapper.vm.leafLockedBy).toBeNull()
      expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
      wrapper.destroy()
    })

    it('libera la marca al volver a una celda que ahora sí se puede tomar', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      // Only the leaf is refused; the bare study lock still succeeds, so the
      // modal as a whole stays editable.
      LockService.acquireRef.mockImplementation((_p, ref) => Promise.resolve(
        ref === 'ref1::s0::o0' ? { success: false, lockedBy: 'Ana' } : { success: true }
      ))
      await openModalOn(wrapper, 0, 0)
      expect(wrapper.vm.isCellReadOnly(0, 0)).toBe(true)

      LockService.acquireRef.mockResolvedValue({ success: true })
      wrapper.vm.selectedMeta = 1
      await flushPromises()
      wrapper.vm.selectedMeta = 0
      await flushPromises()

      expect(wrapper.vm.isCellReadOnly(0, 0)).toBe(false)
      expect(wrapper.vm.leafLockedBy).toBeNull()
      wrapper.destroy()
    })
  })

  it('onAssessmentModalClosed libera el lock, resetea estado y re-pollea', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ isRefReadOnly: true, refLockedBy: 'Ana' })
    LockService.fetchRefLocks.mockClear()
    wrapper.vm.onAssessmentModalClosed()
    await flushPromises()
    expect(LockService.releaseRef).toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    expect(wrapper.vm.refLockedBy).toBeNull()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })
})

describe('StepFour.vue — canEdit gating (read-only user protection)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('acquireStudyLock no llama a LockService.acquireRef cuando canEdit es false', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBeNull()
    wrapper.destroy()
  })

  it('openModal deja el assessment en solo lectura cuando canEdit es false, sin tomar el lock', async () => {
    const wrapper = createWrapper({ canEdit: false })
    await flushPromises()
    const showSpy = jest.spyOn(wrapper.vm.$bvModal, 'show')
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(showSpy).toHaveBeenCalledWith('modal-1')
    wrapper.destroy()
  })

  it('acquireStudyLock sigue adquiriendo el lock cuando canEdit es true (regresión)', async () => {
    const wrapper = createWrapper({ canEdit: true })
    await flushPromises()
    await wrapper.vm.acquireStudyLock('ref1')
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })
})

// "characteristics = un estudio, un usuario": the study fields are locked only while
// somebody edits them, and whoever arrives second is left read-only. Cells stay
// independent — a leaf held by another user must not close the other nine.
describe('StepFour.vue — lock del estudio bajo demanda (campos de characteristics)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  const openStudy = async (wrapper) => {
    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()
    LockService.acquireRef.mockClear()
    LockService.releaseRef.mockClear()
  }

  it('editar un campo del estudio adquiere el lock del estudio en ese momento', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await openStudy(wrapper)

    await wrapper.vm.onStartEditing({ metaIndex: 0, itemIndex: 0, type: 'extractedData' })

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(wrapper.vm.editingField.type).toBe('extractedData')
    wrapper.destroy()
  })

  it('si el estudio ya lo tiene otro, no entra en edición y avisa quién', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await openStudy(wrapper)
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana López' })

    await wrapper.vm.onStartEditing({ metaIndex: 0, itemIndex: 0, type: 'extractedData' })

    expect(wrapper.vm.editingField.type).toBeNull()
    expect(wrapper.vm.studyFieldsReadOnly).toBe(true)
    expect(wrapper.vm.studyFieldsLockedBy).toBe('Ana López')
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.ref_locked_by {"user":"Ana López"}')
    wrapper.destroy()
  })

  it('cancelar la edición libera el lock del estudio pero no el de la celda', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await openStudy(wrapper)
    await wrapper.vm.onStartEditing({ metaIndex: 0, itemIndex: 0, type: 'extractedData' })
    LockService.releaseRef.mockClear()

    wrapper.vm.onCancelEditing()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
    expect(LockService.releaseRef).not.toHaveBeenCalledWith('ref1::s0::o0')
    wrapper.destroy()
  })

  // Both ways out of field editing funnel through cancelEditing(): the Cancel button
  // and saveField() itself once the PATCH resolves (with keepEditing false). Releasing
  // there covers the two, so a saved field does not keep the study locked until the
  // modal closes.
  it('salir del modo edición libera el lock del estudio, por cancelar o por guardar', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await openStudy(wrapper)
    await wrapper.vm.onStartEditing({ metaIndex: 0, itemIndex: 0, type: 'extractedData' })
    LockService.releaseRef.mockClear()

    wrapper.vm.cancelEditing()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
    expect(wrapper.vm.holdsStudyLock).toBe(false)
    wrapper.destroy()
  })

  // The whole point of the change: another user holding ONE cell must not turn the
  // other nine read-only. It does block the study fields, which endpoint B rewrites.
  it('una hoja ajena deja los campos del estudio en solo lectura, sin cerrar las otras celdas', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1::s1::o2', user_name: 'Ana López' }] })

    wrapper.vm.openModal(0, { index: 0, item: { ref_id: 'ref1', authors: 'A' } }, 0)
    await flushPromises()

    expect(wrapper.vm.studyFieldsReadOnly).toBe(true)
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })
})

// The 15s tick that already polls locks now also asks whether anything changed in the
// project, so a user sees the other's saved work without reloading the page.
describe('StepFour.vue — refresco por last_update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.fetchRefLocks.mockResolvedValue([])
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('el tick de polling también consulta la frescura del proyecto', async () => {
    const wrapper = createWrapper()
    const spy = jest.spyOn(wrapper.vm, 'checkProjectFreshness').mockResolvedValue()

    await wrapper.vm.fetchAndUpdateRefLocks()

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
    wrapper.destroy()
  })

  it('recargar significa releer evaluaciones y características', async () => {
    const wrapper = createWrapper()
    const assessments = jest.spyOn(wrapper.vm, 'getAssessments').mockImplementation(() => {})
    const chars = jest.spyOn(wrapper.vm, 'getCharacteristics').mockImplementation(() => {})

    wrapper.vm.applyProjectRefresh()

    expect(assessments).toHaveBeenCalled()
    expect(chars).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('el modal abierto cuenta como editor abierto', async () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
    await wrapper.setData({ isModalOpen: true })
    expect(wrapper.vm.hasOpenEditor()).toBe(true)
    wrapper.destroy()
  })

  it('cerrar el modal aplica el refresco que quedó pendiente', async () => {
    const wrapper = createWrapper()
    const apply = jest.spyOn(wrapper.vm, 'applyProjectRefresh').mockImplementation(() => {})
    await wrapper.setData({ pendingRefresh: true })

    wrapper.vm.onAssessmentModalClosed()
    await flushPromises()

    expect(apply).toHaveBeenCalled()
    wrapper.destroy()
  })
})

// The conflict modal words itself from the source; StepFour is what carries it from
// the event to the prop, so a dropped `source` silently restores the offline wording.
describe('StepFour.vue — origen del conflicto de lock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
  })

  it('propaga el origen "live" del evento al modal de conflicto', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ refId: 'ref1' })

    wrapper.vm.handleRefLockConflict({
      detail: { refId: 'ref1', failedData: { c: 'v' }, lockedBy: 'Ana', source: 'live' }
    })

    expect(wrapper.vm.conflictSource).toBe('live')
    wrapper.destroy()
  })

  it('propaga el origen "replay" del evento al modal de conflicto', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ refId: 'ref1' })

    wrapper.vm.handleRefLockConflict({
      detail: { refId: 'ref1', failedData: { c: 'v' }, lockedBy: 'Ana', source: 'replay' }
    })

    expect(wrapper.vm.conflictSource).toBe('replay')
    wrapper.destroy()
  })
})

// The reported symptom: "user 2 could edit the finding, but user 1 was still looking
// at the assessment modal". StepFour listened for `ref-locks-changed` and for the
// conflict on save, but never for `ref-lock-lost` — so a lock taken away mid-edit left
// the open modal fully writable until the save was rejected.
describe('StepFour.vue — pérdida del lock con el modal abierto', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
  })

  it('pasa el estudio a solo lectura cuando pierde el lock del estudio abierto', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ isModalOpen: true, refId: 'ref1', holdsStudyLock: true })

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'ref1', lockedBy: 'Ana Pérez' }
    }))
    await flushPromises()

    expect(wrapper.vm.isRefReadOnly).toBe(true)
    expect(wrapper.vm.refLockedBy).toBe('Ana Pérez')
    // The study lock is gone: believing we still hold it would skip re-acquiring it.
    expect(wrapper.vm.holdsStudyLock).toBe(false)
    expect(wrapper.vm.studyFieldsReadOnly).toBe(true)
    wrapper.destroy()
  })

  it('marca solo la celda cuando lo perdido es la hoja abierta, no el estudio', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({
      isModalOpen: true,
      refId: 'ref1',
      modal: { stage: 1, index: 0, faLabel: null },
      selectedMeta: 2
    })

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'ref1::s1::o2', lockedBy: 'Ana Pérez' }
    }))
    await flushPromises()

    expect(wrapper.vm.isCellReadOnly(1, 2)).toBe(true)
    // A single lost cell must not freeze the whole study.
    expect(wrapper.vm.isRefReadOnly).toBe(false)
    wrapper.destroy()
  })

  it('ignora la pérdida de un lock de otro estudio', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ isModalOpen: true, refId: 'ref1', holdsStudyLock: true })

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'ref9', lockedBy: 'Ana Pérez' }
    }))
    await flushPromises()

    expect(wrapper.vm.isRefReadOnly).toBe(false)
    expect(wrapper.vm.holdsStudyLock).toBe(true)
    wrapper.destroy()
  })

  it('deja de escuchar el aviso al destruirse', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    const wrapper = createWrapper()
    wrapper.destroy()
    expect(removeSpy).toHaveBeenCalledWith('ref-lock-lost', expect.any(Function))
    removeSpy.mockRestore()
  })
})
