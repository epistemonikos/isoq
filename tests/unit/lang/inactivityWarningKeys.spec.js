import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

/**
 * La red que impide que el aviso salude con `lock.inactivity_title`.
 *
 * Escanea los literales `$t('lock.…')` de los archivos que este trabajo tocó y verifica
 * que cada uno resuelva en los tres idiomas. Calcado de evidenceProfileFormLockKeys.spec.
 */
const FILES = [
  'src/components/common/InactivityWarning.vue',
  'src/components/camelot/EditReferenceModal.vue',
  'src/components/camelot/StepFour.vue'
]

const KEY_RE = /\$t\(\s*'(lock\.[a-z0-9_]+)'/g

function usedKeys () {
  const found = new Set()
  FILES.forEach((rel) => {
    const source = fs.readFileSync(path.resolve(rel), 'utf8')
    let m
    while ((m = KEY_RE.exec(source)) !== null) found.add(m[1])
  })
  return [...found].sort()
}

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

describe('claves de lock usadas por el temporizador y los avisos', () => {
  const keys = usedKeys()

  it('encuentra las claves nuevas en el código', () => {
    expect(keys).toEqual(expect.arrayContaining([
      'lock.inactivity_title',
      'lock.inactivity_message',
      'lock.inactivity_keep_working',
      'lock.inactivity_released',
      'lock.study_fields_locked_by',
      'lock.study_fields_locked_no_user'
    ]))
  })

  it.each([['en', en], ['es', es], ['pt', pt]])('%s traduce todas las claves usadas', (_lang, dict) => {
    const faltantes = keys.filter(k => typeof resolve(dict, k) !== 'string')
    expect(faltantes).toEqual([])
  })

  it('el countdown se interpola, no se concatena', () => {
    [en, es, pt].forEach((dict) => {
      expect(dict.lock.inactivity_message).toContain('{countdown}')
    })
  })
})
