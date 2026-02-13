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

// Suppress Bootstrap Vue warnings
Vue.config.silent = true

