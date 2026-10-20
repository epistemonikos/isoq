import {
  REDACTED,
  scrubUrl,
  scrubText,
  scrubBreadcrumb,
  scrubEvent,
  sentryUser,
  sentryPrivacyOptions
} from '@/utils/sentryPrivacy'

// Tokens (recovery, email verification, invitations, sharedToken) are 64 hex
// characters; ids are 24. Anything from 32 hex up is treated as a secret.
const TOKEN = 'a'.repeat(32) + '0123456789abcdef'.repeat(2)
const PROJECT_ID = '5f0c1a2b3c4d5e6f7a8b9c0d'

describe('scrubUrl', () => {
  it('drops the query string of an API URL', () => {
    expect(scrubUrl('https://isoq.example.org/api/share/project/1/unshare?email=ana@example.com&org_id=2'))
      .toBe('https://isoq.example.org/api/share/project/1/unshare')
  })

  it('drops the query string inside the hash route', () => {
    expect(scrubUrl(`https://isoq.example.org/#/create_an_account?token=${TOKEN}`))
      .toBe('https://isoq.example.org/#/create_an_account')
  })

  it('drops the query string before the hash too', () => {
    expect(scrubUrl('https://isoq.example.org/?ref=ana@example.com#/workspace'))
      .toBe('https://isoq.example.org/#/workspace')
  })

  it('redacts the email and the token of the password recovery link', () => {
    expect(scrubUrl(`https://isoq.example.org/#/accounts/new_password/ana@example.com/${TOKEN}`))
      .toBe(`https://isoq.example.org/#/accounts/new_password/${REDACTED}/${REDACTED}`)
  })

  it('redacts a percent-encoded email', () => {
    expect(scrubUrl('/#/accounts/new_password/ana%40example.com/x'))
      .toBe(`/#/accounts/new_password/${REDACTED}/x`)
  })

  it('redacts a token in an API path', () => {
    expect(scrubUrl(`/api/shared/${TOKEN}/isoqf_characteristics`))
      .toBe(`/api/shared/${REDACTED}/isoqf_characteristics`)
  })

  it('keeps ids, which are needed to debug', () => {
    expect(scrubUrl(`/#/workspace/${PROJECT_ID}/isoqf/${PROJECT_ID}`))
      .toBe(`/#/workspace/${PROJECT_ID}/isoqf/${PROJECT_ID}`)
  })

  it('leaves non-strings alone', () => {
    expect(scrubUrl(undefined)).toBeUndefined()
  })
})

describe('scrubText', () => {
  it('redacts emails and tokens inside free text', () => {
    expect(scrubText(`No account for ana.b+1@example.co.uk with ${TOKEN}`))
      .toBe(`No account for ${REDACTED} with ${REDACTED}`)
  })

  it('redacts an email inside a URL in the text', () => {
    expect(scrubText('GET /x?email=ana%40example.com'))
      .toBe(`GET /x?email=${REDACTED}`)
  })
})

describe('scrubBreadcrumb', () => {
  it('scrubs both ends of a navigation', () => {
    const crumb = scrubBreadcrumb({
      category: 'navigation',
      data: { from: '/#/accounts/check_email?email=ana@example.com', to: `/#/accounts/verify_email/${TOKEN}` }
    })
    expect(crumb.data).toEqual({ from: '/#/accounts/check_email', to: `/#/accounts/verify_email/${REDACTED}` })
  })

  it('scrubs the URL of a request', () => {
    const crumb = scrubBreadcrumb({
      category: 'xhr',
      data: { method: 'POST', url: '/share/project/1/unshare?email=ana@example.com', status_code: 200 }
    })
    expect(crumb.data).toEqual({ method: 'POST', url: '/share/project/1/unshare', status_code: 200 })
  })

  it('drops the logged arguments of a console breadcrumb and scrubs its message', () => {
    // An axios error logged with console.error carries the request body (a password, an email).
    const crumb = scrubBreadcrumb({
      category: 'console',
      message: 'Login failed for ana@example.com',
      data: { arguments: ['Login failed', { config: { data: '{"password":"secret"}' } }], logger: 'console' }
    })
    expect(crumb.message).toBe(`Login failed for ${REDACTED}`)
    expect(crumb.data).toEqual({ logger: 'console' })
  })
})

describe('scrubEvent', () => {
  const event = () => ({
    message: 'Unexpected answer for ana@example.com',
    transaction: '/accounts/new_password/:username/:token',
    request: {
      url: `https://isoq.example.org/#/accounts/new_password/ana@example.com/${TOKEN}`,
      query_string: 'email=ana@example.com',
      headers: { Referer: 'https://mail.example.org/?u=ana@example.com', 'User-Agent': 'UA' }
    },
    user: { id: 'u1', email: 'ana@example.com', username: 'ana@example.com', ip_address: '{{auto}}' },
    exception: { values: [{ type: 'Error', value: `No token ${TOKEN}` }] },
    breadcrumbs: [{ category: 'xhr', data: { url: '/x?email=ana@example.com' } }],
    contexts: {
      trace: { data: { 'params.username': 'ana@example.com', 'params.token': TOKEN, 'query.token': TOKEN, 'sentry.origin': 'auto.pageload.vue' } }
    },
    spans: [{
      description: `GET /api/shared/${TOKEN}`,
      data: { url: `/api/shared/${TOKEN}?project_id=1`, 'params.token': TOKEN, 'http.method': 'GET' }
    }]
  })

  it('scrubs the URL of the page and drops its query string', () => {
    const out = scrubEvent(event())
    expect(out.request.url).toBe(`https://isoq.example.org/#/accounts/new_password/${REDACTED}/${REDACTED}`)
    expect(out.request.query_string).toBeUndefined()
    expect(out.request.headers).toEqual({ Referer: 'https://mail.example.org/', 'User-Agent': 'UA' })
  })

  it('keeps only the id of the user', () => {
    expect(scrubEvent(event()).user).toEqual({ id: 'u1' })
  })

  it('scrubs the message, the exceptions and the breadcrumbs', () => {
    const out = scrubEvent(event())
    expect(out.message).toBe(`Unexpected answer for ${REDACTED}`)
    expect(out.exception.values[0].value).toBe(`No token ${REDACTED}`)
    expect(out.breadcrumbs[0].data.url).toBe('/x')
  })

  it('drops the route params and query the router puts on a transaction', () => {
    const out = scrubEvent(event())
    expect(out.contexts.trace.data).toEqual({ 'sentry.origin': 'auto.pageload.vue' })
    expect(out.spans[0].data).toEqual({ url: `/api/shared/${REDACTED}`, 'http.method': 'GET' })
    expect(out.spans[0].description).toBe(`GET /api/shared/${REDACTED}`)
  })

  it('tolerates an event without any of those parts', () => {
    expect(scrubEvent({})).toEqual({})
  })
})

describe('sentryUser', () => {
  it('identifies the person by id only, never by email', () => {
    expect(sentryUser({ id: 'u1', email: 'ana@example.com', username: 'ana@example.com' })).toEqual({ id: 'u1' })
  })
})

describe('sentryPrivacyOptions', () => {
  it('does not send component props nor default PII', () => {
    expect(sentryPrivacyOptions.attachProps).toBe(false)
    expect(sentryPrivacyOptions.sendDefaultPii).toBe(false)
  })

  it('scrubs breadcrumbs, errors and transactions', () => {
    expect(sentryPrivacyOptions.beforeBreadcrumb).toBe(scrubBreadcrumb)
    expect(sentryPrivacyOptions.beforeSend).toBe(scrubEvent)
    expect(sentryPrivacyOptions.beforeSendTransaction).toBe(scrubEvent)
  })
})
