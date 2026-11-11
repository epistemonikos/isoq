// The legal texts are long and only /privacy-and-terms needs them, so they do not travel with
// the main i18n messages (src/plugins/i18n.js imports those whole): each language is its own
// chunk, loaded on demand.
const LEGAL_LOCALES = ['en', 'es', 'pt']

export function loadLegalDocuments (locale) {
  const lang = LEGAL_LOCALES.includes(locale) ? locale : 'en'
  return import(/* webpackChunkName: "legal-[request]" */ `@/lang/legal/${lang}.json`)
    .then(module => module.default || module)
}
