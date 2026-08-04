import Vue from 'vue'

// Suppress Vue warnings during tests
Vue.config.productionTip = false
Vue.config.devtools = false

// Mock i18n
Vue.prototype.$t = (key) => key
Vue.prototype.$tc = (key) => key

// Mock router
Vue.prototype.$router = {
  push: jest.fn(),
  replace: jest.fn(),
  go: jest.fn(),
  back: jest.fn()
}

Vue.prototype.$route = {
  path: '/',
  params: {},
  query: {}
}

// Mock store
Vue.prototype.$store = {
  state: Vue.observable({}),
  getters: {},
  commit: jest.fn(),
  dispatch: jest.fn()
}

// Mock window.print
global.print = jest.fn()

// Mock URL methods for JSDOM
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: jest.fn() })
}
if (typeof window.URL.revokeObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'revokeObjectURL', { value: jest.fn() })
}

// Mock $notify plugin so component tests don't need to set it up individually
Vue.prototype.$notify = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn()
}

// crypto.getRandomValues for JSDOM: every browser we target has it (since IE11), but
// this JSDOM build does not expose it. Backed by Node's real CSPRNG so tests that check
// the entropy of generated keys measure actual randomness.
if (typeof window.crypto === 'undefined' || !window.crypto.getRandomValues) {
  const nodeCrypto = require('crypto')
  Object.defineProperty(window, 'crypto', {
    value: { getRandomValues: buffer => nodeCrypto.randomFillSync(buffer) },
    configurable: true
  })
}

// Suppress Bootstrap Vue warnings
Vue.config.silent = true

