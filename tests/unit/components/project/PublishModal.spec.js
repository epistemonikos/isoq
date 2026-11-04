import { shallowMount, createLocalVue } from '@vue/test-utils'
import PublishModal from '@/components/project/PublishModal.vue'
import Vue from 'vue'

// Mock Api module before importing component
// El modal ahora sostiene el lock de propiedades (propertiesLockMixin). Estos tests prueban el
// guardado, no el lock: arrancan con el lock tomado (ver PublishModal.lock.spec.js).
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(() => Promise.resolve({ success: true })), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))
jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: { status: true, message: '' } })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

describe('PublishModal.vue', () => {
  let wrapper
  let localVue
  let mockStore

  const mockProject = {
    id: '123',
    name: 'Test Project',
    is_public: false,
    public_type: 'private',
    license_type: 'CC-BY-NC-ND'
  }
  const mockUi = {
    publish: {
      showLoader: false
    }
  }

  beforeEach(() => {
    localVue = createLocalVue()
    mockStore = {
      state: Vue.observable({
        isOnline: true
      }),
      getters: {},
      commit: jest.fn(),
      dispatch: jest.fn()
    }

    wrapper = shallowMount(PublishModal, {
      localVue,
      mocks: {
        $store: mockStore,
        $t: (key) => key,
        $route: { params: { org_id: '1' }, query: {} },
        $router: { push: jest.fn() }
      },
      propsData: {
        project: mockProject,
        ui: mockUi
      },
      stubs: {
        'videoHelp': true,
        'b-modal': {
          template: '<div><slot></slot><slot name="modal-title"></slot><slot name="modal-footer"></slot></div>'
        },
        'b-alert': true,
        'b-form-group': true,
        'b-form-radio-group': true,
        'b-form-invalid-feedback': true,
        'b-button': true,
        'b-spinner': true
      }
    })
    wrapper.vm.propertiesLock = { status: 'held', lockedBy: null }
    return wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.destroy()
  })

  describe('Modal Rendering', () => {
    it('should render modal component', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should have correct modal title', () => {
      expect(wrapper.exists()).toBe(true)
    })

    it('should display publication status options', () => {
      const radioGroup = wrapper.find('#modal-publish-status')
      expect(radioGroup.exists()).toBe(true)
    })
  })

  describe('Publication Status', () => {
    it('should have global_status computed property', () => {
      expect(wrapper.vm.global_status).toBeDefined()
      expect(Array.isArray(wrapper.vm.global_status)).toBe(true)
    })

    it('should have global_licenses computed property', () => {
      expect(wrapper.vm.global_licenses).toBeDefined()
      expect(Array.isArray(wrapper.vm.global_licenses)).toBe(true)
    })

    it('should show license options when public_type is not private', async () => {
      wrapper.vm.modalProject.public_type = 'public'
      await wrapper.vm.$nextTick()
      
      const licenseGroup = wrapper.find('#modal-publish-license')
      expect(licenseGroup.exists()).toBe(true)
    })

    it('should not show license options when public_type is private', async () => {
      wrapper.vm.modalProject.public_type = 'private'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.modalProject.public_type).toBe('private')
    })
  })

  describe('Modal Methods', () => {
    it('should have openModal method', () => {
      expect(typeof wrapper.vm.openModal).toBe('function')
    })

    it('should have savePublicStatus method', () => {
      expect(typeof wrapper.vm.savePublicStatus).toBe('function')
    })

    it('should initialize modalProject on openModal', () => {
      wrapper.vm.$refs = {
        'modal-change-status': {
          show: jest.fn(),
          hide: jest.fn()
        }
      }
      
      wrapper.vm.openModal()
      
      expect(wrapper.vm.modalProject).toBeDefined()
      expect(wrapper.vm.modalProject.name).toBe(mockProject.name)
      expect(wrapper.vm.$refs['modal-change-status'].show).toHaveBeenCalled()
    })

    it('should reset errorsResponse on openModal', () => {
      wrapper.vm.$refs = {
        'modal-change-status': {
          show: jest.fn(),
          hide: jest.fn()
        }
      }
      
      wrapper.vm.errorsResponse.message = 'Test error'
      wrapper.vm.openModal()
      
      expect(wrapper.vm.errorsResponse.message).toBe('')
    })
  })

  describe('Validation', () => {
    it('should validate license_type when publishing', async () => {
      wrapper.vm.modalProject.public_type = 'public'
      wrapper.vm.modalProject.license_type = null
      
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.state.license_type).toBe(null)
    })

    it('should not require license when private', () => {
      wrapper.vm.modalProject.public_type = 'private'
      wrapper.vm.modalProject.license_type = null
      
      expect(wrapper.vm.modalProject.public_type).toBe('private')
    })
  })

  describe('Events', () => {
    it('should emit getProject event on successful save', () => {
      expect(wrapper.emitted('getProject')).toBeFalsy()
    })

    it('should emit uiPublishShowLoader event', () => {
      wrapper.vm.$emit('uiPublishShowLoader', true)
      expect(wrapper.emitted('uiPublishShowLoader')).toBeTruthy()
      expect(wrapper.emitted('uiPublishShowLoader')[0]).toEqual([true])
    })
  })

  describe('Error Handling', () => {
    it('should display error message when present', async () => {
      wrapper.vm.errorsResponse.message = 'Test error message'
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.errorsResponse.message).toBe('Test error message')
    })

    it('should clear error message on dismissal', async () => {
      wrapper.vm.errorsResponse.message = 'Test error'
      await wrapper.vm.$nextTick()
      
      wrapper.vm.errorsResponse.message = ''
      await wrapper.vm.$nextTick()
      
      expect(wrapper.vm.errorsResponse.message).toBe('')
    })
  })

  describe('Offline Behavior', () => {
    it('should disable save button when offline', async () => {
      mockStore.state.isOnline = false
      await wrapper.vm.$nextTick()
      
      const saveButton = wrapper.find('b-button-stub[variant="outline-success"]')
      expect(saveButton.attributes('disabled')).toBe('true')
    })

    it('should enable save button when online', async () => {
      mockStore.state.isOnline = true
      // El modal cargado (openModal) con un nivel privado: público, el botón espera además la
      // casilla de datos personales (PublishModal.personalData.spec.js).
      wrapper.vm.loadModalProject(mockProject)
      await wrapper.vm.$nextTick()
      
      const saveButton = wrapper.find('b-button-stub[variant="outline-success"]')
      expect(saveButton.attributes('disabled')).toBeFalsy()
    })
  })
})

describe('PublishModal.vue — asking before publishing (#169)', () => {
  const Api = require('@/utils/Api').default
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))
  const COMPLETE_LIST = { id: 'l1', name: 'Finding', cerqual: { option: 1, explanation: 'Because' }, references: ['r1'] }
  const INCOMPLETE_LIST = { id: 'l2', name: 'Draft' }
  const PUBLIC = { name: 'P', public_type: 'fully', license_type: 'CC-BY', no_personal_data_confirmed: true }

  function build ({ confirm = true } = {}) {
    const msgBoxConfirm = jest.fn().mockResolvedValue(confirm)
    const push = jest.fn().mockResolvedValue()
    const w = require('@vue/test-utils').mount(PublishModal, {
      localVue: createLocalVue(),
      mocks: {
        $store: { state: Vue.observable({ isOnline: true }), getters: {}, commit: jest.fn(), dispatch: jest.fn() },
        $t: (key) => key,
        $route: { path: '/p', params: { org_id: '1' }, query: { foo: 'bar' } },
        $router: { push },
        $notify: { success: jest.fn(), error: jest.fn() },
        $bvModal: { msgBoxConfirm }
      },
      propsData: { project: { id: '123', name: 'P', public_type: 'private' }, ui: { publish: { showLoader: false } } },
      stubs: {
        videoHelp: true,
        PropertiesLockAlert: true,
        'b-modal': { template: '<div><slot></slot><slot name="modal-footer"></slot></div>' },
        'b-alert': { template: '<div class="alert"><slot></slot></div>' },
        'b-form-group': true, 'b-form-radio-group': true, 'b-form-checkbox': true,
        'b-form-invalid-feedback': true, 'b-spinner': true,
        'b-button': { template: '<button class="b" @click="$emit(\'click\')"><slot></slot></button>' }
      }
    })
    w.vm.$refs['modal-change-status'] = { hide: jest.fn(), show: jest.fn() }
    w.vm.propertiesLock = { status: 'held', lockedBy: null }
    return { w, msgBoxConfirm, push }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
    Api.post.mockImplementation(() => Promise.resolve({ data: { status: true, message: '', missing_fields: [] } }))
    Api.patch.mockImplementation(() => Promise.resolve({ data: {} }))
  })

  test('missing properties show a text message and a button to the Properties tab with the fields highlighted', async () => {
    Api.post.mockResolvedValue({ data: { status: false, missing_fields: ['author_email'], has_complete_finding: true } })
    const { w, push } = build()
    await w.setData({ modalProject: { ...PUBLIC } })
    await w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    await w.vm.$nextTick()
    expect(w.text()).toContain('project.notifications.publish_missing_fields')
    const button = w.findAll('button').wrappers.find(b => b.text().includes('publish.go_to_properties'))
    expect(button).toBeTruthy()
    await button.trigger('click')
    expect(push).toHaveBeenCalledTimes(1)
    const arg = push.mock.calls[0][0]
    expect(arg.query).toEqual({ foo: 'bar', tab: 'Project-Property', highlight: 'author_email' })
    w.destroy()
  })

  test('with no missing fields the refusal is the finding requirement text, with no button', async () => {
    Api.post.mockResolvedValue({ data: { status: false, missing_fields: [], has_complete_finding: false } })
    const { w } = build()
    await w.setData({ modalProject: { ...PUBLIC } })
    await w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    await w.vm.$nextTick()
    expect(w.text()).toContain('project.validation.publish_requirement')
    expect(w.text()).not.toContain('publish.go_to_properties')
    expect(Api.patch).not.toHaveBeenCalled()
    w.destroy()
  })

  test("with incomplete findings the publish asks Megan's confirmation and only patches on OK", async () => {
    Api.get.mockResolvedValue({ data: [COMPLETE_LIST, INCOMPLETE_LIST] })
    const cancelled = build({ confirm: false })
    await cancelled.w.setData({ modalProject: { ...PUBLIC } })
    await cancelled.w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    expect(cancelled.msgBoxConfirm).toHaveBeenCalledWith('publish.only_complete_findings_visible', expect.objectContaining({ title: 'project.warning', okTitle: 'common.continue', cancelTitle: 'common.cancel' }))
    expect(Api.patch).not.toHaveBeenCalled()
    expect(cancelled.w.emitted('uiPublishShowLoader').pop()).toEqual([false])
    cancelled.w.destroy()

    const accepted = build({ confirm: true })
    await accepted.w.setData({ modalProject: { ...PUBLIC } })
    await accepted.w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    expect(Api.patch).toHaveBeenCalledTimes(1)
    accepted.w.destroy()
  })

  test('with every finding complete there is no confirmation', async () => {
    Api.get.mockResolvedValue({ data: [COMPLETE_LIST] })
    const { w, msgBoxConfirm } = build()
    await w.setData({ modalProject: { ...PUBLIC } })
    await w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    expect(msgBoxConfirm).not.toHaveBeenCalled()
    expect(Api.patch).toHaveBeenCalledTimes(1)
    w.destroy()
  })

  test('if counting the findings fails it notifies and does not publish', async () => {
    Api.get.mockRejectedValue(Object.assign(new Error('500'), { response: { status: 500, data: {} }, config: { url: '/isoqf_lists' } }))
    const { w, msgBoxConfirm } = build()
    await w.setData({ modalProject: { ...PUBLIC } })
    await w.vm.savePublicStatus({ preventDefault () {} })
    await flush()
    expect(w.vm.$notify.error).toHaveBeenCalledWith('notifications.publish_error')
    expect(msgBoxConfirm).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
    w.destroy()
  })
})
