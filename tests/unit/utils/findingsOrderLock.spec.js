import {
  FINDINGS_ORDER_LOCK_KEY,
  findingsOrderLockMessageKey,
  reconcileFindingsOrder
} from '@/utils/findingsOrderLock'

describe('findingsOrderLock — la clave', () => {
  it('es la que exige el servidor', () => {
    expect(FINDINGS_ORDER_LOCK_KEY).toBe('findings_order')
  })
})

describe('findingsOrderLockMessageKey', () => {
  it.each([
    ['denied', 'Ana', 'lock.findings_order_locked_by'],
    ['denied', null, 'lock.findings_order_unavailable'],
    ['lost', 'Ana', 'lock.findings_order_lost_to'],
    ['lost', null, 'lock.findings_order_lost'],
    ['forbidden', null, 'lock.permissions_revoked'],
    ['released_idle', null, 'lock.findings_order_released_idle'],
    ['held', null, null],
    ['un_estado_que_todavia_no_existe', 'Ana', null]
  ])('%s / %s → %s', (status, lockedBy, expected) => {
    expect(findingsOrderLockMessageKey(status, lockedBy)).toBe(expected)
  })
})

describe('reconcileFindingsOrder', () => {
  const f = (id, name = id) => ({ id, name })

  it('sin cambios conserva el orden elegido y no marca nada', () => {
    const r = reconcileFindingsOrder([f('c'), f('a'), f('b')], [f('a'), f('b'), f('c')])
    expect(r.lists.map(l => l.id)).toEqual(['c', 'a', 'b'])
    expect(r.changed).toBe(false)
    expect(r.added).toEqual([])
    expect(r.removed).toEqual([])
  })

  it('un finding nuevo va al final, después del orden elegido', () => {
    const r = reconcileFindingsOrder([f('b'), f('a')], [f('a'), f('n'), f('b')])
    expect(r.lists.map(l => l.id)).toEqual(['b', 'a', 'n'])
    expect(r.added.map(l => l.id)).toEqual(['n'])
    expect(r.changed).toBe(true)
  })

  it('un finding borrado sale de la lista', () => {
    const r = reconcileFindingsOrder([f('b'), f('x'), f('a')], [f('a'), f('b')])
    expect(r.lists.map(l => l.id)).toEqual(['b', 'a'])
    expect(r.removed.map(l => l.id)).toEqual(['x'])
    expect(r.changed).toBe(true)
  })

  it('usa los datos frescos: un título cambiado se ve, y no cuenta como cambio de lista', () => {
    const r = reconcileFindingsOrder([f('a', 'viejo')], [f('a', 'nuevo')])
    expect(r.lists[0].name).toBe('nuevo')
    expect(r.changed).toBe(false)
  })

  it('tolera listas ausentes', () => {
    expect(reconcileFindingsOrder(undefined, undefined)).toEqual({ lists: [], added: [], removed: [], changed: false })
  })
})
