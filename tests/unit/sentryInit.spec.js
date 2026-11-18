import fs from 'fs'
import path from 'path'

// main.js boots the whole app and no spec imports it, so the wiring is read
// from the source: without these options every error carries URLs with emails
// and tokens (see src/utils/sentryPrivacy.js).
describe('Sentry.init in main.js', () => {
  const source = fs.readFileSync(path.resolve('src/main.js'), 'utf8')
  const init = source.slice(source.indexOf('Sentry.init({'))
  const call = init.slice(0, init.indexOf('\n  })') + 4)

  it('passes the privacy options', () => {
    expect(source).toMatch(/import \{ sentryPrivacyOptions \} from '\.\/utils\/sentryPrivacy'/)
    expect(call).toContain('...sentryPrivacyOptions')
  })

  it('passes them last, so no option before them can switch them off', () => {
    const lines = call.trim().split('\n').map(line => line.trim()).filter(Boolean)
    expect(lines[lines.length - 2]).toBe('...sentryPrivacyOptions')
  })
})
