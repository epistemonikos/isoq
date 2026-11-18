const EXCLUDED_FIELD_KEYS = ['ref_id', 'authors', 'actions']

/**
 * Copia de `items` ordenada por la etiqueta del estudio que la persona lee («Autor Año»).
 *
 * El orden de los estudios es de presentación y se deriva acá, no se persiste: las
 * referencias de un finding se guardan en el orden en que se marcaron, así que un estudio
 * agregado después quedaba último en cada tabla que las recorría tal cual. `localeCompare`
 * y no `<`: con `<` una minúscula inicial («de Vries») o un acento («Álvarez») caen al
 * final. El sort es estable, así que a igual etiqueta se conserva el orden de entrada.
 */
export function sortByStudyLabel (items, labelOf) {
  const label = (item) => {
    const value = labelOf(item)
    return value === undefined || value === null ? '' : value.toString()
  }
  return [...items].sort((a, b) => label(a).localeCompare(label(b)))
}

export function sortByAuthors (items) {
  return sortByStudyLabel(items, item => item.authors)
}

export function filterDisplayFields (fields) {
  return fields.filter(f => !EXCLUDED_FIELD_KEYS.includes(f.key))
}

export function loadFileAsText (event) {
  return new Promise(resolve => {
    const file = event.target.files[0]
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.readAsText(file)
  })
}
