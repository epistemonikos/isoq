import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vue from 'vue'
import PublishModal from '@/components/project/PublishModal.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))
jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { status: true, message: '' } })),
    patch: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const KEY = 'project_properties'

function mountModal () {
  const w = shallowMount(PublishModal, {
    localVue: createLocalVue(),
    mocks: {
      $store: { state: Vue.observable({ isOnline: true, user: { id: 'u-me' } }) },
      $t: (key, params) => (params && params.user ? `${key}:${params.user}` : key),
      $route: { params: { org_id: '1' }, query: {} },
      $router: { push: jest.fn() },
      $notify: { error: jest.fn() }
    },
    propsData: {
      project: { id: '123', public_type: 'private', license_type: 'CC-BY-NC-ND' },
      ui: { publish: { showLoader: false } }
    },
    stubs: {
      videoHelp: true,
      'b-modal': { template: '<div><slot></slot><slot name="modal-title"></slot><slot name="modal-footer"></slot></div>' },
      'b-alert': true,
      'b-form-group': true,
      'b-form-radio-group': true,
      'b-form-invalid-feedback': true,
      'b-button': { template: '<button :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>', props: ['disabled'] },
      'b-spinner': true,
      PropertiesLockAlert: true
    }
  })
  w.vm.$refs['modal-change-status'].show = jest.fn()
  w.vm.$refs['modal-change-status'].hide = jest.fn()
  return w
}

beforeEach(() => { jest.clearAllMocks() })

describe('PublishModal — lock de propiedades', () => {
  it('abrir pide el lock de propiedades', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountModal()
    w.vm.openModal()
    await flushPromises()
    expect(LockService.acquireRef).toHaveBeenCalledWith('123', KEY)
    w.destroy()
  })

  it('denegado: cartel con el nombre, sin formulario, Guardar deshabilitado', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const w = mountModal()
    w.vm.openModal()
    await flushPromises()
    expect(w.find('propertieslockalert-stub').attributes('lockedby')).toBe('Ana')
    expect(w.find('b-form-radio-group-stub').exists()).toBe(false)
    const save = w.findAll('button').filter(b => b.text().includes('actionButtons.modal.save')).at(0)
    expect(save.attributes('disabled')).toBe('disabled')
    w.destroy()
  })

  it('sin el lock, savePublicStatus no llama a can_publish ni a publish', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const w = mountModal()
    w.vm.openModal()
    await flushPromises()
    w.vm.modalProject.public_type = 'fully'
    await w.vm.savePublicStatus({ preventDefault: jest.fn() })
    expect(Api.get).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
    w.destroy()
  })

  it('cerrar el modal suelta el lock', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountModal()
    w.vm.openModal()
    await flushPromises()
    w.vm.onHidden()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    w.destroy()
  })

  it('refrescar recarga el formulario con el proyecto nuevo y avisa al padre', async () => {
    Api.get.mockResolvedValueOnce({ data: { id: '123', public_type: 'fully', license_type: 'CC-BY' } })
    const w = mountModal()
    await w.vm.refreshBeforePropertiesLock()
    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/123', { organization: '1' }, { networkOnly: true })
    expect(w.vm.modalProject.public_type).toBe('fully')
    expect(w.vm.modalProject.license_type).toBe('CC-BY')
    expect(w.emitted('getProject')).toBeTruthy()
    w.destroy()
  })
})
