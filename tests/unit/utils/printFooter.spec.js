import { printFooterCss } from '@/utils/printFooter'

// #416: el PDF (impresión del navegador) lleva el mismo pie que el Word. Los textos salen
// de `footerTexts`; acá sólo se prueba cómo se vuelven CSS de las cajas de margen de @page.
const t = k => k

describe('printFooterCss', () => {
  const css = printFooterCss({ left: 'My review — Finding 3', right: 'License: CC BY', link: 'https://x/#/preview/isoq/o/p/public' }, t)

  it('puts the project (and the link below it) bottom-left', () => {
    expect(css).toMatch(/@bottom-left\s*\{[^}]*content:\s*"My review — Finding 3\\A https:\/\/x\/#\/preview\/isoq\/o\/p\/public"/)
  })

  it('puts the license and «Page X of Y» bottom-right, with the page counters', () => {
    expect(css).toMatch(/@bottom-right\s*\{[^}]*content:\s*"License: CC BY · actionButtons\.word_export\.footer_page " counter\(page\) " actionButtons\.word_export\.footer_of " counter\(pages\)/)
  })

  it('private: no license separator and no link', () => {
    const priv = printFooterCss({ left: 'P', right: '', link: '' }, t)
    expect(priv).toMatch(/@bottom-left\s*\{[^}]*content:\s*"P"/)
    expect(priv).toMatch(/content:\s*"actionButtons\.word_export\.footer_page " counter\(page\)/)
    expect(priv).not.toContain(' · ')
  })

  // Un nombre de proyecto es texto del usuario y termina dentro de un <style>.
  it('escapes quotes, backslashes and a closing style tag in the texts', () => {
    const evil = printFooterCss({ left: 'a"b\\c</style><script>', right: '', link: '' }, t)
    expect(evil).toContain('content: "a\\"b\\\\c\\3C /style\\3E \\3C script\\3E "')
    expect(evil).not.toContain('</style>')
  })

  // El Word imprime las worksheets y la tabla iSoQ en horizontal; el PDF, igual.
  it('prints landscape, like the Word', () => {
    expect(printFooterCss({ left: 'P', right: '', link: '' }, t)).toMatch(/@page\s*\{[^@]*size:\s*landscape/)
  })

  // Revisión de seguridad: \r, \f y los demás caracteres de control también cierran un
  // string CSS. Un nombre de proyecto con ellos podía inyectar reglas en la hoja de estilos.
  it.each([['\r'], ['\f'], ['\u0000'], ['\u001b'], ['\u007f'], [' ']])(
    'escapes control character %j so the string cannot be closed', (ch) => {
      const css = printFooterCss({ left: `a${ch}} body { background: url(//evil) } @page { x: "`, right: '', link: '' }, t)
      expect(css).not.toContain(ch)
      const content = css.match(/@bottom-left\s*\{\s*content:\s*("(?:[^"\\]|\\.)*")/)[1]
      expect(content).toContain('background: url(//evil)')
      expect(css.match(/@bottom-left/g)).toHaveLength(1)
    })
})
