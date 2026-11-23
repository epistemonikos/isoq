// El pie de página del PDF, que es la impresión del navegador: las cajas de margen de
// @page (`@bottom-left`, `@bottom-right`) con los contadores `page` y `pages`. Chrome las
// soporta desde la 131; un navegador sin soporte imprime sin pie, como antes.
//
// Los textos son los del Word (`footerTexts`): a la izquierda el proyecto (y el finding) con
// el enlace público debajo; a la derecha la licencia y «Page X of Y».

const FOOTER_STYLE = 'font-family: Arial, sans-serif; font-size: 8pt; color: #7f7f7f;'

/**
 * Un string CSS entre comillas. El nombre del proyecto es texto del usuario y termina dentro
 * de un <style>: se escapan comillas y barras, los saltos de línea, y `<`/`>` para que un
 * `</style>` no pueda cerrar la etiqueta.
 */
function cssString (text) {
  return '"' + String(text)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\A ')
    .replace(/</g, '\\3C ')
    .replace(/>/g, '\\3E ') + '"'
}

/** El CSS del pie para `{ left, right, link }` de `footerTexts`. */
export function printFooterCss ({ left, right, link }, t) {
  const leftContent = link ? `${cssString(left).slice(0, -1)}\\A ${cssString(link).slice(1)}` : cssString(left)
  const pageLabel = `${right ? `${right} · ` : ''}${t('actionButtons.word_export.footer_page')} `
  const rightContent = `${cssString(pageLabel)} counter(page) ${cssString(` ${t('actionButtons.word_export.footer_of')} `)} counter(pages)`
  // Horizontal, como el Word: las tablas de la worksheet y la iSoQ son anchas.
  return `@page {
  size: landscape;
  @bottom-left { content: ${leftContent}; white-space: pre-wrap; text-align: left; vertical-align: top; ${FOOTER_STYLE} }
  @bottom-right { content: ${rightContent}; text-align: right; vertical-align: top; ${FOOTER_STYLE} }
}`
}
