import { isLockRejection, isVersionRejection } from '@/utils/lockErrors'

const rejection = (status, url, data = {}) => ({
  config: { url },
  response: { status, data }
})

// A granular write rejected for lock reasons is already explained to the user by the
// conflict channel ("X is editing this entry now, your text was kept locally"). The
// generic "could not save, please try again" that every catch adds on top is both
// redundant and wrong: retrying cannot work while somebody else holds the lock.
describe('isLockRejection() — rechazos que ya tienen su propio aviso', () => {
  it('reconoce el 409 de una escritura granular por celda', () => {
    expect(isLockRejection(rejection(409, '/isoqf_assessments/a1/item/ref1/stage/0/option/0'))).toBe(true)
  })

  it('reconoce el 409 de una escritura granular por estudio', () => {
    expect(isLockRejection(rejection(409, '/isoqf_characteristics/c1/item/ref1'))).toBe(true)
  })

  // 403 means the user's can_write was revoked: also announced on its own channel
  // (`permission-denied`), so the generic message is noise there too.
  it('reconoce el 403 de permiso revocado en una escritura granular', () => {
    expect(isLockRejection(rejection(403, '/isoqf_characteristics/c1/item/ref1'))).toBe(true)
  })

  it('no reclama un fallo de servidor: ese sí merece el mensaje genérico', () => {
    expect(isLockRejection(rejection(500, '/isoqf_assessments/a1/item/ref1'))).toBe(false)
  })

  it('no reclama un 409 de un endpoint que no es granular', () => {
    expect(isLockRejection(rejection(409, '/isoqf_projects/p1'))).toBe(false)
  })

  // El 409 de versión llega por la misma URL granular que el de lock, pero NO tiene
  // aviso propio: el canal de conflicto habla de locks, y acá el usuario sí tiene el
  // suyo. Silenciarlo dejaría un guardado perdido sin una sola señal.
  it('no reclama el 409 de conflicto de versión: ese necesita su propio aviso', () => {
    const err = rejection(409, '/isoqf_characteristics/c1/item/ref1', {
      reason: 'version_conflict',
      expected_version: 2,
      current_version: 5,
      item: { ref_id: 'ref1', column_0: 'lo que escribió el otro' }
    })
    expect(isLockRejection(err)).toBe(false)
  })

  // Un `_v` mal formado es un error nuestro de programación, no un conflicto: merece
  // el mensaje genérico y, sobre todo, no debe silenciarse.
  it('no reclama el 400 de versión inválida', () => {
    const err = rejection(400, '/isoqf_characteristics/c1/item/ref1', {
      reason: 'invalid_version'
    })
    expect(isLockRejection(err)).toBe(false)
  })

  it('no reclama un error de red sin respuesta', () => {
    expect(isLockRejection(new Error('Network Error'))).toBe(false)
  })

  it('tolera un error nulo', () => {
    expect(isLockRejection(null)).toBe(false)
  })
})

// El status y la URL de un rechazo por versión son idénticos a los de uno por lock, así
// que el `reason` del cuerpo es lo único que los separa. De acá cuelgan tres decisiones:
// qué cartel ve la persona, si el editor silencia su mensaje de guardado, y si la
// operación encolada se reintenta o se descarta.
describe('isVersionRejection() — el otro eje', () => {
  it('reconoce el conflicto de versión', () => {
    expect(isVersionRejection(rejection(409, '/x/1/item/r1', { reason: 'version_conflict' }))).toBe(true)
  })

  it('reconoce la versión mal formada', () => {
    expect(isVersionRejection(rejection(400, '/x/1/item/r1', { reason: 'invalid_version' }))).toBe(true)
  })

  // Un 409 sin `reason` es un conflicto de lock: es lo que era todo 409 antes de que
  // existiera este control, y hay pestañas viejas y servidores sin desplegar que lo mandan
  // así. El default tiene que caer del lado del comportamiento anterior.
  it('no reclama un 409 sin motivo declarado', () => {
    expect(isVersionRejection(rejection(409, '/x/1/item/r1'))).toBe(false)
  })

  // La lista es una ALLOWLIST de motivos de versión, no una denylist de motivos de lock, y
  // eso es lo que hace seguro que el servidor invente motivos nuevos: caen por default en
  // la rama de lock, que es donde corresponden. Escrito al revés, cada motivo nuevo habría
  // caído en la rama equivocada. Los tres del latido son la prueba viva.
  it.each([
    'locked_by_other_user',
    'lock_not_held',
    'evicted_granularity_conflict',
    'lock_expired',
    'un_motivo_que_todavia_no_existe'
  ])('no reclama el motivo de lock %s', (reason) => {
    expect(isVersionRejection(rejection(409, '/x/1/item/r1', { reason }))).toBe(false)
  })

  it('tolera un error sin respuesta y uno nulo', () => {
    expect(isVersionRejection(new Error('Network Error'))).toBe(false)
    expect(isVersionRejection(null)).toBe(false)
  })
})
