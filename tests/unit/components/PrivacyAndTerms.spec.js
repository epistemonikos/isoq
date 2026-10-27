jest.mock('@/utils/legalDocuments', () => ({ loadLegalDocuments: jest.fn() }))

import { mount, createLocalVue } from '@vue/test-utils'
import VueI18n from 'vue-i18n'
import PrivacyAndTerms from '@/components/PrivacyAndTerms'
import en from '@/lang/en.json'
import es from '@/lang/es.json'
import legalEn from '@/lang/legal/en.json'
import { loadLegalDocuments } from '@/utils/legalDocuments'

const localVue = createLocalVue()
localVue.use(VueI18n)

const flushPromises = () => new Promise(resolve => setTimeout(resolve))

// A stand-in for the Spanish file: same shape, recognisable headings.
const legalEs = {
  parts: Object.fromEntries(Object.entries(legalEn.parts).map(([key, part]) => [
    key, { ...part, heading: part.heading.replace('Part', 'Parte') }
  ]))
}
const DOCS = { en: legalEn, es: legalEs }

// b-tabs is replaced by plain markup so the test reads tab titles and contents from the DOM.
const stubs = {
  'b-tabs': { template: '<div class="tabs"><slot /></div>' },
  'b-tab': { props: ['title'], template: '<section class="tab" :data-title="title"><slot /></section>' },
  'b-container': { template: '<div><slot /></div>' },
  'b-alert': { props: ['show'], template: '<div v-if="show" class="alert"><slot /></div>' },
  'b-button': { template: '<button @click="$emit(\'click\')"><slot /></button>' },
  'b-spinner': true,
  'font-awesome-icon': true
}

function build ({ query = {}, locale = 'en' } = {}) {
  const i18n = new VueI18n({ locale, fallbackLocale: 'en', messages: { en, es } })
  return mount(PrivacyAndTerms, {
    localVue,
    i18n,
    stubs,
    mocks: {
      $route: { query },
      $router: { replace: jest.fn() }
    }
  })
}

describe('PrivacyAndTerms.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    loadLegalDocuments.mockImplementation(locale => Promise.resolve(DOCS[locale] || legalEn))
  })

  // ─── Tabs ────────────────────────────────────────────────────────────────────

  it('shows the six parts as tabs, A to F', async () => {
    const wrapper = build()
    await flushPromises()

    expect(wrapper.findAll('.tab').wrappers.map(tab => tab.attributes('data-title'))).toEqual([
      'A · Terms and Conditions',
      'B · Privacy Policy',
      'C · Cookie Policy',
      'D · Intellectual Property',
      'E · Data Processing Terms',
      'F · FAQ'
    ])
  })

  it.each([
    [{}, 0],
    [{ tab: 'terms' }, 0],
    [{ tab: 'privacy' }, 1],
    [{ tab: 'cookies' }, 2],
    [{ tab: 'property' }, 3],
    [{ tab: 'processing' }, 4],
    [{ tab: 'faq' }, 5],
    // The old first tab was the FAQ: links shared with ?tab=overview still land on it.
    [{ tab: 'overview' }, 5],
    [{ tab: 'nonsense' }, 0]
  ])('opens %o on tab %i', (query, index) => {
    expect(build({ query }).vm.activeTab).toBe(index)
  })

  it('writes the tab to the URL when it changes', async () => {
    const wrapper = build()
    wrapper.setData({ activeTab: 4 })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.$router.replace).toHaveBeenCalledWith({ query: { tab: 'processing' } })
  })

  it('does not rewrite the URL when it already names the tab', async () => {
    // Without this guard vue-router raises NavigationDuplicated on every mount.
    const wrapper = build({ query: { tab: 'privacy' } })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.$router.replace).not.toHaveBeenCalled()
  })

  // ─── Content ─────────────────────────────────────────────────────────────────

  it('shows each part with its heading and version', async () => {
    const wrapper = build()
    await flushPromises()

    const tabs = wrapper.findAll('.tab')
    expect(tabs.at(0).text()).toContain('Part A — Terms and Conditions of Use')
    expect(tabs.at(0).text()).toContain('Version 1.0 · Effective date: 1 December 2026')
    expect(tabs.at(5).text()).toContain('What is iSoQ?')
  })

  it('loads the documents of the current language', async () => {
    build({ locale: 'es' })
    await flushPromises()

    expect(loadLegalDocuments).toHaveBeenCalledWith('es')
  })

  it('follows a change of language without remounting', async () => {
    // Changing language does not remount the view: LanguageSelector pushes the same route.
    const wrapper = build()
    await flushPromises()

    wrapper.vm.$i18n.locale = 'es'
    await flushPromises()

    expect(wrapper.findAll('.tab').at(0).text()).toContain('Parte A')
  })

  it('ignores a late answer for a language no longer shown', async () => {
    let resolveEn
    loadLegalDocuments.mockImplementation(locale => locale === 'en'
      ? new Promise(resolve => { resolveEn = resolve })
      : Promise.resolve(legalEs))
    const wrapper = build()

    wrapper.vm.$i18n.locale = 'es'
    await flushPromises()
    resolveEn(legalEn)
    await flushPromises()

    expect(wrapper.findAll('.tab').at(0).text()).toContain('Parte A')
  })

  // ─── Translations ────────────────────────────────────────────────────────────

  it('says nothing about translations in English', async () => {
    const wrapper = build()
    await flushPromises()

    expect(wrapper.find('[data-test="translation-notice"]').exists()).toBe(false)
  })

  it('warns that a translation does not prevail over English', async () => {
    const wrapper = build({ locale: 'es' })
    await flushPromises()

    expect(wrapper.find('[data-test="translation-notice"]').text())
      .toContain(es.gdpr.privacyAndTerms.translationNotice)
  })

  it('shows the English original on request, without changing the language of the app', async () => {
    const wrapper = build({ locale: 'es' })
    await flushPromises()

    await wrapper.find('[data-test="translation-notice"] button').trigger('click')
    await flushPromises()

    expect(loadLegalDocuments).toHaveBeenLastCalledWith('en')
    expect(wrapper.findAll('.tab').at(0).text()).toContain('Part A — Terms and Conditions of Use')
    expect(wrapper.vm.$i18n.locale).toBe('es')
  })

  // ─── Loading ─────────────────────────────────────────────────────────────────

  it('says it could not load the documents, and retries', async () => {
    loadLegalDocuments.mockRejectedValueOnce(new Error('chunk failed'))
    const wrapper = build()
    await flushPromises()

    const alert = wrapper.find('[data-test="legal-load-error"]')
    expect(alert.text()).toContain(en.gdpr.privacyAndTerms.loadError)
    expect(wrapper.findAll('.tab').at(0).text()).not.toContain('Part A')

    await alert.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="legal-load-error"]').exists()).toBe(false)
    expect(wrapper.findAll('.tab').at(0).text()).toContain('Part A')
  })
})
