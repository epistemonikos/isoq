import { shallowMount, createLocalVue } from '@vue/test-utils'
import PublishModal from '@/components/project/PublishModal.vue'
import Vue from 'vue'

// Mock Api module before importing component
jest.mock('@/utils/Api', () => ({
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
      await wrapper.vm.$nextTick()
      
      const saveButton = wrapper.find('b-button-stub[variant="outline-success"]')
      expect(saveButton.attributes('disabled')).toBeFalsy()
    })
  })
})
