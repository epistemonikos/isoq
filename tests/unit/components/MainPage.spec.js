import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import MainPage from '@/components/MainPage'
import en from '@/lang/en.json'

const localVue = createLocalVue()
localVue.use(VueI18n)

function build () {
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  return shallowMount(MainPage, {
    localVue,
    i18n,
    stubs: ['b-container', 'b-row', 'b-col', 'b-card', 'b-button', 'b-img',
      'b-embed', 'b-alert', 'router-link']
  })
}

// El link del footer es la ÚNICA vía de navegación al aviso legal para quien no
// tiene sesión (ver el comentario en MainPage.vue). Con el flag apagado la ruta
// redirige a la home, así que dejar el link visible mandaría al usuario a dar
// una vuelta sin explicación.
describe('MainPage.vue — link legal del footer', () => {
  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  it('muestra el link con ENABLE_GDPR encendido', () => {
    process.env.ENABLE_GDPR = 'on'
    expect(build().text()).toContain(en.gdpr.privacyAndTerms.title)
  })

  it('no muestra el link con ENABLE_GDPR apagado', () => {
    process.env.ENABLE_GDPR = 'off'
    expect(build().text()).not.toContain(en.gdpr.privacyAndTerms.title)
  })

  it('no deja ningún router-link a PrivacyAndTerms con el flag apagado', () => {
    // Más fuerte que el caso del texto: verifica que no quede el destino
    // cableado, aunque la etiqueta cambie de traducción.
    process.env.ENABLE_GDPR = 'off'
    const destinos = build().findAll('router-link-stub').wrappers
      .map(w => w.props('to'))
      .filter(Boolean)

    expect(destinos.some(d => d && d.name === 'PrivacyAndTerms')).toBe(false)
  })
})
