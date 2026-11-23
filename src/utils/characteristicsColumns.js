/**
 * Las columnas de «Characteristics of Studies» con CAMELOT, como una sola regla (#416).
 *
 * La usan la tabla en pantalla (CharacteristicsTable) y los exportables: el orden, los
 * nombres, las columnas ocultas y los comentarios salen de acá para los dos, así que lo
 * exportado es lo que la persona estaba viendo. Antes el Word tenía su propia regla
 * (ordenaba las columnas propias con `parseInt` de una clave hex) y no coincidía.
 *
 * @param {Object}   args
 * @param {Array}    args.fields      `charsOfStudies.fields`, en el orden que eligió la persona
 * @param {Array}    args.categories  catálogo CAMELOT: `{ key, label, options: [extractedData, comments] }`
 * @param {Object}  [args.view]       `{ hiddenColumnKeys, showComments }`; sin vista, nada oculto
 *                                    y sin comentarios (como abre la pantalla)
 * @param {Object}   args.labels      `{ extractedData, comments }` ya traducidos
 */
const SKIPPED = ['authors', 'ref_id', 'actions', 'edit']

export function characteristicsColumns ({ fields, categories, view, labels }) {
  const hidden = (view && view.hiddenColumnKeys) || []
  const showComments = !!(view && view.showComments)

  const all = []
  for (const field of fields || []) {
    if (SKIPPED.includes(field.key) || field.key.endsWith('_comments')) continue
    if (field.key.endsWith('_extractedData')) {
      const category = (categories || []).find(c => c.options && c.options.some(o => o.key === field.key))
      all.push({
        type: 'camelot',
        key: field.key,
        label: category ? category.label : field.label,
        options: category
          ? category.options
          : [
            { key: field.key, label: field.label },
            { key: field.key.replace('_extractedData', '_comments'), label: labels.comments }
          ]
      })
    } else {
      all.push({ type: 'custom', key: field.key, label: field.label, options: [{ key: field.key, label: labels.extractedData }] })
    }
  }

  const visibleOptions = header => header.type === 'camelot' && !showComments
    ? header.options.filter(o => !o.key.endsWith('_comments'))
    : header.options

  const headers = all
    .filter(h => !hidden.includes(h.key))
    .map(h => ({ ...h, options: visibleOptions(h), colspan: visibleOptions(h).length }))
  const subHeaders = headers.flatMap(h => h.options)

  return {
    filterable: all.map(h => ({ key: h.key, label: h.label })),
    headers,
    subHeaders,
    cellKeys: subHeaders.map(o => o.key),
    hiddenLabels: all.filter(h => hidden.includes(h.key)).map(h => h.label),
    hasVisibleCamelot: headers.some(h => h.type === 'camelot')
  }
}

/**
 * `fields` con los dominios del catálogo que le falten, al final. Los documentos anteriores
 * al 2026-09-15 no guardan el catálogo en `fields` (la pantalla lo recibe ya repuesto): sin
 * esto, un exportable sin filtro de pantalla perdía los dominios CAMELOT.
 */
export function withCatalogDomains (fields, categories) {
  const list = Array.isArray(fields) ? [...fields] : []
  const present = new Set(list.map(f => f.key))
  for (const category of categories || []) {
    const key = category.options && category.options[0] && category.options[0].key
    if (key && !present.has(key)) list.push({ key, label: category.label })
  }
  return list
}
