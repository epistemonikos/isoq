import en from '@/lang/en.json'
import es from '@/lang/es.json'
import pt from '@/lang/pt.json'
import { LEGAL_PARTS } from '@/constants/legal'

function resolve (dict, dotted) {
  return dotted.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict)
}

const KEYS = [
  ...LEGAL_PARTS.map(key => `gdpr.privacyAndTerms.tabs.${key}`),
  'gdpr.privacyAndTerms.title',
  'gdpr.privacyAndTerms.translationNotice',
  'gdpr.privacyAndTerms.originalNotice',
  'gdpr.privacyAndTerms.showOriginal',
  'gdpr.privacyAndTerms.showTranslation',
  'gdpr.privacyAndTerms.loadError',
  'gdpr.legal.agreementLinks',
  'gdpr.legal.acceptLabel',
  'gdpr.legal.noticeLabel',
  'gdpr.terms.intro',
  'common.retry',
  'common.loading'
]

// Keys of the placeholder pages and of the single "accept everything" box, gone with v1.0.
const RETIRED = [
  'gdpr.privacyAndTerms.tabOverview',
  'gdpr.privacyAndTerms.faq',
  'gdpr.privacyAndTerms.terms',
  'gdpr.privacyAndTerms.privacy',
  'gdpr.privacyAndTerms.property',
  'gdpr.terms.acceptLabel',
  'gdpr.terms.reviewHere',
  'gdpr.signup'
]

describe.each([['en', en], ['es', es], ['pt', pt]])('legal UI texts in %s', (_, dict) => {
  it.each(KEYS)('%s exists', (key) => {
    expect(typeof resolve(dict, key)).toBe('string')
  })

  it.each(RETIRED)('%s is gone', (key) => {
    expect(resolve(dict, key)).toBeUndefined()
  })

  // The translations were made with AI and nobody has reviewed them against the original: the
  // notice says so, besides saying that English prevails.
  it('the translation notice says the text was translated with artificial intelligence', () => {
    expect(resolve(dict, 'gdpr.privacyAndTerms.translationNotice'))
      .toMatch(/artificial intelligence|inteligencia artificial|inteligência artificial/i)
  })

  // The Privacy Policy and the Cookie Policy are notices: people acknowledge them, they do not
  // accept them (clause 1.3 of the Terms). The box names only the Agreement.
  it('the acceptance box does not ask to accept the privacy policy', () => {
    expect(resolve(dict, 'gdpr.legal.acceptLabel')).not.toMatch(/privac|cookie/i)
  })
})
