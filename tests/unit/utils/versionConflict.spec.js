import { conflictComparison } from '@/utils/versionConflict'
import { VERSION_FIELD } from '@/utils/itemMetadata'

// La regla de qué mostrarle a quien perdió un guardado por versión. Vive en un solo lugar
// porque la usan los dos editores que escriben filas de tabla (`crudTables` y el editor de
// estudios del Paso 3), y una divergencia acá significa que la misma persona ve dos
// explicaciones distintas del mismo evento según por dónde entró.
describe('conflictComparison()', () => {
  it('muestra sólo las columnas que difieren', () => {
    const diff = conflictComparison(
      { ref_id: 'r1', column_a: 'de la otra persona', column_b: 'igual' },
      { ref_id: 'r1', column_a: 'lo mío', column_b: 'igual' }
    )
    expect(Object.keys(diff)).toEqual(['column_a'])
    expect(diff.column_a).toEqual({ theirs: 'de la otra persona', mine: 'lo mío' })
  })

  it('no muestra la identidad de la fila', () => {
    // `ref_id` y `authors` no son algo que la persona escribió y no puede haberlos
    // cambiado: listarlos sería pedirle que compare dos valores idénticos que no eligió.
    const diff = conflictComparison(
      { ref_id: 'r1', authors: 'Smith 2020' },
      { ref_id: 'r2', authors: 'Otro 1999' }
    )
    expect(diff).toEqual({})
  })

  it('no muestra el contador de versión', () => {
    // Es justamente lo que difiere en todo conflicto de versión, y es lo único que a la
    // persona no le dice nada: mostrarlo sería contestar «cambió porque cambió».
    const diff = conflictComparison(
      { [VERSION_FIELD]: 4, column_a: 'x' },
      { [VERSION_FIELD]: 1, column_a: 'x' }
    )
    expect(diff).toEqual({})
  })

  it('trata la columna ausente de un lado como vacía, no la omite', () => {
    // Una columna que la otra persona agregó y yo no tenía es un cambio que quiero ver.
    // Compararla contra `undefined` la habría dado por igual y la habría escondido.
    expect(conflictComparison({ column_a: 'ellos escribieron' }, {}))
      .toEqual({ column_a: { theirs: 'ellos escribieron', mine: '' } })
    expect(conflictComparison({}, { column_a: 'yo escribí' }))
      .toEqual({ column_a: { theirs: '', mine: 'yo escribí' } })
  })

  it('tolera que falte cualquiera de los dos lados', () => {
    // El 409 puede llegar sin `item` (un servidor viejo) y el replay de la cola offline
    // puede no tener el cuerpo original. Sin fila que comparar el cartel se muestra igual,
    // con su mensaje y su botón de recargar, que es lo que de verdad resuelve el problema.
    expect(conflictComparison(null, null)).toEqual({})
    expect(conflictComparison(undefined, { column_a: 'x' }))
      .toEqual({ column_a: { theirs: '', mine: 'x' } })
  })
})
