// La clave de lock del documento de tabla, en un solo lugar.
//
// `<doc_id>::fields` estaba armada a mano con un template en cinco sitios
// (`ManageColumnsButton` ×3, `crudTables`, y el propio `refLockKeyFromUrl`), y el aviso de
// import necesitaba además LEERLA para distinguir un lock de columnas de uno de estudio.
// Seis copias de un formato de clave es el punto donde un typo deja un lock que nadie
// suelta y otro que nadie encuentra: `acquireRef` y `releaseRef` se buscan por igualdad de
// string, así que la falla no es un error sino un silencio.
//
// La unidad de bloqueo es el DOCUMENTO y no la fila, y eso es a propósito: quien edita
// columnas no debe bloquear a quien edita un estudio
// (docs/respuesta-backend-columnas-contrato-ejecucion.md §C6).
import { fieldsLockKey, docIdFromFieldsLockKey } from '@/utils/refLockUrls'

describe('fieldsLockKey()', () => {
  it('arma la clave del documento', () => {
    expect(fieldsLockKey('doc123')).toBe('doc123::fields')
  })

  it('sin documento no hay clave, en vez de una clave rota', () => {
    // `undefined::fields` es un lock que se toma sobre nada y no se suelta nunca, porque
    // el release lo va a buscar con otro valor. Mejor que el llamador no tenga clave y se
    // dé cuenta.
    expect(fieldsLockKey('')).toBe(null)
    expect(fieldsLockKey(undefined)).toBe(null)
    expect(fieldsLockKey(null)).toBe(null)
  })
})

describe('docIdFromFieldsLockKey()', () => {
  it('extrae el documento de una clave de columnas', () => {
    expect(docIdFromFieldsLockKey('doc123::fields')).toBe('doc123')
  })

  it('una clave de fila no es una clave de columnas', () => {
    expect(docIdFromFieldsLockKey('R1')).toBe(null)
  })

  it('una celda del Paso 4 tampoco', () => {
    expect(docIdFromFieldsLockKey('R1::s0::o2')).toBe(null)
  })

  it('tolera vacío y nulo', () => {
    expect(docIdFromFieldsLockKey('')).toBe(null)
    expect(docIdFromFieldsLockKey(undefined)).toBe(null)
  })

  it('ida y vuelta', () => {
    expect(docIdFromFieldsLockKey(fieldsLockKey('doc123'))).toBe('doc123')
  })
})
