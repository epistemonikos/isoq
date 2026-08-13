// El factory de jest.mock no puede referenciar Blob (variable fuera de
// scope); el valor de retorno se define en el beforeEach.
jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn()
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

// Error tal como llega de verdad: con responseType 'blob', axios parsea
// TAMBIÉN las respuestas de error como Blob, así que el JSON del backend
// viene envuelto y no se puede leer con error.response.data.message.
// El backend responde {result, message} con 400/403/404
// (isoq_server_py310, auth_server/controllers/core.py:489-498).
function blobError (payload, status = 403) {
  return {
    response: {
      status,
      data: new Blob([JSON.stringify(payload)], { type: 'application/json' })
    }
  }
}

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

describe('viewProfile.vue — exportar mis datos', () => {
  // tests/unit/setup.js:36-42 ya las define como jest.fn() no configurables,
  // así que no se pueden redefinir: se reutilizan.
  const createObjectURL = window.URL.createObjectURL
  const revokeObjectURL = window.URL.revokeObjectURL

  beforeEach(() => {
    jest.clearAllMocks()
    Api.post.mockResolvedValue({ data: new Blob(['zip']) })
    createObjectURL.mockReturnValue('blob:fake')
  })

  // ─── Camino feliz ────────────────────────────────────────────────────────────

  it('exige la contraseña antes de llamar a la API', async () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: '' })
    await wrapper.vm.confirmExportData()

    expect(Api.post).not.toHaveBeenCalled()
    expect(wrapper.vm.exportError).toBeTruthy()
  })

  it('pide el zip con user_id y contraseña', async () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith(
      '/users/get_full_data',
      { user_id: 'u1', password: 'secreta' },
      { responseType: 'blob' }
    )
  })

  it('dispara la descarga del archivo', async () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(createObjectURL).toHaveBeenCalled()
    // Sin revoke, el blob queda retenido en memoria mientras viva la pestaña.
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })

  it('cierra el modal cuando la descarga tuvo éxito', async () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalledWith('modal-export-data')
    expect(wrapper.vm.isExporting).toBe(false)
  })

  it('no deja rastro del enlace de descarga en el DOM', async () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(document.querySelectorAll('a[download]')).toHaveLength(0)
  })

  // ─── Errores ─────────────────────────────────────────────────────────────────

  it('muestra el mensaje del backend cuando la contraseña es incorrecta', async () => {
    Api.post.mockRejectedValueOnce(blobError({ result: 'invalid_password', message: 'Incorrect password' }, 403))
    const wrapper = build()
    wrapper.setData({ exportPassword: 'mala' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(wrapper.vm.exportError).toBe('Incorrect password')
    expect(wrapper.vm.isExporting).toBe(false)
  })

  it('no cierra el modal cuando falla', async () => {
    // Cerrarlo perdería el mensaje de error y el usuario no sabría qué pasó.
    Api.post.mockRejectedValueOnce(blobError({ message: 'Incorrect password' }, 403))
    const wrapper = build()
    wrapper.setData({ exportPassword: 'mala' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(wrapper.vm.$bvModal.hide).not.toHaveBeenCalled()
  })

  it('cae al mensaje genérico si el cuerpo del error no es JSON', async () => {
    // Un 502 de nginx devuelve HTML, no JSON. No debe explotar.
    Api.post.mockRejectedValueOnce({
      response: { status: 502, data: new Blob(['<html>Bad Gateway</html>'], { type: 'text/html' }) }
    })
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(wrapper.vm.exportError).toBe(en.gdpr.export.genericError)
    expect(wrapper.vm.isExporting).toBe(false)
  })

  it('cae al mensaje genérico si no hay respuesta (offline)', async () => {
    Api.post.mockRejectedValueOnce(new Error('Network Error'))
    const wrapper = build()
    wrapper.setData({ exportPassword: 'secreta' })
    await wrapper.vm.confirmExportData()
    await flushPromises()

    expect(wrapper.vm.exportError).toBe(en.gdpr.export.genericError)
    expect(wrapper.vm.isExporting).toBe(false)
  })

  // ─── Estado del modal ────────────────────────────────────────────────────────

  it('resetExportModal limpia contraseña y error', () => {
    const wrapper = build()
    wrapper.setData({ exportPassword: 'x', exportError: 'y' })
    wrapper.vm.resetExportModal()

    expect(wrapper.vm.exportPassword).toBe('')
    expect(wrapper.vm.exportError).toBe('')
  })

  it('exportData abre el modal', () => {
    const wrapper = build()
    wrapper.vm.exportData()

    expect(wrapper.vm.$bvModal.show).toHaveBeenCalledWith('modal-export-data')
  })
})
