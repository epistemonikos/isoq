// El aviso de contraseña en una filtración no debe sonar a que iSoQ fue vulnerado: la
// contraseña figura en listas públicas armadas con filtraciones de OTROS sitios (Have I Been
// Pwned). El texto viejo («Your password was found in a data breach») se leía como un robo
// desde iSoQ. Los tres idiomas tienen que decir de dónde viene y no hablar de «tu cuenta».
const LANGS = {
  en: require('@/lang/en.json'),
  es: require('@/lang/es.json'),
  pt: require('@/lang/pt.json')
}

const OTHER_SITES = { en: /other websites|elsewhere/i, es: /otros sitios/i, pt: /outros sites/i }
const PUBLIC_LISTS = { en: /public lists/i, es: /listas públicas/i, pt: /listas públicas/i }
const NOT_ISOQ = {
  en: /does not mean iSoQ was breached/i,
  es: /no significa que iSoQ haya sido vulnerado/i,
  pt: /não significa que o iSoQ tenha sido violado/i
}

describe.each(Object.keys(LANGS))('password_compromised (%s)', (lang) => {
  const auth = LANGS[lang].auth.password_compromised
  const account = LANGS[lang].account.password_compromised

  it('el aviso del login dice que viene de filtraciones de otros sitios y no de iSoQ', () => {
    expect(auth).toMatch(PUBLIC_LISTS[lang])
    expect(auth).toMatch(OTHER_SITES[lang])
    expect(auth).toMatch(NOT_ISOQ[lang])
  })

  it('el aviso al elegir contraseña habla de listas públicas de otros sitios', () => {
    expect(account).toMatch(PUBLIC_LISTS[lang])
    expect(account).toMatch(OTHER_SITES[lang])
  })
})
