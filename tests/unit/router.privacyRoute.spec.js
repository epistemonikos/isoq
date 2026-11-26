import routes from '@/router'

const routeByName = (name) => routes.find(r => r.name === name)
const routeByPath = (path) => routes.find(r => r.path === path)

// Short URLs of the legal parts: the three master published and the two new in v1.0.
const SHORT_URLS = ['/terms-and-conditions', '/privacy-policy', '/intellectual-property',
  '/cookie-policy', '/data-processing-terms']

// The legal documents are public whatever ENABLE_GDPR says: the flag decides whether people
// must ACCEPT them (sign-up box, re-acceptance modal, router guard), not whether they can read
// them. With the flag off the page used to redirect to the home, so there was no way to read
// the terms at all.
describe('PrivacyAndTerms route — public', () => {
  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  it.each(['on', 'off'])('has no gate with ENABLE_GDPR %s', (flag) => {
    process.env.ENABLE_GDPR = flag
    expect(routeByName('PrivacyAndTerms').beforeEnter).toBeUndefined()
  })

  it.each(SHORT_URLS)('%s redirects to it by name', (path) => {
    expect(routeByPath(path).redirect.name).toBe('PrivacyAndTerms')
  })
})
