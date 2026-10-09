import { shallowMount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import PrivacyAndTerms from '@/components/PrivacyAndTerms'
import en from '@/lang/en.json'
import es from '@/lang/es.json'

const localVue = createLocalVue()
localVue.use(VueI18n)

function build (query = {}) {
  const i18n = new VueI18n({ locale: 'en', messages: { en, es } })
  return shallowMount(PrivacyAndTerms, {
    localVue,
    i18n,
    stubs: ['b-tabs', 'b-tab', 'b-container', 'router-link', 'font-awesome-icon'],
    mocks: {
      $route: { query },
      $router: { replace: jest.fn() }
    }
  })
}

describe('PrivacyAndTerms.vue', () => {
  // ─── Pestaña inicial según ?tab= ─────────────────────────────────────────────

  it('abre la pestaña overview por defecto', () => {
    expect(build().vm.activeTab).toBe(0)
  })

  it('abre la pestaña de términos con ?tab=terms', () => {
    expect(build({ tab: 'terms' }).vm.activeTab).toBe(1)
  })

  it('abre la pestaña de privacidad con ?tab=privacy', () => {
    expect(build({ tab: 'privacy' }).vm.activeTab).toBe(2)
  })

  it('abre la pestaña de propiedad intelectual con ?tab=property', () => {
    expect(build({ tab: 'property' }).vm.activeTab).toBe(3)
  })

  it('ignora un tab desconocido y cae en overview', () => {
    expect(build({ tab: 'basura' }).vm.activeTab).toBe(0)
  })

  it('mantiene overview en 0 aunque el mapa devuelva un cero legítimo', () => {
    // Regresión: `TAB_MAP[tab] || 0` funciona por casualidad porque overview
    // ya es 0. Si el orden de las pestañas cambia, `||` descarta el índice
    // válido. Este test fija el comportamiento correcto.
    expect(build({ tab: 'overview' }).vm.activeTab).toBe(0)
  })

  // ─── Sincronización con la URL ───────────────────────────────────────────────

  it('sincroniza la URL al cambiar de pestaña', async () => {
    const wrapper = build()
    wrapper.setData({ activeTab: 2 })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.$router.replace).toHaveBeenCalledWith({ query: { tab: 'privacy' } })
  })

  it('no reescribe la URL si ya está en la pestaña pedida', async () => {
    // Sin esta guarda, $router.replace se llama con la ruta que ya está activa
    // y vue-router emite NavigationDuplicated en cada montaje.
    const wrapper = build({ tab: 'privacy' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.$router.replace).not.toHaveBeenCalled()
  })

  // ─── Acordeón de preguntas frecuentes ────────────────────────────────────────

  it('abre y cierra una pregunta del acordeón', () => {
    const wrapper = build()
    expect(wrapper.vm.faqItems[0].open).toBe(false)
    wrapper.vm.toggleFaq(0)
    expect(wrapper.vm.faqItems[0].open).toBe(true)
    wrapper.vm.toggleFaq(0)
    expect(wrapper.vm.faqItems[0].open).toBe(false)
  })

  it('abrir una pregunta no abre las demás', () => {
    const wrapper = build()
    wrapper.vm.toggleFaq(2)

    expect(wrapper.vm.faqItems[2].open).toBe(true)
    expect(wrapper.vm.faqItems.filter(i => i.open)).toHaveLength(1)
  })

  it('trae las seis preguntas frecuentes traducidas', () => {
    const wrapper = build()
    expect(wrapper.vm.faqItems).toHaveLength(6)
    wrapper.vm.faqItems.forEach(item => {
      expect(item.question).not.toMatch(/^gdpr\./)
      expect(item.answer).not.toMatch(/^gdpr\./)
    })
  })

  it('sigue el cambio de idioma sin remontar', async () => {
    // Cambiar de idioma NO remonta la vista: LanguageSelector hace
    // $router.push a la ruta actual, que sin prefijo :lang es la misma ruta.
    // Si faqItems se congelara en data(), el acordeón quedaría en inglés
    // mientras el resto de la página pasa a español.
    const wrapper = build()
    const preguntaEn = wrapper.vm.faqItems[0].question

    wrapper.vm.$i18n.locale = 'es'
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.faqItems[0].question).not.toBe(preguntaEn)
    expect(wrapper.vm.faqItems[0].question).toBe(es.gdpr.privacyAndTerms.faq.q1)
  })

  it('conserva la pregunta abierta al cambiar de idioma', () => {
    // El contenido es traducible; el estado de apertura no.
    const wrapper = build()
    wrapper.vm.toggleFaq(1)
    wrapper.vm.$i18n.locale = 'es'

    expect(wrapper.vm.faqItems[1].open).toBe(true)
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('no deja ningún string en duro sin traducir en el título', () => {
    expect(build().vm.$t('gdpr.privacyAndTerms.title')).not.toBe('gdpr.privacyAndTerms.title')
  })
})
