import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import PublishModal from '@/components/project/PublishModal.vue'
import Api from '@/utils/Api'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(() => Promise.resolve({ success: true })), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))
jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { status: true, message: '' } })),
    patch: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const FIELD = 'no_personal_data_confirmed'

/**
 * Publicar exige marcar «no identifica a participantes ni incluye datos personales…».
 * El botón se deshabilita sin la casilla, y el guardado la manda al servidor, que la exige
 * por su cuenta (400 `personal_data_confirmation_required`).
 */
describe('PublishModal.vue — confirmación de datos personales', () => {
  let wrapper
  let $notify

  function mount (project = {}) {
    $notify = { error: jest.fn(), success: jest.fn() }
    wrapper = shallowMount(PublishModal, {
      localVue: createLocalVue(),
      mocks: {
        $store: { state: Vue.observable({ isOnline: true }) },
        $t: (key) => key,
        $notify,
        $route: { params: { org_id: '1' }, query: {} },
        $router: { push: jest.fn() }
      },
      propsData: {
        project: { id: '123', name: 'P', public_type: 'private', license_type: 'CC-BY', ...project },
        ui: { publish: { showLoader: false } }
      },
      stubs: {
        videoHelp: true,
        'b-alert': true,
        'b-form-group': true,
        'b-form-radio-group': true,
        'b-form-checkbox': true,
        'b-form-invalid-feedback': true,
        'b-button': true,
        'b-spinner': true,
        'b-modal': { template: '<div><slot></slot><slot name="modal-title"></slot><slot name="modal-footer"></slot></div>' }
      }
    })
    wrapper.vm.propertiesLock = { status: 'held', lockedBy: null }
    wrapper.vm.$refs['modal-change-status'] = { show: jest.fn(), hide: jest.fn() }
    wrapper.vm.loadModalProject(wrapper.vm.project)
    return wrapper.vm.$nextTick()
  }

  const saveButton = () => wrapper.find('b-button-stub[variant="outline-success"]')
  const save = () => wrapper.vm.savePublicStatus({ preventDefault: jest.fn() })

  beforeEach(() => jest.clearAllMocks())
  afterEach(() => wrapper.destroy())

  it('la casilla aparece al elegir un nivel público', async () => {
    await mount()
    expect(wrapper.find('#modal-publish-personal-data').exists()).toBe(false)
    wrapper.vm.modalProject.public_type = 'fully'
    await wrapper.vm.$nextTick()
    expect(wrapper.find('#modal-publish-personal-data').exists()).toBe(true)
  })

  it('público sin la casilla: el botón no se puede pulsar', async () => {
    await mount()
    wrapper.vm.modalProject.public_type = 'fully'
    await wrapper.vm.$nextTick()
    expect(saveButton().attributes('disabled')).toBe('true')
  })

  it('público con la casilla: el botón se habilita', async () => {
    await mount()
    wrapper.vm.modalProject.public_type = 'fully'
    wrapper.vm.$set(wrapper.vm.modalProject, FIELD, true)
    await wrapper.vm.$nextTick()
    expect(saveButton().attributes('disabled')).toBeFalsy()
  })

  it('privado no la necesita', async () => {
    await mount()
    expect(saveButton().attributes('disabled')).toBeFalsy()
  })

  it('un proyecto ya confirmado la trae marcada', async () => {
    await mount({ public_type: 'fully', [FIELD]: true })
    expect(wrapper.vm.modalProject[FIELD]).toBe(true)
    expect(saveButton().attributes('disabled')).toBeFalsy()
  })

  it('el `@ok` del modal tampoco publica sin la casilla', async () => {
    await mount()
    wrapper.vm.modalProject.public_type = 'fully'
    await save()
    await flushPromises()
    expect(Api.get).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('con la casilla la manda a can_publish y a /api/publish', async () => {
    await mount()
    wrapper.vm.modalProject.public_type = 'fully'
    wrapper.vm.$set(wrapper.vm.modalProject, FIELD, true)
    await save()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/api/project/can_publish', expect.objectContaining({ [FIELD]: true }))
    expect(Api.patch).toHaveBeenCalledWith('/api/publish', { params: expect.objectContaining({ [FIELD]: true, public_type: 'fully' }) })
  })

  it('el rechazo del servidor se explica con el texto de la casilla', async () => {
    await mount()
    wrapper.vm.modalProject.public_type = 'fully'
    wrapper.vm.$set(wrapper.vm.modalProject, FIELD, true)
    Api.patch.mockRejectedValueOnce({ response: { status: 400, data: { reason: 'personal_data_confirmation_required' } } })
    await save()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('publish.confirm_no_personal_data_required')
  })
})
