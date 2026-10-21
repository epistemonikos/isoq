jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: { result: 'success' } }))
  }
}))

jest.mock('@/services/personalDataExport', () => ({
  downloadPersonalData: jest.fn(() => Promise.resolve())
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
      'b-form-checkbox', 'b-checkbox', 'b-container', 'b-row', 'b-col', 'b-card',
      'b-form-textarea', 'b-form-select', 'b-table-simple', 'b-tbody', 'b-tr', 'b-td',
      'router-link'],
    mocks: { $bvModal: { show: jest.fn(), hide: jest.fn() }, $router: { push: jest.fn() } }
  })
  return { wrapper, actions }
}

// Las secciones GDPR se identifican por su texto traducido: los b-card están
// stubeados, así que buscar por componente no distingue una tarjeta de otra.
const textoDe = (wrapper) => wrapper.text()

describe('viewProfile.vue — con ENABLE_GDPR apagado', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: { result: 'success' } })
    process.env.ENABLE_GDPR = 'off'
  })

  afterEach(() => {
    process.env.ENABLE_GDPR = 'on'
  })

  it('no muestra la sección de gestión de datos', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.manageData.title)
  })

  it('no muestra el botón de exportar datos', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.export.button)
  })

  it('no muestra el botón de borrar la cuenta', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.deleteAccount.button)
  })

  it('no muestra la sección de contacto sobre datos personales', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.contact.sectionTitle)
  })

  it('no muestra las casillas de consentimiento', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.preferences.newsletter)
    expect(textoDe(wrapper)).not.toContain(en.gdpr.preferences.improvement)
  })

  it('no muestra la introducción GDPR de la pantalla', () => {
    const { wrapper } = build()
    expect(textoDe(wrapper)).not.toContain(en.gdpr.profile.intro)
  })

  it('sigue mostrando el resto del perfil', () => {
    // El flag no debe llevarse por delante la pantalla entera: la contraseña,
    // el idioma y el tema no son GDPR.
    const { wrapper } = build()
    expect(textoDe(wrapper)).toContain(en.profile.username)
  })

  // ─── La trampa de savePreferences ────────────────────────────────────────────
  //
  // Las casillas ocultas conservan su v-model. Si update() mandara el POST
  // igual, guardar una contraseña nueva reescribiría newsletter e improvement
  // con lo que hubiera en data — revocando un consentimiento que el usuario ni
  // vio. No se rompe porque initCheckboxes() copia los valores del store a
  // initialNewsletter/initialImprovement y preferencesChanged queda en false,
  // pero esa cadena es indirecta y se puede romper sin darse cuenta.

  it('no manda las preferencias al guardar la contraseña', async () => {
    const { wrapper } = build({ newsletter: true, improvement: true })
    wrapper.setData({ new_password: 'unaClaveLarga1', new_password_repeat: 'unaClaveLarga1' })
    await wrapper.vm.$nextTick()

    await wrapper.vm.update()
    await flushPromises()

    const llamadas = Api.post.mock.calls.map(c => c[0])
    expect(llamadas).toContain('/users/change_password')
    expect(llamadas).not.toContain('/users/update_info')
  })

  it('no manda nada si no hay contraseña nueva', async () => {
    const { wrapper } = build({ newsletter: true })
    await wrapper.vm.update()
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('sigue leyendo las preferencias del store en data', () => {
    // El estado no se falsea: se oculta la UI, no se reescribe el modelo. Si
    // el flag se vuelve a encender, las casillas muestran lo que el usuario
    // había elegido y no un false inventado por el frontend.
    const { wrapper } = build({ newsletter: true, improvement: 'True' })
    expect(wrapper.vm.newsletter).toBe(true)
    expect(wrapper.vm.improvement).toBe(true)
  })
})

describe('viewProfile.vue — con ENABLE_GDPR encendido', () => {
  // Control positivo de los negativos de arriba: sin esto, un cambio en las
  // claves de i18n haría pasar todos los not.toContain por la razón equivocada.
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.ENABLE_GDPR = 'on'
  })

  it('muestra las cuatro secciones GDPR', () => {
    const { wrapper } = build()
    const texto = textoDe(wrapper)

    expect(texto).toContain(en.gdpr.profile.intro)
    expect(texto).toContain(en.gdpr.preferences.newsletter)
    expect(texto).toContain(en.gdpr.manageData.title)
    expect(texto).toContain(en.gdpr.contact.sectionTitle)
  })
})
