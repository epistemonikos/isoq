import { shallowMount, createLocalVue } from '@vue/test-utils'
import PublishModal from '@/components/project/PublishModal.vue'
import Api from '@/utils/Api'
import Vue from 'vue'

// El modal ahora sostiene el lock de propiedades (propertiesLockMixin). Estos tests prueban el
// guardado, no el lock: arrancan con el lock tomado (ver PublishModal.lock.spec.js).
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(() => Promise.resolve({ success: true })), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: { status: true, message: '' } })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/api/publish' } })
const offline = () => Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } })

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(PublishModal, {
    localVue: createLocalVue(),
    mocks: {
      $store: { state: Vue.observable({ isOnline: true }), getters: {}, commit: jest.fn(), dispatch: jest.fn() },
      $t: (key) => key,
      $route: { params: { org_id: '1' }, query: {} },
      $router: { push: jest.fn() },
      $notify
    },
    propsData: {
      project: { id: '123', name: 'P', is_public: false, public_type: 'private', license_type: 'CC-BY-NC-ND' },
      ui: { publish: { showLoader: false } }
    },
    stubs: {
      videoHelp: true,
      'b-modal': { template: '<div><slot></slot><slot name="modal-title"></slot><slot name="modal-footer"></slot></div>' },
      'b-alert': true, 'b-form-group': true, 'b-form-radio-group': true,
      'b-form-invalid-feedback': true, 'b-button': true, 'b-spinner': true
    }
  })
  wrapper.vm.$refs['modal-change-status'] = { hide: jest.fn(), show: jest.fn() }
  wrapper.vm.propertiesLock = { status: 'held', lockedBy: null }
  return { wrapper, $notify }
}

const lastLoader = (wrapper) => {
  const calls = wrapper.emitted('uiPublishShowLoader') || []
  return calls.length ? calls[calls.length - 1][0] : undefined
}

// Antes, un fallo al publicar terminaba en `console.log` y el loader nunca se apagaba: el
// spinner giraba para siempre, sin decir nada. Lo que se afirma es que se apaga Y se avisa.
describe('PublishModal — si no se puede cambiar el estado, lo dice y suelta el spinner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: { status: true, message: '' } }))
  })

  it('pasar a privado falla', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ modalProject: { name: 'P', public_type: 'private' } })
    Api.patch.mockRejectedValueOnce(error500())
    await wrapper.vm.savePublicStatus({ preventDefault () {} })
    await flushPromises()
    expect(lastLoader(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.publish_error')
  })

  it('publicar falla en el PATCH', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ modalProject: { name: 'P', public_type: 'open_access', license_type: 'cc_by' } })
    Api.patch.mockRejectedValueOnce(error500())
    await wrapper.vm.savePublicStatus({ preventDefault () {} })
    await flushPromises()
    expect(lastLoader(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.publish_error')
  })

  it('publicar falla antes, al preguntar si se puede', async () => {
    // Ese GET no tenía catch: el método rechazaba y el spinner quedaba igual de colgado.
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ modalProject: { name: 'P', public_type: 'open_access', license_type: 'cc_by' } })
    Api.get.mockRejectedValueOnce(error500())
    await wrapper.vm.savePublicStatus({ preventDefault () {} })
    await flushPromises()
    expect(lastLoader(wrapper)).toBe(false)
    expect($notify.error).toHaveBeenCalledWith('notifications.publish_error')
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('sin conexión suelta el spinner sin sumar aviso: ya lo dio OfflineIndicator', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ modalProject: { name: 'P', public_type: 'private' } })
    Api.patch.mockRejectedValueOnce(offline())
    await wrapper.vm.savePublicStatus({ preventDefault () {} })
    await flushPromises()
    expect(lastLoader(wrapper)).toBe(false)
    expect($notify.error).not.toHaveBeenCalled()
  })

  it('si sale bien, cierra el modal y no avisa error', async () => {
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ modalProject: { name: 'P', public_type: 'private' } })
    await wrapper.vm.savePublicStatus({ preventDefault () {} })
    await flushPromises()
    expect(lastLoader(wrapper)).toBe(false)
    expect(wrapper.vm.$refs['modal-change-status'].hide).toHaveBeenCalled()
    expect($notify.error).not.toHaveBeenCalled()
  })
})
