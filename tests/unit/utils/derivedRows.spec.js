import { withDerivedRows } from '@/utils/derivedRows'

/**
 * Un estudio incluido en el finding o en el proyecto puede no tener fila en el documento:
 * el documento se creó antes de que la referencia existiera, o nunca se sembró. Las tablas
 * tienen que mostrarlo igual, así que la fila se deriva de las referencias.
 *
 * La regla vive acá porque estaba escrita cuatro veces —`editList`, el worksheet, la
 * preview del proyecto y CAMELOT— y en cada copia decidía distinto qué contar como
 * faltante.
 */
describe('withDerivedRows()', () => {
  const hacerFila = refId => ({ ref_id: refId, column_0: '' })

  it('agrega la fila del estudio que no la tiene', () => {
    const items = [{ ref_id: 'r1', column_0: 'algo' }]

    const out = withDerivedRows(items, ['r1', 'r2'], hacerFila)

    expect(out.map(i => i.ref_id)).toEqual(['r1', 'r2'])
    expect(out[1].column_0).toBe('')
  })

  it('respeta el orden de las referencias para las derivadas', () => {
    const out = withDerivedRows([], ['r2', 'r1'], hacerFila)

    expect(out.map(i => i.ref_id)).toEqual(['r2', 'r1'])
  })

  it('no toca los ítems que ya existen', () => {
    const original = { ref_id: 'r1', column_0: 'lo que alguien escribió' }

    const out = withDerivedRows([original], ['r1'], hacerFila)

    expect(out).toHaveLength(1)
    expect(out[0]).toBe(original)
  })

  // Los ids llegan como string de un lado y a veces como otro tipo del otro: comparar sin
  // normalizar duplicaba la fila.
  it('no duplica cuando el id del ítem y el de la referencia difieren en tipo', () => {
    const out = withDerivedRows([{ ref_id: 7, column_0: 'x' }], ['7'], hacerFila)

    expect(out).toHaveLength(1)
  })

  it('deja los ítems huérfanos, que es decisión de quien llama', () => {
    // Filtrar las filas de referencias borradas no es trabajo de esta función: el servidor
    // ya las quita al borrar la referencia, y filtrarlas acá esconde datos inesperados.
    const out = withDerivedRows([{ ref_id: 'borrada' }], ['r1'], hacerFila)

    expect(out.map(i => i.ref_id)).toEqual(['borrada', 'r1'])
  })

  it('tolera entradas nulas', () => {
    expect(withDerivedRows(null, null, hacerFila)).toEqual([])
    expect(withDerivedRows(undefined, ['r1'], hacerFila).map(i => i.ref_id)).toEqual(['r1'])
  })
})
