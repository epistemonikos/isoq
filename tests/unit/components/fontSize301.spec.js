import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import App from '@/App.vue'
import Accessibility from '@/components/Accessibility.vue'

// #301: el tamaño de letra elegido con +A/-A se perdía al recargar. Vive en el store,
// persistido en localStorage, y App lo aplica al <body> al arrancar y cuando cambia.

describe('#301 — font size persists', () => {
  afterEach(() => {
    localStorage.clear()
    document.body.style.fontSize = ''
    jest.resetModules()
  })

  describe('store', () => {
    it('setFontSize persists the size in localStorage', () => {
      const { store } = require('@/store')
      store.dispatch('setFontSize', 20)
      expect(store.state.fontSize).toBe(20)
      expect(localStorage.getItem('user_font_size')).toBe('20')
    })

    it('a fresh store reads the stored size', () => {
      localStorage.setItem('user_font_size', '22')
      const { store } = require('@/store')
      expect(store.state.fontSize).toBe(22)
    })

    it('without a stored size it stays null (CSS default)', () => {
      const { store } = require('@/store')
      expect(store.state.fontSize).toBeNull()
    })

    it('ignores garbage in localStorage', () => {
      localStorage.setItem('user_font_size', 'abc')
      const { store } = require('@/store')
      expect(store.state.fontSize).toBeNull()
    })
  })

  describe('App applies it to the body', () => {
    function mountApp (state) {
      return shallowMount(App, {
        mocks: { $store: { state: { theme: 'light', ...state } }, $route: { path: '/', meta: {} }, $t: k => k },
        stubs: ['router-view', 'router-link', 'main-menu', 'offline-indicator', 'session-expired-modal']
      })
    }

    it('on mount', () => {
      const wrapper = mountApp({ fontSize: 20 })
      expect(document.body.style.fontSize).toBe('20px')
      wrapper.destroy()
    })

    it('when the size changes, without reloading', async () => {
      const state = Vue.observable({ theme: 'light', fontSize: 16 })
      const wrapper = shallowMount(App, {
        mocks: { $store: { state }, $route: { path: '/', meta: {} }, $t: k => k },
        stubs: ['router-view', 'router-link', 'main-menu', 'offline-indicator', 'session-expired-modal']
      })
      state.fontSize = 22
      await wrapper.vm.$nextTick()
      expect(document.body.style.fontSize).toBe('22px')
      wrapper.destroy()
    })

    it('leaves the CSS default alone when nothing was chosen', () => {
      const wrapper = mountApp({ fontSize: null })
      expect(document.body.style.fontSize).toBe('')
      wrapper.destroy()
    })
  })

  describe('Accessibility buttons', () => {
    function mountAcc (fontSize) {
      const dispatch = jest.fn()
      const wrapper = shallowMount(Accessibility, {
        propsData: { isMenu: true },
        mocks: { $store: { state: { theme: 'light', fontSize }, dispatch }, $t: k => k },
        stubs: { 'b-nav-item': { template: '<a @click="$emit(\'click\')"><slot/></a>' } }
      })
      return { wrapper, dispatch }
    }
    const click = (wrapper, key) => wrapper.findAll('a').filter(a => a.text() === key).at(0).trigger('click')

    it('+A from the stored size dispatches the next size', async () => {
      const { wrapper, dispatch } = mountAcc(18)
      await click(wrapper, 'accessibility.increase_font')
      expect(dispatch).toHaveBeenCalledWith('setFontSize', 20)
    })

    it('-A from the stored size dispatches the previous size', async () => {
      const { wrapper, dispatch } = mountAcc(20)
      await click(wrapper, 'accessibility.decrease_font')
      expect(dispatch).toHaveBeenCalledWith('setFontSize', 18)
    })

    it('respects the 16–24 limits', async () => {
      const top = mountAcc(24)
      await click(top.wrapper, 'accessibility.increase_font')
      expect(top.dispatch).not.toHaveBeenCalledWith('setFontSize', expect.anything())
      const bottom = mountAcc(16)
      await click(bottom.wrapper, 'accessibility.decrease_font')
      expect(bottom.dispatch).not.toHaveBeenCalledWith('setFontSize', expect.anything())
    })
  })
})
