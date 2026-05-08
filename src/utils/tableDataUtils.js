const EXCLUDED_FIELD_KEYS = ['ref_id', 'authors', 'actions']

export function sortByAuthors (items) {
  return [...items].sort((a, b) => {
    const authorsA = (a.authors || '').toString()
    const authorsB = (b.authors || '').toString()
    return authorsA.localeCompare(authorsB)
  })
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
