'use strict'

// Where per-server values come from: feature flags and Sentry.
//
// Precedence, highest first:
//   1. the shell variable           `ENABLE_GDPR=false npm run build` — a one-off test
//   2. the root `.env` file         this server's own settings; NOT versioned (template: `.env.example`)
//   3. the committed default        the second argument of `fromEnv`
//
// Why the default lives in code and not only in `.env`: a new flag has to reach every server with
// `git pull`, even if nobody touches its `.env`. If the value existed only in a per-server file,
// the flag would be silently missing, and for GDPR missing means off (`src/constants/gdpr.js`).
//
// And why `.env` instead of editing `config/*.env.js`: those files are tracked. Editing them on a
// server leaves the checkout dirty, the build stamp comes out `-dirty`, and `git pull` aborts as
// soon as a commit touches the same file — that is how the test server got stuck for eleven days
// (`2d6185e9`, 2026-08-20).

const path = require('path')

const ENV_FILE = path.resolve(__dirname, '../.env')

// `dotenv` does not override variables that already exist: that is what keeps the shell above the
// file. A missing `.env` is not an error — it returns `{ error }` without throwing — because a
// server without `.env` has to build with the defaults, as before.
function loadEnvFile (file = ENV_FILE) {
  require('dotenv').config({ path: file })
}

// `||` and not `??`: an empty value (`ENABLE_GDPR=`) is almost always a half-written line, and it
// should not silently turn a flag off. It falls back to the default.
//
// `JSON.stringify` and not concatenated quotes: `DefinePlugin` substitutes this value as a source
// literal, so a quote inside the value would break the bundle.
function fromEnv (name, fallback) {
  return JSON.stringify(process.env[name] || fallback)
}

module.exports = { ENV_FILE, loadEnvFile, fromEnv }
