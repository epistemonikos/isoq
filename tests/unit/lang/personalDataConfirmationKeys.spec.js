import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

/**
 * La casilla de datos personales tiene que decir lo mismo en las tres puertas de publicación
 * (modal Publicar, Propiedades y el modal de edición de la lista) y en los tres idiomas.
 */
const FILES = [
  'src/components/project/PublishModal.vue',
  'src/components/organization/organizationForm.vue',
  'src/utils/writeErrors.js'
]

const KEY_RE = /'(publish\.confirm_no_personal_data[a-z_]*)'/g

function keysIn (rel) {
  const source = fs.readFileSync(path.resolve(rel), 'utf8')
  const found = new Set()
  let m
  while ((m = KEY_RE.exec(source)) !== null) found.add(m[1])
  return found
}

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

describe('claves de la confirmación de datos personales', () => {
  it('las dos pantallas con casilla usan la misma clave', () => {
    expect(keysIn('src/components/project/PublishModal.vue').has('publish.confirm_no_personal_data')).toBe(true)
    expect(keysIn('src/components/organization/organizationForm.vue').has('publish.confirm_no_personal_data')).toBe(true)
  })

  it('el rechazo del servidor tiene su texto', () => {
    expect(keysIn('src/utils/writeErrors.js').has('publish.confirm_no_personal_data_required')).toBe(true)
  })

  const all = new Set(FILES.flatMap((f) => [...keysIn(f)]))
  it.each([['en', en], ['es', es], ['pt', pt]])('todas resuelven en %s', (_lang, dict) => {
    expect(all.size).toBeGreaterThan(0)
    all.forEach((key) => {
      const value = resolve(dict, key)
      expect(typeof value).toBe('string')
      expect(value.trim().length).toBeGreaterThan(0)
    })
  })

  it('el texto en español es el pedido', () => {
    expect(es.publish.confirm_no_personal_data).toBe(
      'Confirmo que el contenido no identifica a participantes de estudios primarios ni incluye datos personales que no pueda hacer públicos'
    )
  })

  it('no quedó sin traducir', () => {
    expect(en.publish.confirm_no_personal_data).not.toBe(es.publish.confirm_no_personal_data)
    expect(pt.publish.confirm_no_personal_data).not.toBe(es.publish.confirm_no_personal_data)
  })
})
