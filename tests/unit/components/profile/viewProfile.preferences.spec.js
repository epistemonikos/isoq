jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: { result: 'success' } }))
  }
}))

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import viewProfile from '@/components/profile/viewProfile'
import en from '@/lang/en.json'

const Api = require('@/utils/Api').default
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueI18n)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

function build (user = {}) {
  const actions = { updateUser: jest.fn(), setTheme: jest.fn(), logout: jest.fn() }
  const store = new Vuex.Store({
    state: {
      user: { id: 'u1', first_name: 'Ana', last_name: 'Soto', name: 'ana', ...user },
      theme: 'light'
    },
    actions
  })
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  const wrapper = shallowMount(viewProfile, {
    localVue,
    store,
    i18n,
    stubs: ['b-modal', 'b-button', 'b-form-input', 'b-form-group', 'b-spinner', 'b-alert',
      'b-form-checkbox', 'b-container', 'b-row', 'b-col', 'b-card', 'b-form-textarea',
      'b-form-select', 'b-table-simple', 'b-tbody', 'b-tr', 'b-td'],
    mocks: { $bvModal: { show: jest.fn(), hide: jest.fn() }, $router: { push: jest.fn() } }
  })
  return { wrapper, actions }
}

describe('viewProfile.vue — preferencias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: { result: 'success' } })
  })

  // ─── Normalización de los booleanos del backend ──────────────────────────────
  //
  // El backend acepta y devuelve estos campos con tipos mezclados. Su propia
  // normalización usa exactamente esta lista
  // (isoq_server_py310, auth_server/controllers/core.py:470).

  it.each([true, 'true', 'True', 1, '1'])('normaliza %p a true', (value) => {
    const { wrapper } = build({ newsletter: value })
    expect(wrapper.vm.newsletter).toBe(true)
  })

  it.each([false, 'false', 0, '0', null, undefined])('normaliza %p a false', (value) => {
    const { wrapper } = build({ newsletter: value })
    expect(wrapper.vm.newsletter).toBe(false)
  })

  it("no toma el string 'false' como verdadero", () => {
    // Con un simple Boolean(valor) esto pasaría como true: 'false' es truthy.
    const { wrapper } = build({ improvement: 'false' })
    expect(wrapper.vm.improvement).toBe(false)
  })

  it('normaliza las dos preferencias por separado', () => {
    const { wrapper } = build({ newsletter: 'True', improvement: 0 })
    expect(wrapper.vm.newsletter).toBe(true)
    expect(wrapper.vm.improvement).toBe(false)
  })

  // ─── Guardado ────────────────────────────────────────────────────────────────

  it('no envía nada si no cambió ninguna preferencia', async () => {
    const { wrapper } = build({ newsletter: true, improvement: false })
    await wrapper.vm.savePreferences()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('envía ambas preferencias cuando una cambia', async () => {
    // Van las dos siempre: el backend setea ambos campos en cada llamada
    // (core.py:470-471), así que omitir una la pondría en false.
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.savePreferences()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith('/users/update_info', {
      user_id: 'u1',
      newsletter: true,
      improvement: false
    })
  })

  it('actualiza el store vía acción, no mutando el state', async () => {
    // El original hacía this.$store.state.user.newsletter = ... — mutación
    // directa del state, prohibida por las convenciones del proyecto.
    const { wrapper, actions } = build({ newsletter: false, improvement: false })
    wrapper.setData({ improvement: true })
    await wrapper.vm.savePreferences()
    await flushPromises()

    expect(actions.updateUser.mock.calls[0][1]).toEqual({ newsletter: false, improvement: true })
  })

  it('deja de considerar cambios tras guardar con éxito', async () => {
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.savePreferences()
    await flushPromises()

    Api.post.mockClear()
    await wrapper.vm.savePreferences()
    expect(Api.post).not.toHaveBeenCalled()
  })

  it('sigue considerando pendiente el cambio si el guardado falla', async () => {
    // Si se marca como guardado ante un error, el usuario pierde el cambio
    // sin enterarse: el segundo intento no manda nada.
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.savePreferences()
    await flushPromises()

    Api.post.mockResolvedValue({ data: { result: 'success' } })
    await wrapper.vm.savePreferences()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledTimes(2)
  })

  it('avisa del error sin tocar el store', async () => {
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const { wrapper, actions } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.savePreferences()
    await flushPromises()

    expect(wrapper.vm.msgVariant).toBe('danger')
    expect(actions.updateUser).not.toHaveBeenCalled()
    expect(wrapper.vm.isSavingPreferences).toBe(false)
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('tiene traducidas las claves de preferencias', () => {
    const { wrapper } = build()
    const keys = ['sectionTitle', 'newsletter', 'improvement', 'save', 'success', 'error']

    keys.forEach(key => {
      const full = `gdpr.preferences.${key}`
      expect(wrapper.vm.$t(full)).not.toBe(full)
    })
  })
})
