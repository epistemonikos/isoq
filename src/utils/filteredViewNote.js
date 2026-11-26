/**
 * La nota de «vista filtrada» de una tabla (#416). Los exportables imprimen lo que la
 * persona ve; si eso está filtrado, la nota lo dice en pantalla (junto a la tabla, antes de
 * exportar) y en el documento, para que nadie tome una tabla parcial por completa.
 * Sin filtro devuelve '' y no se dibuja nada.
 *
 * @param {Object} view  `{ hiddenLabels?, search?, shown?, total? }`
 * @param {Function} t   `$t` o equivalente con parámetros
 */
export function filteredViewNote ({ hiddenLabels = [], search = '', shown, total } = {}, t) {
  const parts = []
  if (hiddenLabels.length) {
    parts.push(t('export.filtered_view.hidden_columns', { columns: hiddenLabels.join(', ') }))
  }
  const term = (search || '').trim()
  if (term) parts.push(t('export.filtered_view.search', { term, shown, total }))
  if (!parts.length) return ''
  return `${t('export.filtered_view.title')} — ${parts.join('; ')}`
}
