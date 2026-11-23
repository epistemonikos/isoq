import fs from 'fs'
import path from 'path'
import { shallowMount } from '@vue/test-utils'
import App from '@/App.vue'

// #416: el PDF (impresión del navegador) con tema oscuro salía con todo el texto gris claro
// sobre papel blanco —Chrome no imprime los fondos, pero sí el color de texto del tema— y
// sin los colores de CAMELOT, que son fondos. Al imprimir: tema claro y fondos impresos.
const theme = () => document.documentElement.getAttribute('data-theme')

function mountApp (pref) {
  return shallowMount(App, {
    mocks: { $store: { state: { theme: pref } }, $route: { path: '/', meta: {} }, $t: k => k },
    stubs: ['router-view', 'router-link', 'main-menu', 'offline-indicator', 'session-expired-modal']
  })
}

describe('App — printing', () => {
  afterEach(() => document.documentElement.removeAttribute('data-theme'))

  it('prints in the light theme and goes back to dark afterwards', () => {
    const wrapper = mountApp('dark')
    expect(theme()).toBe('dark')
    window.dispatchEvent(new Event('beforeprint'))
    expect(theme()).toBe('light')
    window.dispatchEvent(new Event('afterprint'))
    expect(theme()).toBe('dark')
    wrapper.destroy()
  })

  it('a light theme stays light', () => {
    const wrapper = mountApp('light')
    window.dispatchEvent(new Event('beforeprint'))
    window.dispatchEvent(new Event('afterprint'))
    expect(theme()).toBe('light')
    wrapper.destroy()
  })

  it('stops listening when destroyed', () => {
    const wrapper = mountApp('dark')
    wrapper.destroy()
    window.dispatchEvent(new Event('beforeprint'))
    expect(theme()).toBe('dark')
  })

  it('the stylesheet prints backgrounds (CAMELOT and CERQual colours)', () => {
    const scss = fs.readFileSync(path.resolve('src/assets/styles/main.scss'), 'utf8')
    expect(scss).toMatch(/@media print\s*\{[^}]*html\s*\{[^}]*print-color-adjust:\s*exact/)
  })

  // Megan (#416): la tabla tiene que verse completa en el PDF, sin barra ni columnas cortadas.
  it('the stylesheet lets wide tables fit the printed page', () => {
    const scss = fs.readFileSync(path.resolve('src/assets/styles/main.scss'), 'utf8')
    const print = (scss.match(/@media print\s*\{[\s\S]*?\n\}/) || [''])[0]
    expect(print).toMatch(/\.table-responsive[^{]*\{[^}]*overflow:\s*visible\s*!important/)
    expect(print).toMatch(/table-layout:\s*fixed/)
    expect(print).toMatch(/overflow-wrap:\s*anywhere/)
  })
})
