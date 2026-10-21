// The Sentry DSN comes from the environment, not from a local edit of the file.
//
// `config/prod.env.js` mixes two things that do not behave the same: feature flags, which MUST
// travel with the code, and per-host values, which cannot. As long as the secret was filled in by
// editing the file, every server ended up with a modified tracked file — and that breaks
// `git pull` as soon as a commit touches that same file.
//
// It happened: `2d6185e9` (2026-08-20) modified `config/prod.env.js`, the pull on the test server
// aborted, and the checkout stayed stuck for eleven days while builds kept running on old code.
// The file that blocks the pull is precisely the one carrying the flags, so the change most likely
// not to arrive is a flag change — and `2d6185e9` was literally turning one on.

const path = require('path')

// The `.env` loader is mocked: otherwise a real `.env` on the machine running the suite would
// change what these tests see. What the loader does is tested in `env.spec.js`.
jest.mock('../../../config/env', () => ({
  ...jest.requireActual('../../../config/env'),
  loadEnvFile: jest.fn()
}))

const prodEnvPath = path.resolve(__dirname, '../../../config/prod.env.js')

// Values are double-quoted on purpose: `DefinePlugin` substitutes them verbatim into the code, so
// what is stored here is the *source literal*, not the string.
const load = () => {
  jest.resetModules()
  return require(prodEnvPath)
}

describe('config/prod.env.js — the Sentry DSN', () => {
  const originalDsn = process.env.SENTRY_DSN

  afterEach(() => {
    if (originalDsn === undefined) delete process.env.SENTRY_DSN
    else process.env.SENTRY_DSN = originalDsn
  })

  it('takes the DSN from the environment variable', () => {
    process.env.SENTRY_DSN = 'https://abc@o1.ingest.sentry.io/2'
    expect(load().SENTRY_DSN).toBe('"https://abc@o1.ingest.sentry.io/2"')
  })

  it('without the variable it stays empty, not a placeholder', () => {
    // The previous value was `"YOUR_SENTRY_DSN_HERE"`, which is **truthy**. `main.js` does
    // `if (process.env.SENTRY_DSN)`, so any host that did not edit the file started Sentry with an
    // invalid DSN instead of skipping it. Empty is falsy and gets skipped, which is what the
    // `main.js` guard always meant.
    delete process.env.SENTRY_DSN
    expect(load().SENTRY_DSN).toBe('""')
  })

  it('the literal is always valid JSON, even with quotes in the value', () => {
    // Built with `JSON.stringify`, not by concatenating quotes: a value with a quote would break
    // the literal and the bundle would not compile — or worse, would compile anything.
    process.env.SENTRY_DSN = 'odd"with-quote'
    expect(() => JSON.parse(load().SENTRY_DSN)).not.toThrow()
    expect(JSON.parse(load().SENTRY_DSN)).toBe('odd"with-quote')
  })

  it('SENTRY_RELEASE reaches the bundle with the same fallback the sourcemaps plugin uses', () => {
    // `main.js` passes `process.env.SENTRY_RELEASE` to `Sentry.init`, but nobody defined it for
    // `DefinePlugin`: in the browser it was `undefined`. Meanwhile the plugin uploaded sourcemaps
    // with `SENTRY_RELEASE || package.json version`, so events and sourcemaps never shared a
    // release and stack traces stayed minified.
    delete process.env.SENTRY_RELEASE
    expect(load().SENTRY_RELEASE).toBe(JSON.stringify(require('../../../package.json').version))
    process.env.SENTRY_RELEASE = 'isoq@abc123'
    expect(load().SENTRY_RELEASE).toBe('"isoq@abc123"')
    delete process.env.SENTRY_RELEASE
  })

  it('the sourcemaps plugin credentials do NOT reach the bundle', () => {
    // SENTRY_AUTH_TOKEN/ORG/PROJECT are read by `webpack.prod.conf.js` at build time. Everything in
    // this file ends up as a literal in the JS any visitor downloads.
    process.env.SENTRY_AUTH_TOKEN = 'secret'
    const env = load()
    delete process.env.SENTRY_AUTH_TOKEN
    expect(Object.keys(env)).not.toContain('SENTRY_AUTH_TOKEN')
    expect(Object.values(env).join()).not.toContain('secret')
  })
})

describe('config/prod.env.js — feature flags', () => {
  // The default lives in the file and travels with the code: a host that configures nothing gets
  // what the last commit decided. The environment variable only overrides it on the host that
  // defines it, without editing the tracked file — which is what left the checkout dirty, the
  // build stamped `-dirty` and `git pull` aborted.
  const FLAGS = {
    ENABLE_CONCURRENCY_CONTROL: '"on"',
    ENABLE_REGISTRATION: '"true"',
    ENABLE_GDPR: '"true"',
    ENABLE_CAMELOT: '"false"'
  }
  const originals = {}

  beforeEach(() => {
    Object.keys(FLAGS).forEach(f => { originals[f] = process.env[f]; delete process.env[f] })
  })

  afterEach(() => {
    Object.keys(FLAGS).forEach(f => {
      if (originals[f] === undefined) delete process.env[f]
      else process.env[f] = originals[f]
    })
  })

  it.each(Object.entries(FLAGS))('%s without the variable takes the committed default', (flag, fallback) => {
    expect(load()[flag]).toBe(fallback)
  })

  it.each(Object.keys(FLAGS))('%s can be overridden from the environment', (flag) => {
    process.env[flag] = 'off'
    expect(load()[flag]).toBe('"off"')
  })

  it.each(Object.entries(FLAGS))('%s with an empty variable falls back to the default, not to off', (flag, fallback) => {
    // `FLAG= npm run build` is almost always a half-written export, not a decision. Silently
    // turning GDPR or concurrency control off because of it would be the worst possible mistake.
    process.env[flag] = ''
    expect(load()[flag]).toBe(fallback)
  })
})

describe('config/*.env — the root .env', () => {
  it('prod.env.js loads .env when read', () => {
    // It is the only load point: dev.env and test.env.js inherit from prod.env.js through
    // webpack-merge, and webpack.prod.conf.js requires it before reading SENTRY_AUTH_TOKEN.
    // The mock is required AFTER `load()`: `resetModules` creates a new mock instance, and the
    // previous one does not see the call.
    load()
    const { loadEnvFile } = require('../../../config/env')
    expect(loadEnvFile).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['dev.env', 'ENABLE_GDPR', '"false"'],
    ['test.env.js', 'ENABLE_REGISTRATION', '"false"']
  ])('%s keeps its own default and can also be overridden from the environment', (file, flag, fallback) => {
    const filePath = path.resolve(__dirname, '../../../config', file)
    const original = process.env[flag]
    delete process.env[flag]
    jest.resetModules()
    expect(require(filePath)[flag]).toBe(fallback)
    process.env[flag] = 'on'
    jest.resetModules()
    expect(require(filePath)[flag]).toBe('"on"')
    if (original === undefined) delete process.env[flag]
    else process.env[flag] = original
  })
})
