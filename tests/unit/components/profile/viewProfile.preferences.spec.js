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

const CLAVE_VALIDA = 'unaClaveLarga1'

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
      'b-form-checkbox', 'b-checkbox', 'b-container', 'b-row', 'b-col', 'b-card',
      'b-form-textarea', 'b-form-select', 'b-table-simple', 'b-tbody', 'b-tr', 'b-td',
      'router-link'],
    mocks: { $bvModal: { show: jest.fn(), hide: jest.fn() }, $router: { push: jest.fn() } }
  })
  return { wrapper, actions }
}

const llamadasA = (path) => Api.post.mock.calls.filter(c => c[0] === path)

describe('viewProfile.vue — perfil y preferencias', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: { result: 'success' } })
  })

  // ─── Normalización de los booleanos del backend ──────────────────────────────

  it.each([true, 'true', 'True', 1, '1'])('normaliza %p a true', (value) => {
    const { wrapper } = build({ newsletter: value })
    expect(wrapper.vm.newsletter).toBe(true)
  })

  it.each([false, 'false', 0, '0', null, undefined])('normaliza %p a false', (value) => {
    const { wrapper } = build({ newsletter: value })
    expect(wrapper.vm.newsletter).toBe(false)
  })

  it('normaliza las dos preferencias por separado', () => {
    const { wrapper } = build({ newsletter: 'True', improvement: 0 })
    expect(wrapper.vm.newsletter).toBe(true)
    expect(wrapper.vm.improvement).toBe(false)
  })

  // ─── El botón Save es uno solo ───────────────────────────────────────────────
  //
  // El modelo tiene un único Save bajo las casillas: guarda contraseña y
  // preferencias juntas. Sin esto, cambiar sólo una casilla dejaría el botón
  // deshabilitado y la preferencia no se podría guardar.

  it('habilita el botón al cambiar una preferencia, sin tocar la contraseña', async () => {
    const { wrapper } = build({ newsletter: false })
    expect(wrapper.vm.isDisabled).toBe(true)

    wrapper.setData({ newsletter: true })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(false)
  })

  it('vuelve a deshabilitar el botón si la preferencia regresa a su valor original', async () => {
    const { wrapper } = build({ newsletter: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.$nextTick()
    wrapper.setData({ newsletter: false })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  it('habilita el botón con una contraseña válida repetida', async () => {
    const { wrapper } = build()
    wrapper.setData({ new_password: CLAVE_VALIDA, new_password_repeat: CLAVE_VALIDA })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(false)
  })

  it('no habilita el botón si las contraseñas no coinciden', async () => {
    const { wrapper } = build()
    wrapper.setData({ new_password: CLAVE_VALIDA, new_password_repeat: 'otraCosa123' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isDisabled).toBe(true)
  })

  // ─── Guardado unificado ──────────────────────────────────────────────────────

  it('no llama a ningún endpoint si no cambió nada', async () => {
    const { wrapper } = build({ newsletter: true, improvement: false })
    await wrapper.vm.update()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('guarda sólo las preferencias cuando la contraseña está vacía', async () => {
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.update()
    await flushPromises()

    expect(llamadasA('/users/update_info')).toHaveLength(1)
    expect(llamadasA('/users/change_password')).toHaveLength(0)
    expect(llamadasA('/users/update_info')[0][1]).toEqual({
      user_id: 'u1',
      newsletter: true,
      improvement: false
    })
  })

  it('guarda sólo la contraseña cuando las preferencias no cambiaron', async () => {
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ new_password: CLAVE_VALIDA, new_password_repeat: CLAVE_VALIDA })
    await wrapper.vm.update()
    await flushPromises()

    expect(llamadasA('/users/change_password')).toHaveLength(1)
    expect(llamadasA('/users/update_info')).toHaveLength(0)
  })

  it('guarda las dos cosas a la vez cuando ambas cambiaron', async () => {
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({
      newsletter: true,
      new_password: CLAVE_VALIDA,
      new_password_repeat: CLAVE_VALIDA
    })
    await wrapper.vm.update()
    await flushPromises()

    expect(llamadasA('/users/change_password')).toHaveLength(1)
    expect(llamadasA('/users/update_info')).toHaveLength(1)
  })

  it('no manda la contraseña si es más corta que 8 caracteres', async () => {
    const { wrapper } = build()
    wrapper.setData({ new_password: 'corta', new_password_repeat: 'corta' })
    await wrapper.vm.update()
    await flushPromises()

    expect(llamadasA('/users/change_password')).toHaveLength(0)
  })

  it('actualiza el store vía acción, no mutando el state', async () => {
    const { wrapper, actions } = build({ newsletter: false, improvement: false })
    wrapper.setData({ improvement: true })
    await wrapper.vm.update()
    await flushPromises()

    expect(actions.updateUser.mock.calls[0][1]).toEqual({ newsletter: false, improvement: true })
  })

  it('limpia los campos de contraseña tras guardarla', async () => {
    const { wrapper } = build()
    wrapper.setData({ new_password: CLAVE_VALIDA, new_password_repeat: CLAVE_VALIDA })
    await wrapper.vm.update()
    await flushPromises()

    expect(wrapper.vm.new_password).toBeNull()
    expect(wrapper.vm.new_password_repeat).toBeNull()
  })

  it('avisa cuando el backend rechaza una contraseña comprometida', async () => {
    Api.post.mockResolvedValueOnce({ data: { status: 'password_compromised' } })
    const { wrapper } = build()
    wrapper.setData({ new_password: CLAVE_VALIDA, new_password_repeat: CLAVE_VALIDA })
    await wrapper.vm.update()
    await flushPromises()

    expect(wrapper.vm.msgVariant).toBe('danger')
  })

  it('deja de considerar cambios tras guardar con éxito', async () => {
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.update()
    await flushPromises()

    Api.post.mockClear()
    await wrapper.vm.update()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('sigue considerando pendiente el cambio si el guardado falla', async () => {
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const { wrapper } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.update()
    await flushPromises()

    Api.post.mockResolvedValue({ data: { result: 'success' } })
    await wrapper.vm.update()
    await flushPromises()

    expect(llamadasA('/users/update_info').length).toBeGreaterThan(0)
  })

  it('avisa del error sin tocar el store', async () => {
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const { wrapper, actions } = build({ newsletter: false, improvement: false })
    wrapper.setData({ newsletter: true })
    await wrapper.vm.update()
    await flushPromises()

    expect(wrapper.vm.msgVariant).toBe('danger')
    expect(actions.updateUser).not.toHaveBeenCalled()
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('tiene traducidas las claves de la pantalla', () => {
    const { wrapper } = build()
    const keys = [
      'gdpr.preferences.newsletter',
      'gdpr.preferences.improvement',
      'gdpr.profile.intro',
      'gdpr.manageData.title',
      'gdpr.export.label',
      'gdpr.export.button',
      'gdpr.export.noteIntro',
      'gdpr.export.note1',
      'gdpr.deleteAccount.label',
      'gdpr.deleteAccount.noteIntro',
      'gdpr.deleteAccount.note1',
      'gdpr.contact.sectionTitle',
      'gdpr.contact.dataNote'
    ]

    keys.forEach(key => {
      expect(wrapper.vm.$t(key)).not.toBe(key)
    })
  })
})
