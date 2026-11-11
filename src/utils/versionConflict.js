import { isItemMetadata } from '@/utils/itemMetadata'

/**
 * Las columnas donde lo guardado y lo que se intentó guardar difieren.
 *
 * Es lo único que un conflicto de versión puede ofrecerle a quien lo sufre. Ya sabe que
 * perdió el guardado —se lo dice el cartel—; lo que necesita para rehacer su cambio sin
 * pisar el ajeno es ver los dos textos, uno al lado del otro.
 *
 * Vive acá y no en un componente porque lo usan los dos editores que escriben filas de
 * tabla: `crudTables` y el editor de estudios del Paso 3. Si diverge, la misma persona ve
 * dos explicaciones distintas del mismo evento según por dónde entró a editar.
 *
 * Tres cosas se excluyen, y ninguna por ser poco importante:
 *
 * - `ref_id` y `authors` identifican la fila; la persona no los escribió y no pudo
 *   cambiarlos. Listarlos sería pedirle que compare dos valores que no eligió.
 * - La metadata del servidor (`isItemMetadata`, hoy el contador `_v`) es justamente lo que
 *   difiere en TODO conflicto de versión, y lo único que no le dice nada: mostrarla sería
 *   contestar «cambió porque cambió».
 * - Las columnas iguales, que son la mayoría: el conflicto es de la fila entera, pero el
 *   cambio que hay que rehacer está en una o dos.
 *
 * Una columna ausente de un lado cuenta como vacía y NO se omite: que la otra persona haya
 * agregado algo donde yo no tenía nada es exactamente el cambio que quiero ver.
 */
export function conflictComparison (theirs, mine) {
  const guardado = theirs || {}
  const intentado = mine || {}
  const claves = new Set([...Object.keys(guardado), ...Object.keys(intentado)])
  const diff = {}
  claves.forEach(clave => {
    if (isItemMetadata(clave) || clave === 'ref_id' || clave === 'authors') return
    const a = guardado[clave] === undefined ? '' : guardado[clave]
    const b = intentado[clave] === undefined ? '' : intentado[clave]
    if (a !== b) diff[clave] = { theirs: a, mine: b }
  })
  return diff
}
