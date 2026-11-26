// #380: los enlaces y botones que se leen solos empiezan con mayúscula.
// Los fragmentos que van dentro de una oración («here», «and»…) no entran acá.
const langs = {
  en: require('@/lang/en.json'),
  es: require('@/lang/es.json'),
  pt: require('@/lang/pt.json')
}

const STANDALONE_KEYS = [
  'project.return_workspace',
  'worksheet_nav.return_isoq',
  'auth.forgot_password',
  'auth.new_account',
  'worksheet.actions.clear_selection',
  'camelot.assessment_form.save_button',
  'common.unshare'
]

const get = (obj, path) => path.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), obj)

describe('standalone link/button labels start with a capital letter (#380)', () => {
  for (const [lang, messages] of Object.entries(langs)) {
    for (const key of STANDALONE_KEYS) {
      it(`${lang}: ${key}`, () => {
        const value = get(messages, key)
        expect(typeof value).toBe('string')
        expect(value).toMatch(/^[¿]?\p{Lu}/u)
      })
    }
  }

  it('en: the iSoQ table button is spelled «iSoQ»', () => {
    expect(get(langs.en, 'worksheet_nav.return_isoq')).toBe('Return to iSoQ table')
  })

  for (const [lang, messages] of Object.entries(langs)) {
    it(`${lang}: the hint quotes the iSoQ table button verbatim`, () => {
      const label = get(messages, 'worksheet_nav.return_isoq')
      expect(get(messages, 'worksheet.assessment_added_isoq')).toContain(`“${label}”`)
    })
  }
})
