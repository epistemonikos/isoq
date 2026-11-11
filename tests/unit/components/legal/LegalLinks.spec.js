import { mount, RouterLinkStub } from '@vue/test-utils'
import LegalLinks from '@/components/legal/LegalLinks'

const build = (parts) => mount(LegalLinks, {
  propsData: { parts },
  stubs: { 'router-link': RouterLinkStub },
  mocks: { $t: (key) => key }
})

describe('LegalLinks.vue', () => {
  it('links each part to its tab, in a new window', () => {
    const links = build(['terms', 'property']).findAllComponents(RouterLinkStub)

    expect(links.wrappers.map(link => link.props('to'))).toEqual([
      { name: 'PrivacyAndTerms', query: { tab: 'terms' } },
      { name: 'PrivacyAndTerms', query: { tab: 'property' } }
    ])
    // Leaving the sign-up form or the acceptance modal would lose what was typed.
    links.wrappers.forEach(link => expect(link.attributes('target')).toBe('_blank'))
  })

  it('names each part as its tab does', () => {
    expect(build(['privacy', 'cookies']).text())
      .toBe('gdpr.privacyAndTerms.tabs.privacy · gdpr.privacyAndTerms.tabs.cookies')
  })
})
