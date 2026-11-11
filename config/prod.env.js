'use strict'

// Flags and SENTRY_* are configured per server in the root `.env` (template: `.env.example`),
// never by editing this file. See `config/env.js`.
const { loadEnvFile, fromEnv } = require('./env')

loadEnvFile()

module.exports = {
  NODE_ENV: '"production"',
  BASE_URL: '"/"',
  API_URL: '"/api"',
  PUBLIC_PATH: '"/"',
  // App-wide granular locking: Step 2 criteria boxes, finding identity in the iSoQ tab, studies
  // and columns in Steps 3/4, and Step 4 assessment leaves. Enabled together with finding
  // identity locking (branch feature/isoq-tab-freshness-and-finding-locks).
  //
  // NOTE what this flag does NOT cover: full-document PATCHes to isoqf_lists/isoqf_findings do
  // not go through @verify_ref_lock in the backend, so there the lock coordinates the UI but does
  // not prevent the write. It stops being advisory once the endpoint in
  // docs/spec-backend-endpoint-identidad-finding.md exists.
  //
  // Automatic refresh between users (projectFreshnessMixin) is independent of this flag and
  // works with it off.
  ENABLE_CONCURRENCY_CONTROL: fromEnv('ENABLE_CONCURRENCY_CONTROL', 'on'),
  ENABLE_REGISTRATION: fromEnv('ENABLE_REGISTRATION', 'true'),
  // The whole GDPR surface: mandatory terms acceptance, the Privacy and Terms page, consent
  // preferences and profile data management. 'on' to preserve current production behavior.
  //
  // Do NOT turn it off while ENABLE_REGISTRATION is 'true' unless the backend has its own
  // ENABLE_GDPR off as well: otherwise POST /create_user answers 400 for lack of terms_accepted.
  ENABLE_GDPR: fromEnv('ENABLE_GDPR', 'true'),
  // Offer CAMELOT when creating a project or changing its methodology. When off, only the
  // classic methodology is offered; projects that are already CAMELOT keep showing as such
  // (src/constants/camelot.js). Off by default: the GDPR release goes out without CAMELOT. To
  // enable it on a server: ENABLE_CAMELOT=true in that server's `.env`, and rebuild.
  ENABLE_CAMELOT: fromEnv('ENABLE_CAMELOT', 'false'),
  // Empty by default rather than a placeholder: `main.js` does `if (process.env.SENTRY_DSN)`, and
  // `"YOUR_SENTRY_DSN_HERE"` was truthy — an unconfigured host started Sentry with an invalid DSN
  // instead of skipping it. It used to be filled in by editing this file; that is how the test
  // server checkout got stuck for eleven days (`2d6185e9`, 2026-08-20).
  SENTRY_DSN: fromEnv('SENTRY_DSN', ''),
  // Same fallback as `SentryWebpackPlugin` in `build/webpack.prod.conf.js`: if events and
  // sourcemaps do not share a release, stack traces arrive minified.
  //
  // SENTRY_AUTH_TOKEN/ORG/PROJECT do NOT go here: they belong to the plugin and are read at build
  // time, and everything in this file ends up as a literal in the JS any visitor downloads.
  SENTRY_RELEASE: fromEnv('SENTRY_RELEASE', require('../package.json').version)
}
