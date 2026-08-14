jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: { status: 'success' } }))
  }
}))

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import Login from '@/components/Login'
import en from '@/lang/en.json'
import { TERMS_VERSION } from '@/constants/terms'

const Api = require('@/utils/Api').default
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueI18n)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

// Usuario al día con los términos, tal como queda en el store después de
// auth_success.
const ACCEPTED = { id: 'u1', status: 'active', personal_organization: 'org1', terms_accepted: true, terms_version: TERMS_VERSION }
// Usuario que nunca aceptó: forma exacta que devuelve el backend
// (auth_server/models.py:38-39 setea los dos campos con defaults).
const NOT_ACCEPTED = { id: 'u1', status: 'active', personal_organization: 'org1', terms_accepted: false, terms_version: 0 }

function build ({ user = NOT_ACCEPTED, query = {}, loginResponse } = {}) {
  const actions = {
    updateUser: jest.fn(),
    logout: jest.fn(() => Promise.resolve()),
    changeStatus: jest.fn(),
    login: jest.fn(() => Promise.resolve(
      loginResponse || { data: { personal_organization: 'org1' } }
    ))
  }
  const store = new Vuex.Store({
    state: { user, status: '' },
    getters: { isLoggedIn: () => true },
    actions
  })
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  const wrapper = shallowMount(Login, {
    localVue,
    store,
    i18n,
    stubs: ['b-modal', 'b-form-checkbox', 'b-button', 'b-form-input', 'b-form-group',
      'router-link', 'b-alert', 'b-spinner', 'b-card-text', 'b-card', 'b-form',
      'b-container', 'b-row', 'b-col'],
    mocks: {
      $route: { query, hash: '' },
      $router: { push: jest.fn(() => Promise.resolve()) },
      $bvModal: { show: jest.fn(), hide: jest.fn() }
    }
  })
  return { wrapper, actions }
}

describe('Login.vue — aceptación de términos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.patch.mockResolvedValue({ data: { status: 'success' } })
  })

  // ─── Quién abre el modal ─────────────────────────────────────────────────────
  //
  // Sin este disparador el modal nunca se ve: el usuario entra, el guard de
  // main.js lo desloguea y vuelve a Login sin explicación. Un bucle del que
  // no puede salir.

  describe('disparador tras el login', () => {
    it('abre el modal en vez de navegar cuando el usuario no aceptó', async () => {
      const { wrapper } = build({ user: NOT_ACCEPTED })
      wrapper.vm.login()
      await flushPromises()

      expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('modal-terms-acceptance')
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled()
    })

    it('navega sin modal cuando el usuario ya aceptó la versión vigente', async () => {
      const { wrapper } = build({ user: ACCEPTED })
      wrapper.vm.login()
      await flushPromises()

      expect(wrapper.vm.$bvModal.show).not.toHaveBeenCalled()
      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ path: '/workspace/org1' })
    })

    it('abre el modal cuando el usuario aceptó una versión anterior', async () => {
      const { wrapper } = build({ user: { ...ACCEPTED, terms_version: TERMS_VERSION - 1 } })
      wrapper.vm.login()
      await flushPromises()

      expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('modal-terms-acceptance')
    })

    it('recuerda el destino del guard para usarlo después de aceptar', async () => {
      // El guard dejó ?redirect=/workspace/org1/isoqf/42 al desviar.
      const { wrapper } = build({ user: NOT_ACCEPTED, query: { redirect: '/workspace/org1/isoqf/42' } })
      wrapper.vm.login()
      await flushPromises()

      expect(wrapper.vm.pendingRedirect).toBe('/workspace/org1/isoqf/42')
    })

    it('cae al workspace personal cuando no hay redirect del guard', async () => {
      const { wrapper } = build({ user: NOT_ACCEPTED })
      wrapper.vm.login()
      await flushPromises()

      expect(wrapper.vm.pendingRedirect).toBe('/workspace/org1')
    })
  })

  // ─── Aceptar ─────────────────────────────────────────────────────────────────

  describe('acceptTerms', () => {
    it('no permite aceptar sin marcar la casilla', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: false })
      await wrapper.vm.acceptTerms()

      expect(Api.patch).not.toHaveBeenCalled()
    })

    it('manda la versión vigente al aceptar', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true, newsletterAccepted: false })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(Api.patch).toHaveBeenCalledWith('/users/update_my_profile', {
        terms_accepted: true,
        terms_version: TERMS_VERSION,
        newsletter: false
      })
    })

    it('propaga el newsletter opcional', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true, newsletterAccepted: true })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(Api.patch.mock.calls[0][1].newsletter).toBe(true)
    })

    it('actualiza el store tras aceptar', async () => {
      const { wrapper, actions } = build()
      wrapper.setData({ termsAccepted: true, newsletterAccepted: false })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(actions.updateUser.mock.calls[0][1]).toEqual({
        terms_accepted: true,
        terms_version: TERMS_VERSION,
        newsletter: false
      })
    })

    it('propaga al store el newsletter aceptado en el modal', async () => {
      // Si el store no se entera, el perfil muestra la casilla desmarcada en
      // la misma sesión y, al guardar cualquier otra preferencia, manda
      // newsletter: false y revoca el consentimiento recién dado.
      const { wrapper, actions } = build()
      wrapper.setData({ termsAccepted: true, newsletterAccepted: true })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(actions.updateUser.mock.calls[0][1].newsletter).toBe(true)
    })

    it('navega al destino recordado después de aceptar', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true, pendingRedirect: '/workspace/org1/isoqf/42' })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ path: '/workspace/org1/isoqf/42' })
    })

    it('cierra el modal al aceptar', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-terms-acceptance')
    })

    it('muestra un error y no navega si el PATCH falla', async () => {
      Api.patch.mockRejectedValueOnce(new Error('boom'))
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(wrapper.vm.termsError).toBeTruthy()
      expect(wrapper.vm.$router.push).not.toHaveBeenCalled()
    })

    it('no deja el botón bloqueado si el PATCH falla', async () => {
      // Sin el finally, isAcceptingTerms queda en true y el botón muere
      // deshabilitado: el usuario no puede reintentar.
      Api.patch.mockRejectedValueOnce(new Error('boom'))
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true })
      await wrapper.vm.acceptTerms()
      await flushPromises()

      expect(wrapper.vm.isAcceptingTerms).toBe(false)
    })

    it('no manda el PATCH dos veces si el usuario hace doble clic', async () => {
      const { wrapper } = build()
      wrapper.setData({ termsAccepted: true })

      const first = wrapper.vm.acceptTerms()
      const second = wrapper.vm.acceptTerms()
      await Promise.all([first, second])
      await flushPromises()

      expect(Api.patch).toHaveBeenCalledTimes(1)
    })
  })

  // ─── Rechazar ────────────────────────────────────────────────────────────────

  describe('declineTerms', () => {
    it('cierra la sesión al rechazar', async () => {
      const { wrapper, actions } = build()
      await wrapper.vm.declineTerms()
      await flushPromises()

      expect(actions.logout).toHaveBeenCalled()
      expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-terms-acceptance')
    })
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('tiene traducidas las claves del modal', () => {
    const { wrapper } = build()
    const keys = ['modalTitle', 'intro', 'reviewHere', 'acceptLabel',
      'newsletterLabel', 'accept', 'cancel', 'error']

    keys.forEach(key => {
      const full = `gdpr.terms.${key}`
      expect(wrapper.vm.$t(full)).not.toBe(full)
    })
  })
})
