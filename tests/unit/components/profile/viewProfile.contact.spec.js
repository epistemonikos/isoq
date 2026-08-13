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

const ASUNTO_VALIDO = 'asunto suficientemente largo'
const MENSAJE_VALIDO = 'una dos tres cuatro cinco'

function build () {
  const store = new Vuex.Store({
    state: {
      user: { id: 'u1', first_name: 'Ana', last_name: 'Soto', name: 'ana' },
      theme: 'light'
    },
    actions: { updateUser: jest.fn(), setTheme: jest.fn() }
  })
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  return shallowMount(viewProfile, {
    localVue,
    store,
    i18n,
    stubs: ['b-modal', 'b-button', 'b-form-input', 'b-form-group', 'b-spinner', 'b-alert',
      'b-form-checkbox', 'b-container', 'b-row', 'b-col', 'b-card', 'b-form-textarea',
      'b-form-select', 'b-table-simple', 'b-tbody', 'b-tr', 'b-td'],
    mocks: { $bvModal: { show: jest.fn(), hide: jest.fn() } }
  })
}

describe('viewProfile.vue — contacto de privacidad', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: { result: 'success' } })
  })

  // ─── Validación del asunto ───────────────────────────────────────────────────

  it('el asunto vacío queda en estado neutro', () => {
    // null es el estado neutro de Bootstrap-Vue: ni verde ni rojo. Un campo
    // que nadie tocó no debe mostrarse como error.
    const wrapper = build()
    wrapper.setData({ subject: '' })
    expect(wrapper.vm.subjectState).toBeNull()
  })

  it('rechaza un asunto de menos de 10 caracteres', () => {
    const wrapper = build()
    wrapper.setData({ subject: 'corto' })
    expect(wrapper.vm.subjectState).toBe(false)
  })

  it('acepta un asunto de 10 caracteres o más', () => {
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO })
    expect(wrapper.vm.subjectState).toBe(true)
  })

  it('no cuenta los espacios de relleno como caracteres del asunto', () => {
    const wrapper = build()
    wrapper.setData({ subject: '            ' })
    expect(wrapper.vm.subjectState).toBe(false)
  })

  // ─── Validación del mensaje ──────────────────────────────────────────────────

  it('el mensaje vacío queda en estado neutro', () => {
    const wrapper = build()
    wrapper.setData({ message: '' })
    expect(wrapper.vm.messageState).toBeNull()
  })

  it('rechaza un mensaje de menos de 5 palabras', () => {
    const wrapper = build()
    wrapper.setData({ message: 'una dos tres cuatro' })
    expect(wrapper.vm.messageState).toBe(false)
  })

  it('acepta un mensaje de 5 palabras o más', () => {
    const wrapper = build()
    wrapper.setData({ message: MENSAJE_VALIDO })
    expect(wrapper.vm.messageState).toBe(true)
  })

  it('no cuenta los espacios de más como palabras', () => {
    // Con split(/\s+/) sin trim previo, los espacios del principio generan
    // un elemento vacío y cuatro palabras pasarían por cinco.
    const wrapper = build()
    wrapper.setData({ message: '   una  dos   tres    cuatro   ' })
    expect(wrapper.vm.messageState).toBe(false)
  })

  it('cuenta las palabras separadas por saltos de línea', () => {
    const wrapper = build()
    wrapper.setData({ message: 'una\ndos\ntres\ncuatro\ncinco' })
    expect(wrapper.vm.messageState).toBe(true)
  })

  // ─── Envío ───────────────────────────────────────────────────────────────────

  it('no envía si el formulario es inválido', async () => {
    const wrapper = build()
    wrapper.setData({ subject: 'corto', message: 'poco' })
    await wrapper.vm.sendContact()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('envía asunto y mensaje al endpoint de privacidad', async () => {
    // El backend saca el usuario del token (core.py:737), así que no se
    // manda user_id.
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO, message: MENSAJE_VALIDO })
    await wrapper.vm.sendContact()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith('/users/privacy_contact', {
      subject: ASUNTO_VALIDO,
      message: MENSAJE_VALIDO
    })
  })

  it('limpia el formulario tras enviar', async () => {
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO, message: MENSAJE_VALIDO })
    await wrapper.vm.sendContact()
    await flushPromises()

    expect(wrapper.vm.subject).toBe('')
    expect(wrapper.vm.message).toBe('')
    expect(wrapper.vm.contactMsgVariant).toBe('success')
  })

  it('no manda el mismo mensaje dos veces con doble clic', async () => {
    // El endpoint despacha un correo real: un doble envío llega como dos
    // correos al buzón de privacidad.
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO, message: MENSAJE_VALIDO })

    await Promise.all([wrapper.vm.sendContact(), wrapper.vm.sendContact()])
    await flushPromises()

    expect(Api.post).toHaveBeenCalledTimes(1)
  })

  it('marca variante danger si el envío falla', async () => {
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO, message: MENSAJE_VALIDO })
    await wrapper.vm.sendContact()
    await flushPromises()

    expect(wrapper.vm.contactMsgVariant).toBe('danger')
    expect(wrapper.vm.isSendingContact).toBe(false)
  })

  it('conserva lo escrito si el envío falla', async () => {
    // Limpiar el formulario ante un error obliga al usuario a reescribir
    // todo el mensaje.
    Api.post.mockRejectedValueOnce(new Error('boom'))
    const wrapper = build()
    wrapper.setData({ subject: ASUNTO_VALIDO, message: MENSAJE_VALIDO })
    await wrapper.vm.sendContact()
    await flushPromises()

    expect(wrapper.vm.subject).toBe(ASUNTO_VALIDO)
    expect(wrapper.vm.message).toBe(MENSAJE_VALIDO)
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('tiene traducidas las claves del formulario', () => {
    const wrapper = build()
    const keys = ['sectionTitle', 'description', 'subjectLabel', 'subjectFeedback',
      'messageLabel', 'messageFeedback', 'send', 'success', 'error']

    keys.forEach(key => {
      const full = `gdpr.contact.${key}`
      expect(wrapper.vm.$t(full)).not.toBe(full)
    })
  })
})
