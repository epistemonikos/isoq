import fs from 'fs'
import path from 'path'

/**
 * Guardián del ancho de los modales de trabajo (2026-10-02).
 *
 * Antes cada modal resolvía su ancho a su manera: el evidence profile con una regla atada a
 * su id, el Paso 4 con una clase que sólo actuaba desde 1600px y el Paso 3 con el `xl` de
 * Bootstrap (1140px), así que dos de los tres dejaban borde sin usar. Ahora hay una sola
 * clase, `modal-dialog-wide`, en `main.scss`.
 *
 * jsdom no carga el SCSS: esto fija que la regla exista y que cada modal la declare. El
 * ancho real se mide en navegador.
 */
const root = path.resolve(__dirname, '../../..')
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8')

// Etiqueta de apertura completa del <b-modal> con ese id (puede ocupar varias líneas).
const modalTag = (source, id) => {
  const match = source.match(new RegExp(`<b-modal\\b[^>]*\\bid="${id}"[^>]*>`))
  return match ? match[0] : ''
}

describe('guardián: los modales de trabajo usan todo el ancho', () => {
  it('main.scss define la clase compartida', () => {
    expect(read('src/assets/styles/main.scss')).toMatch(/\.modal-dialog\.modal-dialog-wide\s*\{[^}]*max-width:\s*98%/)
  })

  it.each([
    ['src/components/list/evidenceProfileForm.vue', 'modal-evidence-profile-form'],
    ['src/components/camelot/EditReferenceModal.vue', 'modal-edit-reference'],
    ['src/components/camelot/StepFour.vue', 'modal-1']
  ])('%s (#%s) declara dialog-class="modal-dialog-wide"', (file, id) => {
    expect(modalTag(read(file), id)).toContain('dialog-class="modal-dialog-wide"')
  })
})
