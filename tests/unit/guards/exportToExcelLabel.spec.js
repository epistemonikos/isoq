import fs from 'fs'
import path from 'path'

// #373: un solo texto para exportar tablas a Excel, con y sin CAMELOT. Antes había dos
// claves («Export to XLS file» sin CAMELOT y «Export to Excel» con CAMELOT).
const lang = (code) => JSON.parse(fs.readFileSync(path.join(__dirname, `../../../src/lang/${code}.json`), 'utf8'))

function sources (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return sources(p)
    return /\.(vue|js)$/.test(e.name) ? [p] : []
  })
}

describe('Export to Excel label (#373)', () => {
  it.each([
    ['en', 'Export to Excel'],
    ['es', 'Exportar a Excel'],
    ['pt', 'Exportar para Excel']
  ])('%s has common.export_to_excel', (code, text) => {
    expect(lang(code).common.export_to_excel).toBe(text)
  })

  it('the old keys are gone from the languages and the code', () => {
    ['en', 'es', 'pt'].forEach(code => {
      const l = lang(code)
      expect(l.characteristics.export_xls).toBeUndefined()
      expect(l.camelot.step_three.export_xlsx).toBeUndefined()
    })
    const offenders = sources(path.join(__dirname, '../../../src'))
      .filter(f => /characteristics\.export_xls\b|step_three\.export_xlsx\b/.test(fs.readFileSync(f, 'utf8')))
    expect(offenders).toEqual([])
  })
})
