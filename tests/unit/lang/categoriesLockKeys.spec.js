import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'
import { categoriesLockMessageKey } from '@/utils/categoriesLock'

/**
 * Las claves del cartel no aparecen como literales `$t('…')` en ninguna plantilla: las
 * elige categoriesLockMessageKey. Por eso se las enumera desde la función.
 */
const STATES = [['denied', 'Ana'], ['denied', null], ['lost', 'Ana'], ['lost', null], ['forbidden', null], ['released_idle', null]]
const KEYS = [
  ...new Set(STATES.map(([s, u]) => categoriesLockMessageKey(s, u))),
  'lock.categories_resume',
  'lock.categories_inactivity_message'
]

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

describe.each([['en', en], ['es', es], ['pt', pt]])('claves del lock de grupos en %s', (_, dict) => {
  it.each(KEYS)('%s existe', (key) => {
    expect(typeof resolve(dict, key)).toBe('string')
  })

  it('los que nombran a alguien usan {user}', () => {
    expect(resolve(dict, 'lock.categories_locked_by')).toContain('{user}')
    expect(resolve(dict, 'lock.categories_lost_to')).toContain('{user}')
  })

  it('el aviso de inactividad usa {countdown}', () => {
    expect(resolve(dict, 'lock.categories_inactivity_message')).toContain('{countdown}')
  })
})
