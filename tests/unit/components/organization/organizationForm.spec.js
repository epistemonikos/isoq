import { shallowMount, createLocalVue } from '@vue/test-utils'
import { BootstrapVue } from 'bootstrap-vue'
import OrganizationForm from '@/components/organization/organizationForm.vue'
import Project from '@/utils/project'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock de Project
jest.mock('@/utils/project', () => ({
  validEmail: jest.fn(),
  validUrl: jest.fn(),
  create: jest.fn(),
  update: jest.fn()
}))

// Mock de vue-router
const mockRoute = {
  query: {}
}

const mockRouter = {
  push: jest.fn()
}

// Mock de vuex store
const mockStore = {
  state: {
    user: {
      personal_organization: 'test-org-123'
    }
  }
}

// Factory para crear formData base
const createFormData = (overrides = {}) => ({
  id: null,
  name: '',
  authors: '',
  author: '',
  author_email: '',
  review_question: '',
  published_status: false,
  url_doi: '',
  complete_by_author: true,
  lists_authors: '',
  public_type: 'private',
  license_type: '',
  description: '',
  ...overrides
})

describe('organizationForm.vue', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(OrganizationForm, {
      localVue,
      mocks: {
        $route: mockRoute,
        $router: mockRouter,
        $store: mockStore,
        $t: (key) => key,
        $bvModal: {
          show: jest.fn(),
          hide: jest.fn()
        }
      },
      propsData: {
        formData: createFormData(),
        canWrite: true,
        isModal: false,
        highlight: ''
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  // ============================================
  // GRUPO 1: Tests de validación
  // ============================================
  describe('Validation Methods', () => {
    describe('validEmail', () => {
      it('llama a Project.validEmail con el email proporcionado', () => {
        Project.validEmail.mockReturnValue(true)

        const result = wrapper.vm.validEmail('test@example.com')

        expect(Project.validEmail).toHaveBeenCalledWith('test@example.com')
      })

      it('retorna true para email válido', () => {
        Project.validEmail.mockReturnValue(true)

        const result = wrapper.vm.validEmail('valid@email.com')

        expect(result).toBe(true)
      })

      it('retorna false para email inválido', () => {
        Project.validEmail.mockReturnValue(false)

        const result = wrapper.vm.validEmail('invalid-email')

        expect(result).toBe(false)
      })
    })

    describe('validUrl', () => {
      it('llama a Project.validUrl con la URL proporcionada', () => {
        Project.validUrl.mockReturnValue(true)

        wrapper.vm.validUrl('https://example.com')

        expect(Project.validUrl).toHaveBeenCalledWith('https://example.com')
      })

      it('retorna true para URL válida', () => {
        Project.validUrl.mockReturnValue(true)

        const result = wrapper.vm.validUrl('https://doi.org/10.1234')

        expect(result).toBe(true)
      })

      it('retorna false para URL inválida', () => {
        Project.validUrl.mockReturnValue(false)

        const result = wrapper.vm.validUrl('not-a-url')

        expect(result).toBe(false)
      })
    })
  })

  // ============================================
  // GRUPO 2: Tests de estado
  // ============================================
  describe('State Management', () => {
    describe('resetState', () => {
      it('resetea todos los campos de state a null', () => {
        // Setear algunos valores en state
        wrapper.vm.state.name = false
        wrapper.vm.state.author = false
        wrapper.vm.state.author_email = false

        wrapper.vm.resetState()

        expect(wrapper.vm.state.name).toBeNull()
        expect(wrapper.vm.state.authors).toBeNull()
        expect(wrapper.vm.state.author).toBeNull()
        expect(wrapper.vm.state.author_email).toBeNull()
        expect(wrapper.vm.state.review_question).toBeNull()
        expect(wrapper.vm.state.published_status).toBeNull()
        expect(wrapper.vm.state.url_doi).toBeNull()
        expect(wrapper.vm.state.complete_by_author).toBeNull()
        expect(wrapper.vm.state.lists_authors).toBeNull()
        expect(wrapper.vm.state.license).toBeNull()
        expect(wrapper.vm.state.can_publish).toBeNull()
      })
    })

    describe('dismissAlertProject', () => {
      it('setea msgUpdateProject a null', () => {
        wrapper.vm.msgUpdateProject = 'Some message'

        wrapper.vm.dismissAlertProject()

        expect(wrapper.vm.msgUpdateProject).toBeNull()
      })
    })

    describe('setMsgUpdateProject', () => {
      it('setea el mensaje y variant a danger', () => {
        // Mock window.scrollTo
        window.scrollTo = jest.fn()

        wrapper.vm.setMsgUpdateProject('Error message')

        expect(wrapper.vm.msgUpdateProject).toBe('Error message')
        expect(wrapper.vm.variant).toBe('danger')
      })

      it('hace scroll hacia arriba', () => {
        window.scrollTo = jest.fn()

        wrapper.vm.setMsgUpdateProject('Error')

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
      })
    })
  })

  // ============================================
  // GRUPO 3: Tests de checkRequiredFieldsRemoved
  // ============================================
  describe('checkRequiredFieldsRemoved', () => {
    it('retorna false si el proyecto original es privado', () => {
      wrapper.vm.originalFormData = createFormData({ public_type: 'private' })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: '',
        authors: '',
        author: '',
        author_email: '',
        review_question: ''
      })

      expect(result).toBe(false)
    })

    it('retorna true si name fue removido de proyecto publicado', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'fully',
        name: 'Original Name'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: '',
        authors: 'Author',
        author: 'Main Author',
        author_email: 'test@test.com',
        review_question: 'Question'
      })

      expect(result).toBe(true)
    })

    it('retorna true si authors fue removido de proyecto publicado', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'partially',
        authors: 'Original Authors'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: 'Name',
        authors: '   ', // Solo espacios
        author: 'Author',
        author_email: 'test@test.com',
        review_question: 'Question'
      })

      expect(result).toBe(true)
    })

    it('retorna true si author fue removido de proyecto publicado', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'minimally',
        author: 'Original Author'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: 'Name',
        authors: 'Authors',
        author: '',
        author_email: 'test@test.com',
        review_question: 'Question'
      })

      expect(result).toBe(true)
    })

    it('retorna true si author_email fue removido de proyecto publicado', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'fully',
        author_email: 'original@email.com'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: 'Name',
        authors: 'Authors',
        author: 'Author',
        author_email: '',
        review_question: 'Question'
      })

      expect(result).toBe(true)
    })

    it('retorna true si review_question fue removido de proyecto publicado', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'fully',
        review_question: 'Original Question'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: 'Name',
        authors: 'Authors',
        author: 'Author',
        author_email: 'test@test.com',
        review_question: ''
      })

      expect(result).toBe(true)
    })

    it('retorna false si ningún campo requerido fue removido', () => {
      wrapper.vm.originalFormData = createFormData({
        public_type: 'fully',
        name: 'Original Name',
        authors: 'Original Authors',
        author: 'Original Author',
        author_email: 'original@email.com',
        review_question: 'Original Question'
      })

      const result = wrapper.vm.checkRequiredFieldsRemoved({
        name: 'New Name',
        authors: 'New Authors',
        author: 'New Author',
        author_email: 'new@email.com',
        review_question: 'New Question'
      })

      expect(result).toBe(false)
    })
  })

  // ============================================
  // GRUPO 4: Tests de save
  // ============================================
  describe('save', () => {
    beforeEach(() => {
      window.scrollTo = jest.fn()
    })

    it('llama executeSave directamente si no hay campos removidos', async () => {
      // Setear originalFormData después de montar para evitar que el watcher lo sobrescriba
      await wrapper.vm.$nextTick()
      wrapper.vm.originalFormData = createFormData({ public_type: 'private' })
      const executeSaveSpy = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

      await wrapper.vm.save()

      expect(executeSaveSpy).toHaveBeenCalled()
      // Verificamos que pendingData es null (lo que significa que no se mostró el modal)
      expect(wrapper.vm.pendingData).toBeNull()
    })

    it('muestra modal de warning si hay campos removidos de proyecto publicado', async () => {
      // Crear un nuevo wrapper con formData específico
      const testWrapper = shallowMount(OrganizationForm, {
        localVue,
        mocks: {
          $route: mockRoute,
          $router: mockRouter,
          $store: mockStore,
          $t: (key) => key,
          $bvModal: {
            show: jest.fn(),
            hide: jest.fn()
          }
        },
        propsData: {
          formData: createFormData({
            public_type: 'fully',
            name: '' // Campo vacío
          }),
          canWrite: true,
          isModal: false,
          highlight: ''
        }
      })

      await testWrapper.vm.$nextTick()
      // Setear originalFormData para simular un proyecto que originalmente tenía nombre
      testWrapper.vm.originalFormData = createFormData({
        public_type: 'fully',
        name: 'Original Name'
      })

      await testWrapper.vm.save()

      // Verificamos que pendingData fue seteado (indica que el modal debería mostrarse)
      expect(testWrapper.vm.pendingData).toBeTruthy()

      testWrapper.destroy()
    })

    it('incluye organization del store en los datos', async () => {
      wrapper.vm.originalFormData = createFormData({ public_type: 'private' })
      wrapper.setProps({
        formData: createFormData({ name: 'Test' })
      })
      const executeSaveSpy = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

      await wrapper.vm.save()

      expect(executeSaveSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organization: 'test-org-123'
        })
      )
    })
  })

  // ============================================
  // GRUPO 5: Tests de executeSave
  // ============================================
  describe('executeSave', () => {
    beforeEach(() => {
      window.scrollTo = jest.fn()
    })

    describe('Actualización (con id)', () => {
      it('llama Project.update cuando data tiene id', async () => {
        Project.update.mockResolvedValue({ data: { status: true } })

        await wrapper.vm.executeSave({ id: 123, name: 'Test' })

        expect(Project.update).toHaveBeenCalledWith({ id: 123, name: 'Test' })
      })

      it('setea variant success y mensaje al éxito', async () => {
        Project.update.mockResolvedValue({ data: { status: true } })

        await wrapper.vm.executeSave({ id: 123, name: 'Test' })

        expect(wrapper.vm.variant).toBe('success')
        expect(wrapper.vm.msgUpdateProject).toBe('The project has been updated')
      })

      it('emite update-form-data al éxito cuando no es modal', async () => {
        Project.update.mockResolvedValue({ data: { status: true } })

        await wrapper.vm.executeSave({ id: 123, name: 'Test' })

        expect(wrapper.emitted('update-form-data')).toBeTruthy()
      })

      it('emite modal-notification al éxito cuando es modal', async () => {
        wrapper.setProps({ isModal: true })
        Project.update.mockResolvedValue({ data: { status: true } })

        // Mock del elemento del modal
        document.getElementById = jest.fn().mockReturnValue({
          scrollTo: jest.fn()
        })

        await wrapper.vm.executeSave({ id: 123, name: 'Test' })

        expect(wrapper.emitted('modal-notification')).toBeTruthy()
      })

      it('setea variant danger y state en caso de error', async () => {
        Project.update.mockResolvedValue({
          data: {
            status: false,
            message: 'Validation error',
            state: { name: false }
          }
        })

        await wrapper.vm.executeSave({ id: 123, name: '' })

        expect(wrapper.vm.variant).toBe('danger')
        expect(wrapper.vm.msgUpdateProject).toBe('Validation error')
        expect(wrapper.vm.state.name).toBe(false)
      })
    })

    describe('Creación (sin id)', () => {
      it('llama Project.create cuando data no tiene id', async () => {
        Project.create.mockResolvedValue({ data: { id: 456 } })

        await wrapper.vm.executeSave({ id: null, name: 'New Project' })

        expect(Project.create).toHaveBeenCalled()
      })

      it('setea variant success y mensaje al crear', async () => {
        Project.create.mockResolvedValue({ data: { id: 456 } })

        await wrapper.vm.executeSave({ id: null, name: 'New Project' })

        expect(wrapper.vm.variant).toBe('success')
        expect(wrapper.vm.msgUpdateProject).toBe('The project has been created')
      })

      it('emite modal-notification con response al crear', async () => {
        const mockResponse = { data: { id: 456 } }
        Project.create.mockResolvedValue(mockResponse)

        await wrapper.vm.executeSave({ id: null, name: 'New Project' })

        expect(wrapper.emitted('modal-notification')).toBeTruthy()
        expect(wrapper.emitted('modal-notification')[0][0]).toEqual(mockResponse)
      })

      it('setea variant danger en caso de error al crear', async () => {
        Project.create.mockResolvedValue({
          data: {
            message: 'Creation error',
            state: { name: false }
          }
        })

        await wrapper.vm.executeSave({ id: null, name: '' })

        expect(wrapper.vm.variant).toBe('danger')
        expect(wrapper.vm.msgUpdateProject).toBe('Creation error')
      })
    })

    it('actualiza originalFormData al éxito', async () => {
      Project.update.mockResolvedValue({ data: { status: true } })
      const newData = { id: 123, name: 'Updated Name' }

      await wrapper.vm.executeSave(newData)

      expect(wrapper.vm.originalFormData).toEqual(newData)
    })
  })

  // ============================================
  // GRUPO 6: Tests de publish warnings
  // ============================================
  describe('Publish Warnings', () => {
    describe('handlePublishWarningContinue', () => {
      beforeEach(() => {
        window.scrollTo = jest.fn()
        Project.update.mockResolvedValue({ data: { status: true } })
      })

      it('setea public_type a private', async () => {
        wrapper.vm.pendingData = { id: 123, name: 'Test', public_type: 'fully' }
        const executeSaveSpy = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

        await wrapper.vm.handlePublishWarningContinue()

        expect(executeSaveSpy).toHaveBeenCalledWith(
          expect.objectContaining({ public_type: 'private' })
        )
      })

      it('limpia license_type', async () => {
        wrapper.vm.pendingData = { id: 123, license_type: 'CC-BY' }
        const executeSaveSpy = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

        await wrapper.vm.handlePublishWarningContinue()

        expect(executeSaveSpy).toHaveBeenCalledWith(
          expect.objectContaining({ license_type: '' })
        )
      })

      it('llama resetState', async () => {
        wrapper.vm.pendingData = { id: 123 }
        const resetStateSpy = jest.spyOn(wrapper.vm, 'resetState')
        jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

        await wrapper.vm.handlePublishWarningContinue()

        expect(resetStateSpy).toHaveBeenCalled()
      })

      it('llama executeSave con los datos modificados', async () => {
        wrapper.vm.pendingData = { id: 123, name: 'Test' }
        const executeSaveSpy = jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

        await wrapper.vm.handlePublishWarningContinue()

        expect(executeSaveSpy).toHaveBeenCalled()
      })

      it('limpia pendingData después', async () => {
        wrapper.vm.pendingData = { id: 123 }
        jest.spyOn(wrapper.vm, 'executeSave').mockResolvedValue()

        await wrapper.vm.handlePublishWarningContinue()

        expect(wrapper.vm.pendingData).toBeNull()
      })
    })

    describe('handlePublishWarningCancel', () => {
      it('restaura campos requeridos que fueron removidos', async () => {
        // Crear un nuevo wrapper con formData con campos vacíos
        const testWrapper = shallowMount(OrganizationForm, {
          localVue,
          mocks: {
            $route: mockRoute,
            $router: mockRouter,
            $store: mockStore,
            $t: (key) => key,
            $bvModal: {
              show: jest.fn(),
              hide: jest.fn()
            }
          },
          propsData: {
            formData: createFormData({
              public_type: 'private',
              name: '', // Removido
              authors: 'New Authors', // Cambiado pero válido
              author: '', // Removido
              author_email: '', // Removido
              review_question: '' // Removido
            }),
            canWrite: true,
            isModal: false,
            highlight: ''
          }
        })

        await testWrapper.vm.$nextTick()
        // Setear originalFormData DESPUÉS para simular el estado original del proyecto
        testWrapper.vm.originalFormData = createFormData({
          public_type: 'fully',
          name: 'Original Name',
          authors: 'Original Authors',
          author: 'Original Author',
          author_email: 'original@email.com',
          review_question: 'Original Question'
        })
        testWrapper.vm.pendingData = {}

        testWrapper.vm.handlePublishWarningCancel()

        // Campos removidos deben restaurarse
        expect(testWrapper.vm.formData.name).toBe('Original Name')
        expect(testWrapper.vm.formData.author).toBe('Original Author')
        expect(testWrapper.vm.formData.author_email).toBe('original@email.com')
        expect(testWrapper.vm.formData.review_question).toBe('Original Question')
        // Campos con valores válidos deben mantenerse
        expect(testWrapper.vm.formData.authors).toBe('New Authors')

        testWrapper.destroy()
      })

      it('restaura public_type al valor original', () => {
        wrapper.vm.originalFormData = createFormData({ public_type: 'fully' })
        wrapper.setProps({
          formData: createFormData({ public_type: 'private' })
        })
        wrapper.vm.pendingData = {}

        wrapper.vm.handlePublishWarningCancel()

        expect(wrapper.vm.formData.public_type).toBe('fully')
      })

      it('limpia pendingData', () => {
        wrapper.vm.originalFormData = createFormData({ public_type: 'fully' })
        wrapper.vm.pendingData = { id: 123 }

        wrapper.vm.handlePublishWarningCancel()

        expect(wrapper.vm.pendingData).toBeNull()
      })
    })
  })

  // ============================================
  // GRUPO 7: Tests de computed isProjectPublished
  // ============================================
  describe('isProjectPublished (computed)', () => {
    it('retorna false si formData.public_type es private y originalFormData es private', async () => {
      wrapper.vm.originalFormData = createFormData({ public_type: 'private' })
      await wrapper.setProps({
        formData: createFormData({ public_type: 'private' })
      })

      expect(wrapper.vm.isProjectPublished).toBe(false)
    })

    it('retorna true si formData.public_type no es private', async () => {
      wrapper.vm.originalFormData = createFormData({ public_type: 'private' })
      await wrapper.setProps({
        formData: createFormData({ public_type: 'fully' })
      })

      expect(wrapper.vm.isProjectPublished).toBe(true)
    })

    it('retorna true si originalFormData.public_type no es private', async () => {
      // Crear un nuevo wrapper con formData private
      const testWrapper = shallowMount(OrganizationForm, {
        localVue,
        mocks: {
          $route: mockRoute,
          $router: mockRouter,
          $store: mockStore,
          $t: (key) => key,
          $bvModal: {
            show: jest.fn(),
            hide: jest.fn()
          }
        },
        propsData: {
          formData: createFormData({ public_type: 'private' }),
          canWrite: true,
          isModal: false,
          highlight: ''
        }
      })

      await testWrapper.vm.$nextTick()
      // Setear originalFormData DESPUÉS para evitar que el watcher lo sobrescriba
      testWrapper.vm.originalFormData = createFormData({ public_type: 'fully' })

      expect(testWrapper.vm.isProjectPublished).toBe(true)

      testWrapper.destroy()
    })

    it('retorna true si ambos no son private', async () => {
      wrapper.vm.originalFormData = createFormData({ public_type: 'partially' })
      await wrapper.setProps({
        formData: createFormData({ public_type: 'minimally' })
      })

      expect(wrapper.vm.isProjectPublished).toBe(true)
    })
  })

  // ============================================
  // GRUPO 8: Tests de data inicial
  // ============================================
  describe('Initial Data', () => {
    it('tiene global_status con 4 opciones', () => {
      expect(wrapper.vm.global_status).toHaveLength(4)
      expect(wrapper.vm.global_status[0].value).toBe('private')
      expect(wrapper.vm.global_status[1].value).toBe('fully')
      expect(wrapper.vm.global_status[2].value).toBe('partially')
      expect(wrapper.vm.global_status[3].value).toBe('minimally')
    })

    it('tiene yes_or_no con 2 opciones', () => {
      expect(wrapper.vm.yes_or_no).toHaveLength(2)
      expect(wrapper.vm.yes_or_no[0].value).toBe(false)
      expect(wrapper.vm.yes_or_no[1].value).toBe(true)
    })

    it('tiene 6 tipos de licencia en global_licenses', () => {
      expect(wrapper.vm.global_licenses).toHaveLength(6)
      expect(wrapper.vm.global_licenses.map(l => l.value)).toEqual([
        'CC-BY-NC-ND', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC', 'CC-BY-SA', 'CC-BY'
      ])
    })

    it('tiene state con todos los campos en null', () => {
      const stateFields = ['id', 'name', 'authors', 'author', 'author_email',
        'review_question', 'published_status', 'url_doi', 'complete_by_author',
        'lists_authors', 'license', 'can_publish']

      for (const field of stateFields) {
        expect(wrapper.vm.state[field]).toBeNull()
      }
    })

    it('variant inicia como info', () => {
      expect(wrapper.vm.variant).toBe('info')
    })

    it('msgUpdateProject inicia como null', () => {
      expect(wrapper.vm.msgUpdateProject).toBeNull()
    })
  })

  // ============================================
  // GRUPO 9: Tests de watcher highlight
  // ============================================
  describe('Watch: highlight', () => {
    it('setea state fields a false cuando highlight tiene campos', async () => {
      await wrapper.setProps({ highlight: 'name,author' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.name).toBe(false)
      expect(wrapper.vm.state.author).toBe(false)
    })

    it('convierte license_type a license en el state', async () => {
      await wrapper.setProps({ highlight: 'license_type' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.license).toBe(false)
    })

    it('no hace nada si highlight está vacío', async () => {
      wrapper.vm.state.name = null
      await wrapper.setProps({ highlight: '' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.name).toBeNull()
    })

    it('maneja múltiples campos separados por coma', async () => {
      await wrapper.setProps({ highlight: 'name,authors,author_email,review_question' })
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.name).toBe(false)
      expect(wrapper.vm.state.authors).toBe(false)
      expect(wrapper.vm.state.author_email).toBe(false)
      expect(wrapper.vm.state.review_question).toBe(false)
    })
  })
})
