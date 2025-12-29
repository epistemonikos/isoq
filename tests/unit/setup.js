import Vue from 'vue'
import { BootstrapVue } from 'bootstrap-vue'

// Silenciar avisos de Vue en tests
Vue.config.productionTip = false
Vue.config.devtools = false

// Registrar BootstrapVue globalmente
Vue.use(BootstrapVue)

// Registrar stub para FontAwesome
Vue.component('font-awesome-icon', {
  template: '<span></span>'
})

// Mock de localStorage
const localStorageMock = {
  store: {},
  getItem (key) {
    return this.store[key] || null
  },
  setItem (key, value) {
    this.store[key] = String(value)
  },
  removeItem (key) {
    delete this.store[key]
  },
  clear () {
    this.store = {}
  }
}
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock
})

// Mock de window.matchMedia (requerido por BootstrapVue)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  }))
})
