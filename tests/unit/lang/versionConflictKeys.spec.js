import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

/**
 * La red que impide que el cartel del conflicto de versión salude con
 * `version_conflict.message`.
 *
 * Escanea los literales `$t('version_conflict.…')` del código y verifica que cada uno
 * resuelva en los tres idiomas. Mismo patrón que `inactivityWarningKeys.spec`.
 */
const KEY_RE = /\$t\(\s*'(version_conflict\.[a-z0-9_]+)'/g

const FILES = ['src/components/project/crudTables.vue']

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

describe('claves del cartel de conflicto de versión', () => {
  const keys = usedKeys()

  it('el cartel usa al menos las cuatro que necesita', () => {
    expect(keys).toEqual([
      'version_conflict.message',
      'version_conflict.mine',
      'version_conflict.reload',
      'version_conflict.theirs'
    ])
  })

  it.each([['en', en], ['es', es], ['pt', pt]])('resuelven todas en %s', (_lang, dict) => {
    const missing = keys.filter((key) => typeof resolve(dict, key) !== 'string')
    expect(missing).toEqual([])
  })

  // El texto tiene que decir que el cambio no se guardó y que hay algo que hacer. Un
  // «hubo un conflicto» a secas deja a la persona sin saber si perdió lo que escribió.
  it.each([['en', en], ['es', es], ['pt', pt]])('el mensaje de %s no queda vacío', (_lang, dict) => {
    expect(resolve(dict, 'version_conflict.message').length).toBeGreaterThan(40)
  })
})
