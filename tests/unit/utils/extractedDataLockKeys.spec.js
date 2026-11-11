import { extractedDataRowLockKey, isExtractedDataRowLockKey, foreignRowLock } from '@/utils/extractedDataLockKeys'
import { refLockKeyFromUrl } from '@/utils/refLockUrls'
import { lockBaseOf } from '@/utils/worksheetLockScope'

// Contrato con `auth_server/libs/extracted_data.py` (ED_ROW_REF_LOCK_FORMAT).
describe('extractedDataRowLockKey()', () => {
  it('compone `<doc_id>::ed::<ref_id>`', () => {
    expect(extractedDataRowLockKey('ed1', 'R1')).toBe('ed1::ed::R1')
  })

  it('sin documento o sin ref devuelve null, nunca una clave con `undefined`', () => {
    expect(extractedDataRowLockKey(undefined, 'R1')).toBeNull()
    expect(extractedDataRowLockKey('ed1', null)).toBeNull()
    expect(extractedDataRowLockKey('', '')).toBeNull()
  })
})

describe('isExtractedDataRowLockKey()', () => {
  it('reconoce la clave de fila', () => {
    expect(isExtractedDataRowLockKey('ed1::ed::R1')).toBe(true)
  })

  it('no confunde las otras formas', () => {
    expect(isExtractedDataRowLockKey('R1')).toBe(false)
    expect(isExtractedDataRowLockKey('f1::ep::coherence')).toBe(false)
    expect(isExtractedDataRowLockKey('R1::s0::o2')).toBe(false)
    expect(isExtractedDataRowLockKey('doc1::fields')).toBe(false)
    expect(isExtractedDataRowLockKey(null)).toBe(false)
  })
})

// La clave que el interceptor de 409 y la cola offline derivan de la URL tiene que ser
// la MISMA que sostiene el editor: si no, el 409 queda mudo y el replay re-adquiere un
// lock que el servidor ya no mira.
describe('refLockKeyFromUrl — endpoint C', () => {
  it('deriva la clave de fila, no el ref pelado', () => {
    expect(refLockKeyFromUrl('/isoqf_extracted_data/ed1/item/R1')).toBe('ed1::ed::R1')
  })

  it('tolera query string y URL absoluta', () => {
    expect(refLockKeyFromUrl('/isoqf_extracted_data/ed1/item/R1?x=1')).toBe('ed1::ed::R1')
    expect(refLockKeyFromUrl('https://api.example.org/api/isoqf_extracted_data/ed1/item/R1'))
      .toBe('ed1::ed::R1')
  })

  it('las filas de los Pasos 3/4 siguen bloqueando el estudio pelado', () => {
    expect(refLockKeyFromUrl('/isoqf_characteristics/c1/item/R1')).toBe('R1')
    expect(refLockKeyFromUrl('/isoqf_assessments/a1/item/R1')).toBe('R1')
  })
})

describe('lockBaseOf — la fila cuelga de su documento', () => {
  it('la base es el documento de datos extraídos', () => {
    expect(lockBaseOf('ed1::ed::R1')).toBe('ed1')
  })
})

describe('foreignRowLock()', () => {
  const locks = [
    { ref_id: 'ed1::ed::R1', user_name: 'Ana' },
    { ref_id: 'R2', user_name: 'Beto' }
  ]

  it('devuelve el lock de esa fila de ese documento', () => {
    expect(foreignRowLock(locks, 'ed1', 'R1')).toEqual({ ref_id: 'ed1::ed::R1', user_name: 'Ana' })
  })

  it('la misma referencia en OTRO documento no está tomada', () => {
    expect(foreignRowLock(locks, 'ed2', 'R1')).toBeNull()
  })

  it('el estudio pelado (Paso 3) no bloquea la fila', () => {
    expect(foreignRowLock(locks, 'ed1', 'R2')).toBeNull()
  })

  it('sin documento o sin listado no hay nada tomado', () => {
    expect(foreignRowLock(locks, undefined, 'R1')).toBeNull()
    expect(foreignRowLock(undefined, 'ed1', 'R1')).toBeNull()
  })
})
