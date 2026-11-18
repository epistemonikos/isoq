// Las URLs de columna necesitan su clave de lock: `<doc_id>::fields`.
//
// Los cuatro endpoints granulares de columna EXIGEN el lock cuando la concurrencia está
// encendida (409 `lock_not_held` sin él), y la unidad de bloqueo es el documento de la
// tabla, no una fila (docs/respuesta-backend-columnas-contrato-ejecucion.md §C6).
//
// De esa clave dependen dos mecanismos que ya existen y que si no la derivan, fallan en
// silencio:
//   - `queuedLockContext` (Api.js:75) la guarda con la operación encolada, y
//     `syncPendingOperations` (:533) la usa para readquirir el lock antes de reproducirla.
//     Sin clave, un alta de columna hecha offline se reproduce sin lock → 409 y se pierde.
//   - el interceptor de 409 (:127) la usa para avisarle al usuario quién tiene la entidad.
import { refLockKeyFromUrl } from '@/utils/Api'

describe('refLockKeyFromUrl — endpoints de columna', () => {
  it('deriva <doc_id>::fields del alta/renombrado de una columna', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_characteristics/doc123/field/column_abc'))
      .toBe('doc123::fields')
  })

  it('deriva <doc_id>::fields del borrado de una columna', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_characteristics/doc123/field/column_6a70ddb2'))
      .toBe('doc123::fields')
  })

  it('deriva <doc_id>::fields del reordenamiento', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_characteristics/doc123/fields/order'))
      .toBe('doc123::fields')
  })

  it('vale igual para isoqf_assessments', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_assessments/tbl9/field/column_x'))
      .toBe('tbl9::fields')
  })

  // El lock de columnas y el de fila son distintos a propósito: quien edita columnas no
  // debe bloquear a quien edita un estudio. Confundirlos reintroduce el bloqueo global
  // que se sacó del Paso 4.
  it('no se confunde con la escritura de una fila, que bloquea el ref', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_characteristics/doc123/item/R1'))
      .toBe('R1')
  })

  it('devuelve null para el PATCH de la colección plana, que no es granular', () => {
    expect(refLockKeyFromUrl('http://api/api/isoqf_characteristics/doc123'))
      .toBeNull()
  })
})
