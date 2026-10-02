import {
  CATEGORIES_LOCK_KEY,
  findCategoriesLock,
  categoriesLockMessageKey,
  isCategoriesLockRejection
} from '@/utils/categoriesLock'

describe('categoriesLock — la clave', () => {
  it('es la que exige el servidor', () => {
    expect(CATEGORIES_LOCK_KEY).toBe('list_categories')
  })
})

describe('findCategoriesLock', () => {
  const lock = (ref_id, user_id, user_name = 'Ana') => ({ ref_id, user_id, user_name })

  it('devuelve el lock de otra persona sobre la clave', () => {
    const other = lock('list_categories', 'u-ana')
    expect(findCategoriesLock([lock('r1', 'u-ana'), other], 'u-me')).toBe(other)
  })

  it('uno propio (otra pestaña) cuenta como libre, aunque el id venga como número', () => {
    expect(findCategoriesLock([lock('list_categories', 7)], '7')).toBeNull()
  })

  it('otra clave no cuenta, ni siquiera la de Propiedades', () => {
    expect(findCategoriesLock([lock('project_properties', 'u-ana')], 'u-me')).toBeNull()
  })

  it('tolera un listado ausente', () => {
    expect(findCategoriesLock(undefined, 'u-me')).toBeNull()
  })
})

describe('categoriesLockMessageKey', () => {
  it.each([
    ['denied', 'Ana', 'lock.categories_locked_by'],
    ['denied', null, 'lock.categories_unavailable'],
    ['lost', 'Ana', 'lock.categories_lost_to'],
    ['lost', null, 'lock.categories_lost'],
    ['forbidden', null, 'lock.permissions_revoked'],
    ['released_idle', null, 'lock.categories_released_idle'],
    ['held', null, null],
    ['acquiring', null, null],
    ['idle', null, null],
    ['un_estado_que_todavia_no_existe', 'Ana', null]
  ])('%s / %s → %s', (status, lockedBy, expected) => {
    expect(categoriesLockMessageKey(status, lockedBy)).toBe(expected)
  })
})

describe('isCategoriesLockRejection', () => {
  const rejection = (status, data) => ({ response: { status, data } })

  it('un 409 locked_by_other_user es un rechazo por lock', () => {
    expect(isCategoriesLockRejection(rejection(409, { reason: 'locked_by_other_user', locked_by: 'Ana' }))).toBe(true)
  })

  it.each([
    ['nombre repetido', rejection(409, { reason: 'duplicate_key' })],
    ['409 sin reason', rejection(409, {})],
    ['un motivo que este cliente no conoce', rejection(409, { reason: 'un_motivo_que_todavia_no_existe' })],
    ['403', rejection(403, { reason: 'locked_by_other_user' })],
    ['500', rejection(500, {})],
    ['error de red', { message: 'Network Error' }],
    ['nada', undefined]
  ])('%s no lo es', (_, error) => {
    expect(isCategoriesLockRejection(error)).toBe(false)
  })
})
