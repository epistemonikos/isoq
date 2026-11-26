import fs from 'fs'
import path from 'path'

// #416 (Megan): «el PDF tiene que ser consistente con el Word». Toda pantalla que imprime
// lleva el pie: un botón nuevo de imprimir sin el mixin saldría sin licencia ni enlace.
function sources (dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) return sources(p)
    return e.name.endsWith('.vue') ? [p] : []
  })
}

describe('every print view carries the export footer', () => {
  const printers = sources(path.resolve('src/components'))
    .filter(f => /window\.print\(\)/.test(fs.readFileSync(f, 'utf8')))

  it('finds the four print views', () => {
    expect(printers.map(f => path.basename(f)).sort()).toEqual([
      'actionButtons.vue', 'editListActionButtons.vue', 'previewContentSoQf.vue', 'previewContentWorksheet.vue'
    ])
  })

  it.each(['actionButtons.vue', 'editListActionButtons.vue', 'previewContentSoQf.vue', 'previewContentWorksheet.vue'])(
    '%s uses printFooterMixin and says what to print', (name) => {
      const src = fs.readFileSync(printers.find(f => path.basename(f) === name), 'utf8')
      expect(src).toMatch(/import printFooterMixin from '@\/mixins\/printFooterMixin'/)
      expect(src).toMatch(/mixins:\s*\[[^\]]*printFooterMixin/)
      expect(src).toMatch(/printFooterSource\s*(\(|:)/)
    })
})
