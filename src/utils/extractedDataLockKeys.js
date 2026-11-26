/**
 * Clave de `ref_locks` de una fila de datos extraídos: `<doc_id>::ed::<ref_id>`.
 *
 * `doc_id` es el documento `isoqf_extracted_data` del hallazgo, el mismo que viaja en la
 * URL del endpoint C (`PATCH /isoqf_extracted_data/<doc_id>/item/<ref_id>`). El servidor
 * compone la clave igual desde esa ruta (`auth_server/libs/extracted_data.py`), así que
 * es un contrato entre repos: por eso vive escrita una sola vez acá y no interpolada en
 * cada editor.
 *
 * La unidad es la FILA DE ESTA HOJA y no el estudio. Antes era el `ref_id` pelado, que es
 * también la clave del estudio en el Paso 3: quien editaba los datos extraídos de R1 en un
 * hallazgo bloqueaba R1 en todos los demás hallazgos y en su ficha de características, sin
 * que en la pantalla del otro hubiera nadie trabajando en esa hoja.
 *
 * El servidor ya NO acepta el `ref_id` pelado para este endpoint: un bundle viejo recibe
 * 409. No hay parentesco con el estudio, a propósito — es lo que se buscaba.
 */
export const ED_ROW_INFIX = '::ed::'

/**
 * `('ed1', 'R1')` -> `'ed1::ed::R1'`.
 *
 * Devuelve `null` si falta alguna de las dos partes, en vez de `undefined::ed::R1`: esa
 * clave se tomaría sobre nada y no se soltaría nunca, porque `releaseRef` la busca por
 * igualdad de string.
 */
export function extractedDataRowLockKey (docId, refId) {
  return docId && refId ? `${docId}${ED_ROW_INFIX}${refId}` : null
}

/** ¿Es la clave de una fila de datos extraídos? */
export function isExtractedDataRowLockKey (lockKey) {
  return typeof lockKey === 'string' && lockKey.indexOf(ED_ROW_INFIX) > 0
}

/**
 * El lock AJENO sobre una fila de datos extraídos, o `null`.
 *
 * Recibe los locks ya filtrados (`foreignRefLocks` de `refLockStateMixin`): separar los
 * propios es de quien llama, que es el único que sabe qué sostiene esta pestaña. Lo usan
 * las dos superficies que editan esta tabla —`editListExtractedData` (worksheet y modales
 * de methodological limitations / coherence) y el editor en sitio de adequacy—, y una
 * sola copia de la búsqueda es lo que impide que una grise y la otra no.
 *
 * Igualdad exacta de clave y no base: la fila no tiene parentesco con nada, ni con el
 * estudio `R1` ni con el documento.
 */
export function foreignRowLock (foreignLocks, docId, refId) {
  const key = extractedDataRowLockKey(docId, refId)
  if (!key || !Array.isArray(foreignLocks)) return null
  return foreignLocks.find(lock => lock && lock.ref_id === key) || null
}
