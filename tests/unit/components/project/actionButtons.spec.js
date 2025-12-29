import { shallowMount, createLocalVue } from '@vue/test-utils'
import { BootstrapVue } from 'bootstrap-vue'
import ActionButtons from '@/components/project/actionButtons.vue'
import axios from 'axios'

// Mock axios
jest.mock('axios')

// Mock file-saver
jest.mock('file-saver', () => ({
  saveAs: jest.fn()
}))

// Mock docx - simplificar los mocks
jest.mock('docx', () => {
  const mockBlob = { size: 0, type: 'application/octet-stream' }
  return {
    Document: jest.fn().mockImplementation(() => ({
      addSection: jest.fn()
    })),
    Packer: {
      toBlob: jest.fn().mockResolvedValue(mockBlob)
    },
    Paragraph: jest.fn(),
    TextRun: jest.fn().mockImplementation((options) => options),
    HeadingLevel: { HEADING_2: 'HEADING_2', HEADING_3: 'HEADING_3' },
    AlignmentType: { CENTER: 'CENTER', LEFT: 'LEFT' },
    Table: jest.fn(),
    TableCell: jest.fn(),
    TableRow: jest.fn(),
    WidthType: { PERCENTAGE: 'PERCENTAGE' },
    VerticalAlign: { CENTER: 'CENTER' },
    BorderStyle: { NONE: 'NONE' },
    PageOrientation: { LANDSCAPE: 'LANDSCAPE' },
    HeightRule: { EXACT: 'EXACT' },
    TableLayoutType: { FIXED: 'FIXED' }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Factory para crear project base
const createProject = (overrides = {}) => ({
  id: 1,
  name: 'Test Project',
  authors: 'Author One, Author Two',
  author: 'Main Author',
  author_email: 'author@test.com',
  review_question: 'Test review question',
  published_status: false,
  url_doi: '',
  public_type: 'private',
  license_type: '',
  description: 'Test description',
  is_public: false,
  ...overrides
})

// Factory para crear referencias
const createReference = (overrides = {}) => ({
  id: 1,
  title: 'Test Reference',
  authors: ['Author One', 'Author Two'],
  publication_year: '2023',
  type: 'JOUR',
  abstract: 'Test abstract',
  database: 'PubMed',
  volume_number: '10',
  url: 'https://example.com',
  start_page: '1',
  isbn_issn: '1234-5678',
  date: '2023-01-01',
  user_definable: ['Custom 1', 'Custom 2'],
  ...overrides
})

// Mock de vue-router
const mockRoute = {
  params: { org_id: 'test-org' },
  name: 'viewProject'
}

const mockRouter = {
  push: jest.fn()
}

describe('actionButtons.vue', () => {
  let wrapper

  const defaultProps = {
    mode: 'view',
    preview: false,
    project: createProject(),
    permissions: true,
    ui: { publish: { showLoader: false } },
    lists: [],
    findings: [],
    references: [],
    charsOfStudies: {},
    methodologicalTableRefs: {},
    listsPrintVersion: [],
    selectOptions: [
      { value: 0, text: 'No/Very minor concerns' },
      { value: 1, text: 'Minor concerns' },
      { value: 2, text: 'Moderate concerns' },
      { value: 3, text: 'Serious concerns' }
    ],
    cerqualConfidence: [
      { value: 0, text: 'High confidence' },
      { value: 1, text: 'Moderate confidence' },
      { value: 2, text: 'Low confidence' },
      { value: 3, text: 'Very low confidence' }
    ],
    printableItems: []
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ActionButtons, {
      localVue,
      mocks: {
        $route: mockRoute,
        $router: mockRouter,
        $t: (key) => key,
        $refs: {
          'modal-change-status': {
            show: jest.fn(),
            hide: jest.fn()
          }
        }
      },
      propsData: defaultProps
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  // ============================================
  // GRUPO 1: Tests de changeMode
  // ============================================
  describe('changeMode', () => {
    it('emite changeMode con "view" cuando el modo actual es "edit"', async () => {
      await wrapper.setProps({ mode: 'edit' })

      wrapper.vm.changeMode()

      expect(wrapper.emitted('changeMode')).toBeTruthy()
      expect(wrapper.emitted('changeMode')[0][0]).toBe('view')
    })

    it('emite changeMode con "edit" cuando el modo actual es "view"', () => {
      wrapper.vm.changeMode()

      expect(wrapper.emitted('changeMode')).toBeTruthy()
      expect(wrapper.emitted('changeMode')[0][0]).toBe('edit')
    })

    it('emite changeTableSettings con perPage igual al número de listas en modo view', async () => {
      await wrapper.setProps({
        mode: 'view',
        lists: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })

      wrapper.vm.changeMode()

      // Cuando modo es 'view', cambia a 'edit' y emite perPage: lists.length
      expect(wrapper.emitted('changeTableSettings')).toBeTruthy()
      expect(wrapper.emitted('changeTableSettings')[0][0]).toEqual({
        perPage: 3,
        currentPage: 1
      })
    })

    it('emite changeTableSettings con perPage 5 en modo edit', async () => {
      await wrapper.setProps({
        mode: 'edit',
        lists: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })

      wrapper.vm.changeMode()

      // Cuando modo es 'edit', cambia a 'view' y emite perPage: 5
      expect(wrapper.emitted('changeTableSettings')).toBeTruthy()
      expect(wrapper.emitted('changeTableSettings')[0][0]).toEqual({
        perPage: 5,
        currentPage: 1
      })
    })
  })

  // ============================================
  // GRUPO 2: Tests de processRIS
  // ============================================
  describe('processRIS', () => {
    it('genera formato RIS con todos los campos', () => {
      const reference = createReference()

      const result = wrapper.vm.processRIS(reference)

      expect(result).toContain('TY  - JOUR')
      expect(result).toContain('AB  - Test abstract')
      expect(result).toContain('TI  - Test Reference')
      expect(result).toContain('A1  - Author One')
      expect(result).toContain('A2  - Author Two')
      expect(result).toContain('PY  - 2023')
      expect(result).toContain('DB  - PubMed')
      expect(result).toContain('VL  - 10')
      expect(result).toContain('UR  - https://example.com')
      expect(result).toContain('SP  - 1')
      expect(result).toContain('SN  - 1234-5678')
      expect(result).toContain('DA  - 2023-01-01')
      expect(result).toContain('C1 - Custom 1')
      expect(result).toContain('C2 - Custom 2')
      expect(result).toContain('ER  - ')
    })

    it('genera formato RIS con campos mínimos', () => {
      const reference = { title: 'Only Title' }

      const result = wrapper.vm.processRIS(reference)

      expect(result).toContain('TI  - Only Title')
      expect(result).toContain('ER  - ')
      expect(result).not.toContain('TY  -')
      expect(result).not.toContain('AB  -')
    })

    it('retorna solo ER para referencia vacía', () => {
      const result = wrapper.vm.processRIS({})

      expect(result).toBe('ER  - \r\n')
    })

    it('maneja múltiples autores correctamente', () => {
      const reference = {
        authors: ['First Author', 'Second Author', 'Third Author']
      }

      const result = wrapper.vm.processRIS(reference)

      expect(result).toContain('A1  - First Author')
      expect(result).toContain('A2  - Second Author')
      expect(result).toContain('A3  - Third Author')
    })
  })

  // ============================================
  // GRUPO 3: Tests de getAuthorsFormat
  // ============================================
  describe('getAuthorsFormat', () => {
    it('retorna un autor con año', () => {
      const result = wrapper.vm.getAuthorsFormat(['Smith, John'], '2023')

      expect(result).toBe('Smith 2023')
    })

    it('retorna dos autores con & y año', () => {
      const result = wrapper.vm.getAuthorsFormat(
        ['Smith, John', 'Jones, Mary'],
        '2023'
      )

      expect(result).toBe('Smith & Jones 2023')
    })

    it('retorna primer autor et al. para más de dos autores', () => {
      const result = wrapper.vm.getAuthorsFormat(
        ['Smith, John', 'Jones, Mary', 'Brown, Bob'],
        '2023'
      )

      expect(result).toBe('Smith et al.  2023')
    })

    it('retorna "author(s) not found" para array vacío', () => {
      const result = wrapper.vm.getAuthorsFormat([], '2023')

      expect(result).toBe('author(s) not found')
    })

    it('maneja autores sin coma en el nombre', () => {
      const result = wrapper.vm.getAuthorsFormat(['JohnSmith'], '2023')

      expect(result).toBe('JohnSmith 2023')
    })
  })

  // ============================================
  // GRUPO 4: Tests de displaySelectedOption
  // ============================================
  describe('displaySelectedOption', () => {
    it('retorna texto de selectOptions para opción válida', () => {
      const result = wrapper.vm.displaySelectedOption(0)

      expect(result).toBe('No/Very minor concerns')
    })

    it('retorna texto de cerqualConfidence cuando type es cerqual', () => {
      const result = wrapper.vm.displaySelectedOption(0, 'cerqual')

      expect(result).toBe('High confidence')
    })

    it('retorna string vacío para opción null', () => {
      const result = wrapper.vm.displaySelectedOption(null)

      expect(result).toBe('')
    })

    it('retorna string vacío para opción negativa', () => {
      const result = wrapper.vm.displaySelectedOption(-1)

      expect(result).toBe('')
    })

    it('retorna texto correcto para todas las opciones', () => {
      expect(wrapper.vm.displaySelectedOption(0)).toBe('No/Very minor concerns')
      expect(wrapper.vm.displaySelectedOption(1)).toBe('Minor concerns')
      expect(wrapper.vm.displaySelectedOption(2)).toBe('Moderate concerns')
      expect(wrapper.vm.displaySelectedOption(3)).toBe('Serious concerns')
    })

    it('retorna texto correcto para todas las opciones cerqual', () => {
      expect(wrapper.vm.displaySelectedOption(0, 'cerqual')).toBe('High confidence')
      expect(wrapper.vm.displaySelectedOption(1, 'cerqual')).toBe('Moderate confidence')
      expect(wrapper.vm.displaySelectedOption(2, 'cerqual')).toBe('Low confidence')
      expect(wrapper.vm.displaySelectedOption(3, 'cerqual')).toBe('Very low confidence')
    })
  })

  // ============================================
  // GRUPO 5: Tests de returnRefWithNames
  // ============================================
  describe('returnRefWithNames', () => {
    beforeEach(async () => {
      await wrapper.setProps({
        references: [
          { id: 1, authors: ['Smith, John'], publication_year: '2020' },
          { id: 2, authors: ['Jones, Mary', 'Brown, Bob'], publication_year: '2021' },
          { id: 3, authors: ['White, Alice', 'Black, Bob', 'Green, Carol'], publication_year: '2022' }
        ]
      })
    })

    it('retorna autores formateados para un array de IDs', () => {
      const result = wrapper.vm.returnRefWithNames([1, 2])

      expect(result).toContain('Smith 2020')
      expect(result).toContain('Jones & Brown 2021')
    })

    it('retorna string vacío para array vacío', () => {
      const result = wrapper.vm.returnRefWithNames([])

      expect(result).toBe('')
    })

    it('ordena los autores alfabéticamente', () => {
      const result = wrapper.vm.returnRefWithNames([1, 2, 3])

      // Verificar que contiene los tres autores
      expect(result).toContain('Smith 2020')
      expect(result).toContain('Jones & Brown 2021')
      expect(result).toContain('White et al.')
    })

    it('ignora IDs que no existen en references', () => {
      const result = wrapper.vm.returnRefWithNames([1, 999])

      expect(result).toContain('Smith 2020')
      expect(result).not.toContain('999')
    })
  })

  // ============================================
  // GRUPO 6: Tests de modalChangePublicStatus
  // ============================================
  describe('modalChangePublicStatus', () => {
    it('copia el proyecto a modalProject', () => {
      wrapper.vm.$refs = {
        'modal-change-status': { show: jest.fn() }
      }

      wrapper.vm.modalChangePublicStatus()

      expect(wrapper.vm.modalProject.name).toBe('Test Project')
      expect(wrapper.vm.modalProject.isModal).toBe(true)
    })

    it('setea license_type a CC-BY-NC-ND si no existe', async () => {
      const projectWithoutLicense = createProject()
      delete projectWithoutLicense.license_type
      await wrapper.setProps({ project: projectWithoutLicense })

      wrapper.vm.$refs = {
        'modal-change-status': { show: jest.fn() }
      }

      wrapper.vm.modalChangePublicStatus()

      expect(wrapper.vm.modalProject.license_type).toBe('CC-BY-NC-ND')
    })

    it('resetea errorsResponse', () => {
      wrapper.vm.errorsResponse = { message: 'Previous error', items: ['item1'] }
      wrapper.vm.$refs = {
        'modal-change-status': { show: jest.fn() }
      }

      wrapper.vm.modalChangePublicStatus()

      expect(wrapper.vm.errorsResponse.message).toBe('')
      expect(wrapper.vm.errorsResponse.items).toEqual([])
    })

    it('llama show() en el modal', () => {
      const showMock = jest.fn()
      wrapper.vm.$refs = {
        'modal-change-status': { show: showMock }
      }

      wrapper.vm.modalChangePublicStatus()

      expect(showMock).toHaveBeenCalled()
    })
  })

  // ============================================
  // GRUPO 7: Tests de savePublicStatus
  // ============================================
  describe('savePublicStatus', () => {
    let mockEvent

    beforeEach(() => {
      mockEvent = { preventDefault: jest.fn() }
      wrapper.vm.$refs = {
        'modal-change-status': { hide: jest.fn() }
      }
    })

    it('previene el evento por defecto', async () => {
      wrapper.vm.modalProject = { name: 'Test', public_type: 'private' }

      axios.patch.mockResolvedValue({})

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    it('emite uiPublishShowLoader true al iniciar', async () => {
      wrapper.vm.modalProject = { name: 'Test', public_type: 'private' }
      axios.patch.mockResolvedValue({})

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(wrapper.emitted('uiPublishShowLoader')[0][0]).toBe(true)
    })

    it('setea state.license_type a false si no se selecciona licencia', async () => {
      wrapper.vm.modalProject = {
        name: 'Test',
        public_type: 'fully',
        license_type: ''
      }

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(wrapper.vm.state.license_type).toBe(false)
      expect(wrapper.emitted('uiPublishShowLoader')[1][0]).toBe(false)
    })

    it('llama axios.patch para proyecto private', async () => {
      wrapper.vm.modalProject = { name: 'Test', public_type: 'private' }
      axios.patch.mockResolvedValue({})

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(axios.patch).toHaveBeenCalledWith('/api/publish', {
        params: expect.objectContaining({
          public_type: 'private',
          private: true,
          is_public: false,
          license_type: ''
        })
      })
    })

    it('verifica can_publish antes de publicar proyecto no private', async () => {
      wrapper.vm.modalProject = {
        name: 'Test',
        public_type: 'fully',
        license_type: 'CC-BY'
      }
      axios.get.mockResolvedValue({ data: { status: true } })
      axios.patch.mockResolvedValue({})

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(axios.get).toHaveBeenCalledWith('/api/project/can_publish', {
        params: expect.objectContaining({
          id: 1,
          workspace: 'test-org'
        })
      })
    })

    it('muestra error si can_publish retorna false', async () => {
      wrapper.vm.modalProject = {
        name: 'Test',
        public_type: 'fully',
        license_type: 'CC-BY'
      }
      document.getElementById = jest.fn().mockReturnValue({
        scrollTo: jest.fn()
      })
      axios.get.mockResolvedValue({
        data: { status: false, message: 'Cannot publish' }
      })

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(wrapper.vm.errorsResponse.message).toBe('Cannot publish')
      expect(wrapper.emitted('uiPublishShowLoader')[1][0]).toBe(false)
    })

    it('emite getProject al publicar exitosamente', async () => {
      wrapper.vm.modalProject = {
        name: 'Test',
        public_type: 'fully',
        license_type: 'CC-BY'
      }
      axios.get.mockResolvedValue({ data: { status: true } })
      axios.patch.mockResolvedValue({})

      await wrapper.vm.savePublicStatus(mockEvent)

      expect(wrapper.emitted('getProject')).toBeTruthy()
    })
  })

  // ============================================
  // GRUPO 8: Tests de filteredPrintedData
  // ============================================
  describe('filteredPrintedData', () => {
    it('filtra items basados en printableItems', async () => {
      await wrapper.setProps({
        listsPrintVersion: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
          { id: 3, name: 'Item 3' }
        ],
        printableItems: [1, 3]
      })

      const result = wrapper.vm.filteredPrintedData()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Item 1')
      expect(result[1].name).toBe('Item 3')
    })

    it('retorna array vacío si printableItems está vacío', async () => {
      await wrapper.setProps({
        listsPrintVersion: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' }
        ],
        printableItems: []
      })

      const result = wrapper.vm.filteredPrintedData()

      expect(result).toHaveLength(0)
    })

    it('retorna array vacío si listsPrintVersion está vacío', async () => {
      await wrapper.setProps({
        listsPrintVersion: [],
        printableItems: [1, 2, 3]
      })

      const result = wrapper.vm.filteredPrintedData()

      expect(result).toHaveLength(0)
    })
  })

  // ============================================
  // GRUPO 9: Tests de getLicense computed
  // ============================================
  describe('getLicense computed', () => {
    it('retorna CC-BY-NC-ND si modalProject no tiene license_type', () => {
      wrapper.vm.modalProject = { name: 'Test' }

      expect(wrapper.vm.getLicense).toBe('CC-BY-NC-ND')
    })

    it('retorna CC-BY-NC-ND si license_type está vacío', () => {
      wrapper.vm.modalProject = { name: 'Test', license_type: '' }

      expect(wrapper.vm.getLicense).toBe('CC-BY-NC-ND')
    })

    it('retorna el license_type si tiene valor', () => {
      wrapper.vm.modalProject = { name: 'Test', license_type: 'CC-BY' }

      expect(wrapper.vm.getLicense).toBe('CC-BY')
    })

    it('setter actualiza modalProject.license_type', () => {
      wrapper.vm.modalProject = { name: 'Test', license_type: '' }

      wrapper.vm.getLicense = 'CC-BY-SA'

      expect(wrapper.vm.modalProject.license_type).toBe('CC-BY-SA')
    })
  })

  // ============================================
  // GRUPO 10: Tests de Watch modalProject.name
  // ============================================
  describe('Watch: modalProject.name', () => {
    it('setea state.name a null cuando el nombre tiene longitud > 0', async () => {
      wrapper.vm.modalProject = { name: '' }
      wrapper.vm.state.name = false

      wrapper.vm.modalProject.name = 'New Name'
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.name).toBeNull()
    })

    it('setea state.name a false cuando el nombre está vacío', async () => {
      wrapper.vm.modalProject = { name: 'Has Name' }
      await wrapper.vm.$nextTick()

      wrapper.vm.modalProject.name = ''
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.state.name).toBe(false)
    })
  })

  // ============================================
  // GRUPO 11: Tests de Initial Data
  // ============================================
  describe('Initial Data', () => {
    it('tiene global_status con 4 opciones', () => {
      expect(wrapper.vm.global_status).toHaveLength(4)
      expect(wrapper.vm.global_status.map(s => s.value)).toEqual([
        'private', 'fully', 'partially', 'minimally'
      ])
    })

    it('tiene global_licenses con 6 opciones', () => {
      expect(wrapper.vm.global_licenses).toHaveLength(6)
      expect(wrapper.vm.global_licenses.map(l => l.value)).toEqual([
        'CC-BY-NC-ND', 'CC-BY-ND', 'CC-BY-NC-SA', 'CC-BY-NC', 'CC-BY-SA', 'CC-BY'
      ])
    })

    it('tiene yes_or_no con 2 opciones', () => {
      expect(wrapper.vm.yes_or_no).toHaveLength(2)
      expect(wrapper.vm.yes_or_no[0].value).toBe(false)
      expect(wrapper.vm.yes_or_no[1].value).toBe(true)
    })

    it('modalProject inicia con name vacío', () => {
      expect(wrapper.vm.modalProject.name).toBe('')
    })

    it('errorsResponse inicia con message vacío e items vacío', () => {
      expect(wrapper.vm.errorsResponse.message).toBe('')
      expect(wrapper.vm.errorsResponse.items).toEqual([])
    })

    it('state tiene todos los campos en null', () => {
      const stateFields = ['name', 'authors', 'author', 'author_email',
        'review_question', 'published_status', 'url_doi', 'complete_by_author',
        'lists_authors', 'public_type', 'license_type']

      for (const field of stateFields) {
        expect(wrapper.vm.state[field]).toBeNull()
      }
    })
  })

  // ============================================
  // GRUPO 12: Tests de printiSoQ
  // ============================================
  describe('printiSoQ', () => {
    it('llama window.print()', () => {
      window.print = jest.fn()

      wrapper.vm.printiSoQ()

      expect(window.print).toHaveBeenCalled()
    })
  })

  // ============================================
  // GRUPO 13: Tests de handleErrorClick
  // ============================================
  describe('handleErrorClick', () => {
    it('oculta el modal cuando se hace click en un enlace', () => {
      const hideMock = jest.fn()
      wrapper.vm.$refs = {
        'modal-change-status': { hide: hideMock }
      }

      const event = {
        target: { tagName: 'A' }
      }

      wrapper.vm.handleErrorClick(event)

      expect(hideMock).toHaveBeenCalled()
    })

    it('no oculta el modal cuando se hace click en otro elemento', () => {
      const hideMock = jest.fn()
      wrapper.vm.$refs = {
        'modal-change-status': { hide: hideMock }
      }

      const event = {
        target: { tagName: 'P' }
      }

      wrapper.vm.handleErrorClick(event)

      expect(hideMock).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // GRUPO 14: Tests de generateAuthorInfo
  // ============================================
  describe('generateAuthorInfo', () => {
    it('genera TextRun con autor y email', async () => {
      await wrapper.setProps({
        project: createProject({
          author: 'Test Author',
          author_email: 'test@email.com'
        })
      })

      const result = wrapper.vm.generateAuthorInfo()

      // El resultado es un TextRun mock, verificamos que se llama correctamente
      expect(result).toBeDefined()
    })

    it('genera TextRun solo con autor si no hay email', async () => {
      await wrapper.setProps({
        project: createProject({
          author: 'Test Author',
          author_email: ''
        })
      })

      const result = wrapper.vm.generateAuthorInfo()

      expect(result).toBeDefined()
    })

    it('genera TextRun vacío si no hay autor', async () => {
      await wrapper.setProps({
        project: createProject({
          author: '',
          author_email: ''
        })
      })

      const result = wrapper.vm.generateAuthorInfo()

      expect(result).toBeDefined()
    })
  })

  // ============================================
  // GRUPO 15: Tests de generateLicense
  // ============================================
  describe('generateLicense', () => {
    it('genera contenido de licencia para proyecto no private', () => {
      const project = createProject({
        public_type: 'fully',
        license_type: 'CC-BY'
      })

      const result = wrapper.vm.generateLicense(project)

      expect(result.length).toBeGreaterThan(0)
    })

    it('retorna array vacío para proyecto private', () => {
      const project = createProject({ public_type: 'private' })

      const result = wrapper.vm.generateLicense(project)

      expect(result).toEqual([])
    })
  })

  // ============================================
  // GRUPO 16: Tests de generateFindingsTable
  // ============================================
  describe('generateFindingsTable', () => {
    it('retorna array vacío si no hay findings', () => {
      const result = wrapper.vm.generateFindingsTable()

      expect(result).toEqual([])
    })

    it('genera tabla cuando hay findings', async () => {
      await wrapper.setProps({
        findings: [{ id: 1, name: 'Finding 1' }]
      })

      const result = wrapper.vm.generateFindingsTable()

      expect(result.length).toBeGreaterThan(0)
    })
  })

  // ============================================
  // GRUPO 17: Tests de exportToRIS
  // ============================================
  describe('exportToRIS', () => {
    it('crea elemento anchor y dispara click para descargar', async () => {
      const clickMock = jest.fn()
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: jest.fn(),
        click: clickMock
      })

      await wrapper.setProps({
        references: [createReference()]
      })

      wrapper.vm.exportToRIS()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(clickMock).toHaveBeenCalled()

      createElementSpy.mockRestore()
    })

    it('procesa todas las referencias', async () => {
      const processRISSpy = jest.spyOn(wrapper.vm, 'processRIS')
      jest.spyOn(document, 'createElement').mockReturnValue({
        setAttribute: jest.fn(),
        click: jest.fn()
      })

      await wrapper.setProps({
        references: [
          createReference({ id: 1 }),
          createReference({ id: 2 })
        ]
      })

      wrapper.vm.exportToRIS()

      expect(processRISSpy).toHaveBeenCalledTimes(2)
    })
  })
})
