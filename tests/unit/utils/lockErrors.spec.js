import { isLockRejection } from '@/utils/lockErrors'

const rejection = (status, url) => ({
  config: { url },
  response: { status, data: {} }
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

  it('no reclama un error de red sin respuesta', () => {
    expect(isLockRejection(new Error('Network Error'))).toBe(false)
  })

  it('tolera un error nulo', () => {
    expect(isLockRejection(null)).toBe(false)
  })
})
