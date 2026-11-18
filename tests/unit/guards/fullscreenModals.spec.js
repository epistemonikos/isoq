import fs from 'fs'
import path from 'path'

/**
 * Guardián de los modales de trabajo a pantalla completa (2026-10-30).
 *
 * Primero fue el ancho (2026-10-02): una sola clase en `main.scss` en vez de una regla por
 * modal. Después, pantalla completa: el 98% del ancho y el margen de Bootstrap dejaban un borde
 * alrededor, y lo que scrolleaba era el `.modal` entero, así que el encabezado y los botones se
 * iban con el contenido. Ahora el modal ocupa la ventana, el encabezado y el pie quedan fijos y
 * scrollea el cuerpo.
 *
 * jsdom no carga el SCSS: esto fija que la regla exista y que cada modal la declare. El
 * resultado se mide en navegador.
 */
const root = path.resolve(__dirname, '../../..')
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')

// Etiqueta de apertura completa del <b-modal> con ese id (puede ocupar varias líneas).
const modalTag = (source, id) => {
  const match = source.match(new RegExp(`<b-modal\\b[^>]*\\bid="${id}"[^>]*>`))
  return match ? match[0] : ''
}

// El bloque de la clase compartida, hasta la llave que lo cierra.
const fullscreenBlock = () => {
  const scss = read('src/assets/styles/main.scss')
  const start = scss.indexOf('.modal-dialog.modal-dialog-fullscreen {')
  if (start < 0) return ''
  let depth = 0
  for (let i = scss.indexOf('{', start); i < scss.length; i++) {
    if (scss[i] === '{') depth++
    if (scss[i] === '}' && --depth === 0) return scss.slice(start, i + 1)
  }
  return ''
}

describe('guardián: los modales de trabajo ocupan toda la pantalla', () => {
  it('main.scss define la clase compartida: sin margen, toda la ventana, scrollea el cuerpo', () => {
    const block = fullscreenBlock()
    expect(block).toMatch(/max-width:\s*none/)
    expect(block).toMatch(/margin:\s*0/)
    expect(block).toMatch(/height:\s*100%/)
    expect(block).toMatch(/\.modal-content\s*\{[^}]*height:\s*100%/)
    expect(block).toMatch(/\.modal-body\s*\{[^}]*overflow-y:\s*auto/)
  })

  it('la clase vieja ya no existe', () => {
    expect(read('src/assets/styles/main.scss')).not.toMatch(/modal-dialog-wide/)
  })

  it.each([
    ['src/components/list/evidenceProfileForm.vue', 'modal-evidence-profile-form'],
    ['src/components/camelot/EditReferenceModal.vue', 'modal-edit-reference'],
    ['src/components/camelot/StepFour.vue', 'modal-1']
  ])('%s (#%s) declara dialog-class="modal-dialog-fullscreen"', (file, id) => {
    expect(modalTag(read(file), id)).toContain('dialog-class="modal-dialog-fullscreen"')
  })
})
