// La regla de qué orden puede viajar en `PUT /fields/order`, compartida por el modal de
// columnas del Paso 3 CAMELOT y el editor del estudio.
//
// El servidor rechaza con 400 una clave que el documento no tenga guardada y cualquier
// campo de sistema. Lo que no se menciona se queda en su lugar, así que el orden puede ser
// un subconjunto.
import { persistableOrder, isStoredOrder, movableKeys } from '@/utils/columnOrder'

const STORED = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_a', label: 'A' },
  { key: 'context_extractedData', label: 'Context' },
  { key: 'context_comments', label: 'Comments' },
  { key: 'column_b', label: 'B' }
]

describe('persistableOrder', () => {
  it('conserva el orden pedido de las claves guardadas', () => {
    expect(persistableOrder(['column_b', 'context_extractedData', 'context_comments', 'column_a'], STORED))
      .toEqual(['column_b', 'context_extractedData', 'context_comments', 'column_a'])
  })

  it('saca los campos de sistema', () => {
    expect(persistableOrder(['ref_id', 'column_b', 'authors', 'column_a'], STORED))
      .toEqual(['column_b', 'column_a'])
  })

  // Son las CAMELOT que el cliente repone en memoria en los documentos viejos: no están
  // en la base, y mencionarlas es un 400.
  it('saca las claves marcadas como virtuales', () => {
    const stored = [...STORED, { key: 'research_extractedData', label: 'R', virtual: true }]
    expect(persistableOrder(['research_extractedData', 'column_a'], stored)).toEqual(['column_a'])
  })

  it('saca las claves que el documento no tiene', () => {
    expect(persistableOrder(['column_borrada', 'column_a'], STORED)).toEqual(['column_a'])
  })

  // La columna recién creada todavía no está en la copia local de `fields`, pero en el
  // servidor ya existe.
  it('cuenta como guardadas las claves recién creadas', () => {
    expect(persistableOrder(['column_nueva', 'column_a'], STORED, ['column_nueva']))
      .toEqual(['column_nueva', 'column_a'])
  })

  it('tolera entradas vacías', () => {
    expect(persistableOrder(null, null)).toEqual([])
    expect(persistableOrder(['column_a'], [null, { label: 'sin clave' }, ...STORED])).toEqual(['column_a'])
  })
})

describe('isStoredOrder', () => {
  it('es verdadero si el documento ya tiene esas claves en ese orden', () => {
    expect(isStoredOrder(['column_a', 'context_extractedData', 'context_comments', 'column_b'], STORED)).toBe(true)
  })

  it('compara sólo las claves mencionadas', () => {
    expect(isStoredOrder(['column_a', 'column_b'], STORED)).toBe(true)
    expect(isStoredOrder(['column_b', 'column_a'], STORED)).toBe(false)
  })

  // Una clave que el documento no tiene (la columna recién creada) significa que el orden
  // guardado todavía no la incluye.
  it('es falso si el orden menciona una clave que el documento no tiene', () => {
    expect(isStoredOrder(['column_nueva', 'column_a'], STORED)).toBe(false)
  })
})

describe('movableKeys', () => {
  it('devuelve todo menos los campos de sistema, en su orden', () => {
    expect(movableKeys(STORED))
      .toEqual(['column_a', 'context_extractedData', 'context_comments', 'column_b'])
  })
})
