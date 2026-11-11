import { leafVersionOf, leafInDocument } from '@/utils/leafVersion'

/**
 * El contador de versión de una celda del Paso 4 (`stages[k].options[i]._v`), que el
 * endpoint D compara. Contrato del servidor (isoq_server, tests/test_assessment_leaf_version.py):
 * una celda sin contador ESTÁ en la versión 0, y lo que no se puede incrementar también
 * cuenta como 0. El cliente manda siempre un entero: nunca `''` ni `undefined`, que el
 * servidor rechaza con 400 `invalid_version` cuando el control está encendido.
 */
describe('leafVersionOf', () => {
  it('lee el contador de la celda', () => {
    expect(leafVersionOf({ option: 'A', text: '', notes: '', _v: 4 })).toBe(4)
  })

  it.each([
    ['sin contador', { option: 'A' }],
    ['celda inexistente', null],
    ['mal formado', { _v: 'abc' }],
    ['vacío', { _v: '' }],
    ['negativo', { _v: -1 }],
    ['no entero', { _v: 1.5 }],
    ['booleano', { _v: true }]
  ])('%s cuenta como 0', (_caso, leaf) => {
    expect(leafVersionOf(leaf)).toBe(0)
  })
})

describe('leafInDocument', () => {
  const doc = {
    items: [
      { ref_id: 'R0', stages: [] },
      {
        ref_id: 'R1',
        stages: [
          { key: 1, options: [{ text: 's1o0', _v: 7 }] },
          // Legado: la key guardada como string.
          { key: '0', options: [{ text: 's0o0' }, { text: 's0o1', _v: 3 }] }
        ]
      }
    ]
  }

  it('ubica la celda por ref_id y por la KEY de la etapa, no por su posición', () => {
    expect(leafInDocument(doc, 'R1', 0, 1)).toEqual({ text: 's0o1', _v: 3 })
    expect(leafInDocument(doc, 'R1', 1, 0)).toEqual({ text: 's1o0', _v: 7 })
  })

  it('devuelve null si no la encuentra', () => {
    expect(leafInDocument(doc, 'R9', 0, 0)).toBeNull()
    expect(leafInDocument(doc, 'R1', 3, 0)).toBeNull()
    expect(leafInDocument(doc, 'R1', 0, 5)).toBeNull()
    expect(leafInDocument(null, 'R1', 0, 0)).toBeNull()
    expect(leafInDocument({ status: 'success' }, 'R1', 0, 0)).toBeNull()
  })
})
