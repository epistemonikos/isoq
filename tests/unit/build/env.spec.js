// `config/env.js`: where per-server values come from.
//
// Precedence, highest first: the shell variable, the server's `.env`, the committed default. The
// `.env` is not versioned (its template is `.env.example`); the default is, so that a new flag
// reaches every server with `git pull` even if nobody touches its `.env`.

const fs = require('fs')
const os = require('os')
const path = require('path')

const { loadEnvFile, fromEnv } = require('../../../config/env')

const VARIABLE = 'ISOQ_TEST_ENV_VARIABLE'

describe('config/env.js', () => {
  let dir

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'isoq-env-'))
    delete process.env[VARIABLE]
  })

  afterEach(() => {
    delete process.env[VARIABLE]
    fs.rmdirSync(dir, { recursive: true })
  })

  const writeEnv = (content) => {
    const file = path.join(dir, '.env')
    fs.writeFileSync(file, content)
    return file
  }

  it('reads values from the .env file', () => {
    loadEnvFile(writeEnv(`${VARIABLE}=from-file\n`))
    expect(fromEnv(VARIABLE, 'default')).toBe('"from-file"')
  })

  it('the shell variable wins over .env', () => {
    // `ENABLE_GDPR=false npm run build` must keep working for a one-off test without editing the
    // server's `.env`.
    process.env[VARIABLE] = 'from-shell'
    loadEnvFile(writeEnv(`${VARIABLE}=from-file\n`))
    expect(fromEnv(VARIABLE, 'default')).toBe('"from-shell"')
  })

  it('without .env it does not fail and keeps the committed default', () => {
    // A server that has not created its `.env` yet must still build as before.
    expect(() => loadEnvFile(path.join(dir, 'missing.env'))).not.toThrow()
    expect(fromEnv(VARIABLE, 'default')).toBe('"default"')
  })

  it('an empty line in .env falls back to the default instead of turning the value off', () => {
    // `ENABLE_GDPR=` is almost always a half-written line, not a decision.
    loadEnvFile(writeEnv(`${VARIABLE}=\n`))
    expect(fromEnv(VARIABLE, 'default')).toBe('"default"')
  })

  it('returns a valid source literal even when the value contains quotes', () => {
    // `DefinePlugin` substitutes the value as code: a stray quote would break the bundle.
    process.env[VARIABLE] = 'odd"with-quote'
    expect(JSON.parse(fromEnv(VARIABLE, ''))).toBe('odd"with-quote')
  })
})
