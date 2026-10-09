import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

// Las tres superficies del Paso 2 que nombran a quien está editando. La tabla se
// sumó cuando empezó a grisar los botones de los assessments: usa
// `lock.ref_locked_by` desde su propio `sectionLockedByName`, y sin escanearla esa
// clave quedaba fuera del chequeo de los tres idiomas.
const SOURCES = [
  '../../../src/components/list/evidenceProfileForm.vue',
  '../../../src/components/list/editListEvidenceProfile.vue',
  '../../../src/components/project/ViewTable.vue'
].map(rel => path.resolve(__dirname, rel))

// Only static `$t('lock.…')` literals: the dynamic ones in this file are built by
// concatenation and cannot be resolved without running the component.
const LOCK_KEY_RE = /\$t\(\s*'(lock\.[A-Za-z0-9_.]+)'/g

function usedLockKeys () {
  const source = SOURCES.map(file => fs.readFileSync(file, 'utf8')).join('\n')
  return [...new Set([...source.matchAll(LOCK_KEY_RE)].map(m => m[1]))]
}

function resolve (dict, key) {
  return key.split('.').reduce((node, part) => (
    node && typeof node === 'object' ? node[part] : undefined
  ), dict)
}

// vue-i18n does not throw on an unknown key: it renders the key itself. A banner that
// exists to explain a lock loss would greet the user with "lock.ref_locked_by_no_user".
describe('Paso 2 — las claves lock.* que usa existen en los 3 idiomas', () => {
  const dictionaries = { en, es, pt }

  it('encuentra claves para revisar', () => {
    expect(usedLockKeys().length).toBeGreaterThan(0)
  })

  Object.entries(dictionaries).forEach(([lang, dict]) => {
    it(`no deja claves sin traducir en ${lang}.json`, () => {
      const missing = usedLockKeys().filter(key => typeof resolve(dict, key) !== 'string')
      expect(missing).toEqual([])
    })
  })
})
