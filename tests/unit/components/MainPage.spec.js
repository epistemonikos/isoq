import { shallowMount, createLocalVue, RouterLinkStub } from '@vue/test-utils'
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
    // RouterLinkStub and not the string stub: an auto stub has no `to` prop to read.
    stubs: {
      ...Object.fromEntries(['b-container', 'b-row', 'b-col', 'b-card', 'b-button', 'b-img',
        'b-embed', 'b-alert'].map(name => [name, true])),
      'router-link': RouterLinkStub
    }
  })
}

// The footer link is the only way to the legal documents for someone without a session (see
// MainPage.vue). The documents are public whatever ENABLE_GDPR says, so the link is always there.
describe('MainPage.vue — legal link in the footer', () => {
  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  it.each(['on', 'off'])('links to the legal documents with ENABLE_GDPR %s', (flag) => {
    process.env.ENABLE_GDPR = flag
    const wrapper = build()
    const targets = wrapper.findAllComponents(RouterLinkStub).wrappers.map(w => w.props('to'))

    expect(wrapper.text()).toContain(en.gdpr.privacyAndTerms.title)
    expect(targets.some(to => to && to.name === 'PrivacyAndTerms')).toBe(true)
  })
})
