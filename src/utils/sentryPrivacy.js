// What leaves the browser for Sentry, stripped of personal data and secrets.
//
// Sentry records, by default, the full URL of the page and of every request,
// the route params and query of every navigation, what was logged to the
// console and the props of the component that failed. In iSoQ those carry
// emails (password recovery link, unshare) and tokens (recovery, email
// verification, invitations, the anonymous read link).
//
// The rule is on the shape, not a list of known routes: query strings are
// dropped whole, and any path segment or text that looks like an email or a
// token is redacted. Ids (24 hex) are kept; tokens are 64 hex.

export const REDACTED = '[redacted]'

const EMAIL = /[^\s/?#&=@]+(?:@|%40)[^\s/?#&=]+/gi
const TOKEN = /[0-9a-f]{32,}/gi

export const scrubText = (text) => {
  if (typeof text !== 'string') return text
  return text.replace(EMAIL, REDACTED).replace(TOKEN, REDACTED)
}

const dropQuery = (part) => part.split('?')[0]

export const scrubUrl = (url) => {
  if (typeof url !== 'string') return url
  // In hash mode the route has its own query string after the '#'.
  const [base, ...hash] = url.split('#')
  return scrubText([dropQuery(base), ...hash.map(dropQuery)].join('#'))
}

const URL_KEYS = ['url', 'from', 'to']

const scrubUrlFields = (data) => {
  const out = { ...data }
  URL_KEYS.forEach((key) => {
    if (key in out) out[key] = scrubUrl(out[key])
  })
  return out
}

export const scrubBreadcrumb = (crumb) => {
  const out = { ...crumb }
  if ('message' in out) out.message = scrubText(out.message)
  if (out.data) {
    out.data = scrubUrlFields(out.data)
    // An axios error logged with console.error carries the request body.
    if (out.category === 'console') delete out.data.arguments
  }
  return out
}

// vueRouterInstrumentation copies every route param and query value onto the
// transaction as `params.<key>` / `query.<key>`.
const dropRouteAttributes = (data) => {
  const out = scrubUrlFields(data)
  Object.keys(out).forEach((key) => {
    if (key.startsWith('params.') || key.startsWith('query.')) delete out[key]
  })
  return out
}

const scrubRequest = (request) => {
  const out = { ...request, url: scrubUrl(request.url) }
  delete out.query_string
  if (out.headers && out.headers.Referer) {
    out.headers = { ...out.headers, Referer: scrubUrl(out.headers.Referer) }
  }
  return out
}

export const scrubEvent = (event) => {
  const out = { ...event }
  if ('message' in out) out.message = scrubText(out.message)
  if ('transaction' in out) out.transaction = scrubText(out.transaction)
  if (out.request) out.request = scrubRequest(out.request)
  if (out.user) out.user = sentryUser(out.user)
  if (out.exception && out.exception.values) {
    out.exception = {
      ...out.exception,
      values: out.exception.values.map((value) => ({ ...value, value: scrubText(value.value) }))
    }
  }
  if (out.breadcrumbs) out.breadcrumbs = out.breadcrumbs.map(scrubBreadcrumb)
  if (out.contexts && out.contexts.trace && out.contexts.trace.data) {
    out.contexts = {
      ...out.contexts,
      trace: { ...out.contexts.trace, data: dropRouteAttributes(out.contexts.trace.data) }
    }
  }
  if (out.spans) {
    out.spans = out.spans.map((span) => ({
      ...span,
      description: scrubText(span.description),
      ...(span.data ? { data: dropRouteAttributes(span.data) } : {})
    }))
  }
  return out
}

// The person is identified by id only: the email would reach Sentry with every error.
export const sentryUser = (user) => ({ id: user.id })

export const sentryPrivacyOptions = {
  attachProps: false,
  sendDefaultPii: false,
  beforeBreadcrumb: scrubBreadcrumb,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent
}
