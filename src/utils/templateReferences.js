import Commons from '@/utils/commons.js'

/**
 * #329 — ¿La plantilla del Paso 3/4 es de las referencias que el proyecto tiene AHORA?
 *
 * Borrar y volver a subir referencias en el Paso 1 genera ids nuevos, aunque sean los mismos
 * archivos. Una plantilla descargada antes trae filas de estudios que ya no existen y no
 * trae los que se agregaron después. Importarla escribía filas huérfanas: se veían en
 * «My Data», pero la worksheet —que cruza por id— salía vacía, y al recargar aparecían
 * estudios duplicados. La decisión (Damián, 2026-11-11) es no importar nada en ese caso y
 * pedir la plantilla nueva.
 *
 * Devuelve null si coinciden, o `{ unknown, missing }` con las etiquetas a mostrar:
 * `unknown` = filas de la plantilla sin estudio en el proyecto (la etiqueta del archivo),
 * `missing` = estudios del proyecto sin fila en la plantilla («Autor Año»).
 *
 * Las filas totalmente vacías no cuentan: Excel las deja al final. Los ids se comparan como
 * texto porque una celda numérica llega como número.
 */
export function templateReferenceMismatch (items, references) {
  const current = new Map((references || []).map(ref => [String(ref.id), ref]))
  const seen = new Set()
  const unknown = []

  for (const item of items || []) {
    const id = item.ref_id === undefined || item.ref_id === null ? '' : String(item.ref_id).trim()
    if (!id && Object.values(item).every(value => String(value || '').trim() === '')) continue
    if (id && current.has(id)) {
      seen.add(id)
    } else {
      unknown.push(String(item.authors || id).trim())
    }
  }

  const missing = [...current.entries()]
    .filter(([id]) => !seen.has(id))
    .map(([, ref]) => Commons.getAuthorsFormat(ref.authors, ref.publication_year))

  return unknown.length || missing.length ? { unknown, missing } : null
}
