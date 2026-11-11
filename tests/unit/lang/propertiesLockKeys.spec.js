import { mount } from '@vue/test-utils'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'
import { propertiesLockMessageKey } from '@/utils/propertiesLock'
import InactivityWarning from '@/components/common/InactivityWarning.vue'

/**
 * Las claves del cartel no aparecen como literales `$t('…')` en ninguna plantilla: las
 * elige propertiesLockMessageKey. Por eso se las enumera desde la función y no escaneando.
 */
const STATES = [['denied', 'Ana'], ['denied', null], ['lost', 'Ana'], ['lost', null], ['forbidden', null], ['released_idle', null]]
const KEYS = [
  ...new Set(STATES.map(([s, u]) => propertiesLockMessageKey(s, u))),
  'lock.properties_resume',
  'lock.properties_inactivity_message'
]

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

describe.each([['en', en], ['es', es], ['pt', pt]])('claves del lock de Propiedades en %s', (_, dict) => {
  it.each(KEYS)('%s existe', (key) => {
    expect(typeof resolve(dict, key)).toBe('string')
  })

  it('los que nombran a alguien usan {user}', () => {
    expect(resolve(dict, 'lock.properties_locked_by')).toContain('{user}')
    expect(resolve(dict, 'lock.properties_lost_to')).toContain('{user}')
  })

  it('el aviso de inactividad usa {countdown}', () => {
    expect(resolve(dict, 'lock.properties_inactivity_message')).toContain('{countdown}')
  })
})

describe('InactivityWarning — messageKey', () => {
  const mountWith = (propsData) => mount(InactivityWarning, {
    propsData: { visible: true, secondsLeft: 65, ...propsData },
    mocks: { $t: (key, params) => (params && params.countdown ? `${key}|${params.countdown}` : key) },
    stubs: { 'b-alert': { template: '<div><slot /></div>' }, 'b-button': true, 'font-awesome-icon': true }
  })

  it('sin prop usa el texto de siempre', () => {
    expect(mountWith({}).text()).toContain('lock.inactivity_message|1:05')
  })

  it('con prop usa el texto pedido', () => {
    expect(mountWith({ messageKey: 'lock.properties_inactivity_message' }).text())
      .toContain('lock.properties_inactivity_message|1:05')
  })
})
