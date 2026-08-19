import axios from 'axios'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import { getPendingOperations, removePendingOperation, addPendingOperation } from '@/services/db'

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn().mockResolvedValue(1),
  getPendingOperations: jest.fn().mockResolvedValue([]),
  removePendingOperation: jest.fn().mockResolvedValue(undefined),
  getPendingOperationsCount: jest.fn().mockResolvedValue(0)
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))
jest.mock('@/utils/OfflineStrategies', () => ({ strategies: [] }))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn().mockResolvedValue(undefined),
    refLocks: new Map(),
    offlineRefs: new Map()
  }
}))

// A queued granular write replays with no lock, so with the flag on the backend
// answers 409 `lock_not_held` — the write is lost and (for endpoint A) silently.
// The replay has to acquire the lock itself, and give up loudly when it cannot.
describe('Api.syncPendingOperations() — locks al reproducir la cola', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.setOnline(true)
    LockService.acquireRef.mockResolvedValue({ success: true })
    LockService.refLocks.clear()
    LockService.offlineRefs.clear()
    axios.patch.mockResolvedValue({ data: {} })
    axios.post.mockResolvedValue({ data: {} })
    jest.spyOn(window, 'dispatchEvent').mockImplementation(() => true)
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  const granularOp = (overrides = {}) => ({
    id: 7,
    method: 'PATCH',
    endpoint: '/api/isoqf_extracted_data/ed1/item/ref1',
    payload: { ref_id: 'ref1', column_0: 'escrito sin conexión' },
    lockRef: 'ref1',
    lockProjectId: 'proj1',
    ...overrides
  })

  it('adquiere el lock del ref antes de reproducir la operación', async () => {
    getPendingOperations.mockResolvedValue([granularOp()])

    await Api.syncPendingOperations()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ref1')
    expect(axios.patch).toHaveBeenCalledWith(
      '/api/isoqf_extracted_data/ed1/item/ref1',
      { ref_id: 'ref1', column_0: 'escrito sin conexión' },
      expect.any(Object)
    )
    expect(removePendingOperation).toHaveBeenCalledWith(7)
  })

  it('libera el lock después de reproducir', async () => {
    getPendingOperations.mockResolvedValue([granularOp()])

    await Api.syncPendingOperations()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ref1')
  })

  it('no reproduce y avisa el conflicto cuando otro usuario tiene el lock', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    getPendingOperations.mockResolvedValue([granularOp()])

    await Api.syncPendingOperations()

    expect(axios.patch).not.toHaveBeenCalled()
    // The change cannot be saved, but it must not be lost silently either: the same
    // channel the interceptor uses carries the payload so the user can recover it.
    const event = window.dispatchEvent.mock.calls
      .map(([e]) => e).find(e => e.type === 'ref-lock-conflict')
    expect(event).toBeTruthy()
    expect(event.detail).toEqual({
      refId: 'ref1',
      failedData: { ref_id: 'ref1', column_0: 'escrito sin conexión' },
      lockedBy: 'Ana Pérez',
      // This one really did happen offline, so the offline wording is the honest one.
      source: 'replay'
    })
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      'conflict_ref_ref1', expect.stringContaining('Ana Pérez')
    )
  })

  it('descarta de la cola la operación en conflicto para no reintentar para siempre', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    getPendingOperations.mockResolvedValue([granularOp()])

    await Api.syncPendingOperations()

    expect(removePendingOperation).toHaveBeenCalledWith(7)
    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('reproduce sin pedir lock las operaciones que no son granulares', async () => {
    getPendingOperations.mockResolvedValue([{
      id: 8, method: 'PATCH', endpoint: '/api/isoqf_lists/list1', payload: { name: 'x' }
    }])

    await Api.syncPendingOperations()

    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalled()
  })

  it('reproduce igual una operación granular encolada antes de que se guardara el projectId', async () => {
    getPendingOperations.mockResolvedValue([granularOp({ lockProjectId: undefined })])

    await Api.syncPendingOperations()

    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(axios.patch).toHaveBeenCalled()
  })
})

describe('Api.patch() — guarda el contexto de lock al encolar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
    LockService.offlineRefs.clear()
    Api.setOnline(false)
  })

  afterEach(() => Api.setOnline(true))

  it('guarda lockRef y lockProjectId de un PATCH granular usando el permiso offline', async () => {
    LockService.offlineRefs.set('ref1', 'proj1')

    await Api.patch('/isoqf_extracted_data/ed1/item/ref1', { ref_id: 'ref1', column_0: 'v' })

    expect(addPendingOperation).toHaveBeenCalledWith(expect.objectContaining({
      lockRef: 'ref1',
      lockProjectId: 'proj1'
    }))
  })

  it('guarda el contexto de un PATCH por sección con el id del documento', async () => {
    LockService.offlineRefs.set('finding1', 'proj1')

    await Api.patch('/isoqf_findings/finding1/section/coherence', { option: 2 })

    expect(addPendingOperation).toHaveBeenCalledWith(expect.objectContaining({
      lockRef: 'finding1',
      lockProjectId: 'proj1'
    }))
  })

  it('no inventa contexto de lock para un PATCH genérico', async () => {
    await Api.patch('/isoqf_lists/list1', { name: 'x' })

    const call = addPendingOperation.mock.calls[0][0]
    expect(call.lockRef).toBeUndefined()
    expect(call.lockProjectId).toBeUndefined()
  })
})
