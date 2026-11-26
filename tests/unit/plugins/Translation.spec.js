import { Trans } from '@/plugins/Translation'
import { i18n } from '@/plugins/i18n'

// #203: el idioma se elige en el perfil; si no hay preferencia, sigue al navegador (toda la
// lista de idiomas aceptados) y si ninguno está soportado, inglés. Detectar no es elegir:
// sólo el perfil guarda la preferencia.
function setNavigator ({ language, languages }) {
  Object.defineProperty(window.navigator, 'language', { value: language, configurable: true })
  Object.defineProperty(window.navigator, 'languages', { value: languages, configurable: true })
}

describe('Trans — language detection (#203)', () => {
  beforeEach(() => {
    localStorage.clear()
    i18n.locale = 'en'
  })

  it('uses the stored preference first', () => {
    localStorage.setItem('user_language', 'pt')
    setNavigator({ language: 'es-CL', languages: ['es-CL'] })
    expect(Trans.getUserSupportedLang()).toBe('pt')
  })

  it('uses the browser language without region', () => {
    setNavigator({ language: 'es-CL', languages: ['es-CL', 'en'] })
    expect(Trans.getUserSupportedLang()).toBe('es')
  })

  it('walks the whole list of accepted languages', () => {
    setNavigator({ language: 'de-DE', languages: ['de-DE', 'fr', 'pt-BR'] })
    expect(Trans.getUserSupportedLang()).toBe('pt')
  })

  it('falls back to English when no accepted language is supported', () => {
    setNavigator({ language: 'de-DE', languages: ['de-DE', 'fr'] })
    expect(Trans.getUserSupportedLang()).toBe('en')
  })

  it('works when navigator.languages is missing', () => {
    setNavigator({ language: 'es', languages: undefined })
    expect(Trans.getUserSupportedLang()).toBe('es')
  })

  it('init applies the detected language without storing it as a preference', async () => {
    setNavigator({ language: 'es-CL', languages: ['es-CL'] })
    await Trans.init()
    expect(i18n.locale).toBe('es')
    expect(document.documentElement.getAttribute('lang')).toBe('es')
    expect(localStorage.getItem('user_language')).toBeNull()
  })

  it('choosing a language (profile) does store it', async () => {
    await Trans.changeLanguage('pt')
    expect(localStorage.getItem('user_language')).toBe('pt')
  })
})
