import {
  REFERENCE_DELETED_EVENT,
  studyOfLockKey,
  isReferenceDeletedRejection,
  announceReferenceDeleted,
  referenceDeletedMessageKey,
  studyHolders,
  existingReferenceIds,
  announceDroppedReferences
} from '@/utils/referenceDeleted'
import { isLockRejection } from '@/utils/lockErrors'
import { writeErrorMessageKey } from '@/utils/writeErrors'

const deletedError = (data = {}) => ({
  config: { url: '/isoqf_characteristics/doc1/item/R1', method: 'patch' },
  response: { status: 409, data: { reason: 'reference_deleted', ...data } }
})

describe('studyOfLockKey — el estudio de cualquier granularidad', () => {
  it.each([
    ['R1', 'R1'],
    ['R1::s0::o2', 'R1'],
    ['ed1::ed::R1', 'R1'],
    ['F1::ep::coherence', 'F1::ep::coherence'],
    ['list_categories', 'list_categories']
  ])('%s -> %s', (key, study) => {
    expect(studyOfLockKey(key)).toBe(study)
  })

  it('devuelve null sin clave', () => {
    expect(studyOfLockKey(null)).toBeNull()
    expect(studyOfLockKey('')).toBeNull()
  })
})

describe('isReferenceDeletedRejection', () => {
  it('reconoce el 409 reference_deleted', () => {
    expect(isReferenceDeletedRejection(deletedError())).toBe(true)
  })

  it('no confunde otros 409 ni el mismo motivo con otro status', () => {
    expect(isReferenceDeletedRejection({ response: { status: 409, data: { reason: 'locked_by_other_user' } } })).toBe(false)
    expect(isReferenceDeletedRejection({ response: { status: 400, data: { reason: 'reference_deleted' } } })).toBe(false)
    expect(isReferenceDeletedRejection(null)).toBe(false)
  })

  // No es un conflicto de lock: el canal de locks nombraría a un titular que no existe.
  it('no cuenta como rechazo de lock ni deja un aviso genérico encima del suyo', () => {
    expect(isLockRejection(deletedError())).toBe(false)
    expect(writeErrorMessageKey(deletedError())).toBeNull()
  })

  // Allowlist: un motivo que este cliente no conoce sigue cayendo en la rama de lock.
  it('un motivo desconocido sigue siendo un rechazo de lock', () => {
    const err = deletedError()
    err.response.data.reason = 'un_motivo_que_todavia_no_existe'
    expect(isLockRejection(err)).toBe(true)
  })
})

describe('referenceDeletedMessageKey', () => {
  it.each([
    ['lock', 'Ana', 'reference_deleted.editor_closed_by'],
    ['lock', null, 'reference_deleted.editor_closed'],
    ['write', 'Ana', 'reference_deleted.not_saved_by'],
    ['write', null, 'reference_deleted.not_saved'],
    ['identity', 'Ana', 'reference_deleted.saved_without_by'],
    ['identity', null, 'reference_deleted.saved_without'],
    ['un_origen_nuevo', 'Ana', 'reference_deleted.editor_closed_by']
  ])('%s / %s -> %s', (source, by, key) => {
    expect(referenceDeletedMessageKey(source, by)).toBe(key)
  })
})

describe('studyHolders — quién usa el estudio, en cualquier granularidad', () => {
  const locks = [
    { ref_id: 'R1', user_id: 'u2', user_name: 'Bea' },
    { ref_id: 'R1::s0::o1', user_id: 'u3', user_name: 'Carlos' },
    { ref_id: 'ed9::ed::R1', user_id: 'u2', user_name: 'Bea' },
    { ref_id: 'R2', user_id: 'u4', user_name: 'Dani' },
    { ref_id: 'R1::s1::o0', user_id: 'me', user_name: 'Yo' }
  ]

  it('junta las tres formas, sin repetir y sin el estudio de al lado', () => {
    expect(studyHolders(locks, 'R1', 'me')).toEqual(['Bea', 'Carlos'])
  })

  it('descarta lo que esta pestaña sostiene aunque el listado no traiga user_id', () => {
    const own = [{ ref_id: 'ed9::ed::R1', user_name: 'Yo' }]
    expect(studyHolders(own, 'R1', null, new Set(['ed9::ed::R1']))).toEqual([])
  })

  it('no se rompe sin locks', () => {
    expect(studyHolders(undefined, 'R1')).toEqual([])
  })
})

describe('existingReferenceIds', () => {
  it('saca los ids que ya no están entre las referencias cargadas', () => {
    expect(existingReferenceIds(['R1', 'R2', 'R3'], [{ id: 'R1' }, { id: 'R3' }])).toEqual(['R1', 'R3'])
  })

  it('sin referencias cargadas no vacía la selección', () => {
    expect(existingReferenceIds(['R1'], [])).toEqual(['R1'])
  })
})

describe('el aviso no se pierde en el camino', () => {
  let events
  const listener = e => events.push(e.detail)
  beforeEach(() => {
    events = []
    window.addEventListener(REFERENCE_DELETED_EVENT, listener)
  })
  afterEach(() => window.removeEventListener(REFERENCE_DELETED_EVENT, listener))

  it('announceReferenceDeleted lleva estudio, quién y origen', () => {
    announceReferenceDeleted({ refId: 'R1', deletedBy: 'Ana', source: 'write' })
    expect(events).toEqual([{ refId: 'R1', deletedBy: 'Ana', source: 'write' }])
  })

  it('dropped_references de /identity sale como un aviso por estudio', () => {
    const n = announceDroppedReferences({
      id: 'f1',
      dropped_references: [{ ref_id: 'R1', deleted_by: 'Ana' }, { ref_id: 'R2', deleted_by: null }]
    })
    expect(n).toBe(2)
    expect(events).toEqual([
      { refId: 'R1', deletedBy: 'Ana', source: 'identity' },
      { refId: 'R2', deletedBy: null, source: 'identity' }
    ])
  })

  it('una respuesta sin el campo no avisa nada', () => {
    expect(announceDroppedReferences({ id: 'f1' })).toBe(0)
    expect(announceDroppedReferences(undefined)).toBe(0)
    expect(events).toEqual([])
  })
})
