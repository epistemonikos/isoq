// The legal texts are long and only /privacy-and-terms needs them, so they do not travel with
// the i18n messages: they are their own chunk, loaded on demand.
//
// Only English here: master has no language selector (it is commented out in Menu.vue), so
// nobody could reach a translation. develop carries the Spanish and Portuguese ones.
const LEGAL_LOCALES = ['en']

export function loadLegalDocuments (locale) {
  const lang = LEGAL_LOCALES.includes(locale) ? locale : 'en'
  return import(/* webpackChunkName: "legal-[request]" */ `@/lang/legal/${lang}.json`)
    .then(module => module.default || module)
}
