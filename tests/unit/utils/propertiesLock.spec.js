import { PROPERTIES_LOCK_KEY, findPropertiesLock, propertiesLockMessageKey } from '@/utils/propertiesLock'

describe('findPropertiesLock', () => {
  const ana = { ref_id: 'project_properties', user_id: 'u-ana', user_name: 'Ana' }

  it('la clave es la acordada con backend', () => {
    expect(PROPERTIES_LOCK_KEY).toBe('project_properties')
  })

  it('devuelve el lock ajeno sobre la clave', () => {
    expect(findPropertiesLock([ana], 'u-me')).toBe(ana)
  })

  it('un lock mío (otra pestaña del navegador) cuenta como libre', () => {
    expect(findPropertiesLock([{ ...ana, user_id: 'u-me' }], 'u-me')).toBeNull()
  })

  it('compara ids como texto: el servidor puede mandar número o string', () => {
    expect(findPropertiesLock([{ ...ana, user_id: 7 }], '7')).toBeNull()
  })

  it('ignora otras claves y listas vacías o ausentes', () => {
    expect(findPropertiesLock([{ ...ana, ref_id: 'R1' }], 'u-me')).toBeNull()
    expect(findPropertiesLock([], 'u-me')).toBeNull()
    expect(findPropertiesLock(undefined, 'u-me')).toBeNull()
  })
})

describe('propertiesLockMessageKey', () => {
  it.each([
    ['denied', 'Ana', 'lock.properties_locked_by'],
    ['denied', null, 'lock.properties_unavailable'],
    ['lost', 'Ana', 'lock.properties_lost_to'],
    ['lost', null, 'lock.properties_lost'],
    ['forbidden', null, 'lock.permissions_revoked'],
    ['released_idle', null, 'lock.properties_released_idle']
  ])('%s con %s → %s', (status, lockedBy, key) => {
    expect(propertiesLockMessageKey(status, lockedBy)).toBe(key)
  })

  it.each(['idle', 'acquiring', 'held', 'un_estado_que_todavia_no_existe'])('%s no muestra cartel', (status) => {
    expect(propertiesLockMessageKey(status, 'Ana')).toBeNull()
  })
})
