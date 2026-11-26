import fs from 'fs'
import path from 'path'

// En el PDF (window.print / Ctrl+P) no van la barra superior ni las pestañas del proyecto
// («Propiedades del proyecto», «Mis datos», «iSoQ»…), y los títulos siguen la escala del
// Word (src/utils/wordTypography.js: 14 / 12 / 10 pt). jsdom no aplica @media print: se
// verifica que la regla exista; la puerta final es el navegador.
const scss = fs.readFileSync(path.resolve(__dirname, '../../../src/assets/styles/main.scss'), 'utf8')
const printBlock = scss.slice(scss.indexOf('@media print'))

describe('print stylesheet', () => {
  it('hides the app navbar and the project tabs', () => {
    expect(printBlock).toMatch(/#main-navbar[\s\S]*?#tabsTitle[\s\S]*?display:\s*none\s*!important/)
  })

  it('uses document sizes for headings, like the Word export', () => {
    expect(printBlock).toMatch(/h1,\s*h2,[\s\S]*?font-size:\s*14pt/)
    expect(printBlock).toMatch(/h3,\s*h4,[\s\S]*?font-size:\s*12pt/)
  })
})
