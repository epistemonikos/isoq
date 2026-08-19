import fs from 'fs'
import path from 'path'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'

const SOURCE = path.resolve(__dirname, '../../../src/components/list/evidenceProfileForm.vue')

// Only static `$t('lock.…')` literals: the dynamic ones in this file are built by
// concatenation and cannot be resolved without running the component.
const LOCK_KEY_RE = /\$t\(\s*'(lock\.[A-Za-z0-9_.]+)'/g

function usedLockKeys () {
  const source = fs.readFileSync(SOURCE, 'utf8')
  return [...new Set([...source.matchAll(LOCK_KEY_RE)].map(m => m[1]))]
}

function resolve (dict, key) {
  return key.split('.').reduce((node, part) => (
    node && typeof node === 'object' ? node[part] : undefined
  ), dict)
}

// vue-i18n does not throw on an unknown key: it renders the key itself. A banner that
// exists to explain a lock loss would greet the user with "lock.ref_locked_by_no_user".
describe('evidenceProfileForm.vue — las claves lock.* que usa existen en los 3 idiomas', () => {
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
