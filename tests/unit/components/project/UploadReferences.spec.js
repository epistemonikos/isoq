import { shallowMount, createLocalVue } from '@vue/test-utils'
import { BootstrapVue } from 'bootstrap-vue'
import UploadReferences from '@/components/project/UploadReferences.vue'
import axios from 'axios'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock de vue-router
const mockRoute = {
  params: {
    id: 'test-project-123',
    org_id: 'test-org-456'
  }
}

// Mock de axios
jest.mock('axios')

describe('UploadReferences.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallowMount(UploadReferences, {
      localVue,
      mocks: {
        $route: mockRoute,
        $http: {
          get: jest.fn(),
          post: jest.fn()
        }
      },
      propsData: {
        checkPermissions: true,
        loadReferences: false,
        references: [],
        episteResponse: [],
        lists: [],
        charsOfStudies: {},
        methodologicalTableRefs: {}
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  // ============================================
  // GRUPO 1: Tests de formateo de autores
  // ============================================
  describe('formatAuthors', () => {
    it('retorna "author(s) not found" cuando authors es undefined', () => {
      const result = wrapper.vm.formatAuthors(undefined)
      expect(result).toBe('author(s) not found')
    })

    it('retorna "author(s) not found" cuando authors es null', () => {
      const result = wrapper.vm.formatAuthors(null)
      expect(result).toBe('author(s) not found')
    })

    it('retorna "author(s) not found" cuando authors es un array vacío', () => {
      const result = wrapper.vm.formatAuthors([])
      expect(result).toBe('author(s) not found')
    })

    it('retorna solo el apellido cuando hay 1 autor', () => {
      const authors = ['Smith, John']
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('Smith')
    })

    it('maneja autor sin coma correctamente (retorna el nombre completo)', () => {
      const authors = ['Smith']
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('Smith')
    })

    it('retorna "Apellido1 & Apellido2" cuando hay 2 autores', () => {
      const authors = ['Smith, John', 'Jones, Alice']
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('Smith & Jones')
    })

    it('retorna "Apellido1 et al." cuando hay 3 o más autores', () => {
      const authors = ['Smith, John', 'Jones, Alice', 'Brown, Bob']
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('Smith et al.')
    })

    it('retorna "Apellido1 et al." cuando hay muchos autores', () => {
      const authors = [
        'Smith, John',
        'Jones, Alice',
        'Brown, Bob',
        'Davis, Carol',
        'Wilson, Eve'
      ]
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('Smith et al.')
    })

    it('maneja autores con formatos de nombre variados', () => {
      const authors = ['García López, María Elena']
      const result = wrapper.vm.formatAuthors(authors)
      expect(result).toBe('García López')
    })
  })

  // ============================================
  // GRUPO 1.B: Tests de parseReference
  // ============================================
  describe('parseReference', () => {
    it('retorna "author(s) not found" cuando no hay autores', () => {
      const reference = {
        authors: [],
        publication_year: '2020',
        title: 'Test Title'
      }
      const result = wrapper.vm.parseReference(reference)
      expect(result).toBe('author(s) not found')
    })

    it('retorna formato completo con autores, año y título', () => {
      const reference = {
        authors: ['Smith, John'],
        publication_year: '2020',
        title: 'Test Title'
      }
      const result = wrapper.vm.parseReference(reference)
      expect(result).toBe('Smith 2020; Test Title')
    })

    it('retorna solo autores y año cuando onlyAuthors es true', () => {
      const reference = {
        authors: ['Smith, John'],
        publication_year: '2020',
        title: 'Test Title'
      }
      const result = wrapper.vm.parseReference(reference, true)
      expect(result).toBe('Smith 2020; ')
    })

    it('omite punto y coma cuando hasSemicolon es false', () => {
      const reference = {
        authors: ['Smith, John'],
        publication_year: '2020',
        title: 'Test Title'
      }
      const result = wrapper.vm.parseReference(reference, true, false)
      expect(result).toBe('Smith 2020')
    })

    it('formatea correctamente con 2 autores', () => {
      const reference = {
        authors: ['Smith, John', 'Jones, Alice'],
        publication_year: '2019',
        title: 'Two Author Study'
      }
      const result = wrapper.vm.parseReference(reference)
      expect(result).toBe('Smith & Jones 2019; Two Author Study')
    })

    it('formatea correctamente con 3+ autores', () => {
      const reference = {
        authors: ['Smith, John', 'Jones, Alice', 'Brown, Bob'],
        publication_year: '2018',
        title: 'Multi Author Study'
      }
      const result = wrapper.vm.parseReference(reference)
      expect(result).toBe('Smith et al. 2018; Multi Author Study')
    })

    it('retorna string vacío cuando reference no tiene propiedad authors', () => {
      const reference = {
        publication_year: '2020',
        title: 'No Authors'
      }
      const result = wrapper.vm.parseReference(reference)
      expect(result).toBe('')
    })
  })

  // ============================================
  // GRUPO 2: Tests de persistencia local (LocalStorage)
  // ============================================
  describe('LocalStorage Persistence', () => {
    beforeEach(() => {
      // Limpiar localStorage antes de cada test
      localStorage.clear()
      wrapper.vm.fileReferences = []
      wrapper.vm.showRestorePrompt = false
      wrapper.vm.savedProgress = null
    })

    describe('storeProgress', () => {
      it('guarda fileReferences en localStorage con timestamp', () => {
        const testRefs = [
          { title: 'Test Reference 1', authors: ['Author 1'] },
          { title: 'Test Reference 2', authors: ['Author 2'] }
        ]
        wrapper.vm.fileReferences = testRefs

        wrapper.vm.storeProgress()

        const saved = JSON.parse(localStorage.getItem('reference-upload-progress'))
        expect(saved).toBeTruthy()
        expect(saved.fileReferences).toHaveLength(2)
        expect(saved.fileReferences[0].title).toBe('Test Reference 1')
        expect(saved.timestamp).toBeDefined()
        expect(typeof saved.timestamp).toBe('number')
      })

      it('guarda array vacío cuando no hay referencias', () => {
        wrapper.vm.fileReferences = []
        wrapper.vm.storeProgress()

        const saved = JSON.parse(localStorage.getItem('reference-upload-progress'))
        expect(saved.fileReferences).toHaveLength(0)
      })
    })

    describe('checkIncompleteOperations', () => {
      it('muestra prompt de restauración si hay datos guardados < 24 horas', () => {
        const recentProgress = {
          fileReferences: [{ title: 'Saved Ref' }],
          timestamp: Date.now() - (1 * 60 * 60 * 1000) // 1 hora atrás
        }
        localStorage.setItem('reference-upload-progress', JSON.stringify(recentProgress))

        wrapper.vm.checkIncompleteOperations()

        expect(wrapper.vm.showRestorePrompt).toBe(true)
        expect(wrapper.vm.savedProgress).toBeTruthy()
        expect(wrapper.vm.savedProgress.fileReferences[0].title).toBe('Saved Ref')
      })

      it('elimina datos antiguos si han pasado > 24 horas', () => {
        const oldProgress = {
          fileReferences: [{ title: 'Old Ref' }],
          timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 horas atrás
        }
        localStorage.setItem('reference-upload-progress', JSON.stringify(oldProgress))

        wrapper.vm.checkIncompleteOperations()

        expect(wrapper.vm.showRestorePrompt).toBe(false)
        expect(localStorage.getItem('reference-upload-progress')).toBeNull()
      })

      it('no muestra prompt si no hay datos guardados', () => {
        wrapper.vm.checkIncompleteOperations()

        expect(wrapper.vm.showRestorePrompt).toBe(false)
        expect(wrapper.vm.savedProgress).toBeNull()
      })

      it('elimina datos corruptos y no muestra prompt', () => {
        localStorage.setItem('reference-upload-progress', 'invalid json {{{')

        wrapper.vm.checkIncompleteOperations()

        expect(wrapper.vm.showRestorePrompt).toBe(false)
        expect(localStorage.getItem('reference-upload-progress')).toBeNull()
      })

      it('maneja datos exactamente en el límite de 24 horas', () => {
        const borderlineProgress = {
          fileReferences: [{ title: 'Borderline Ref' }],
          timestamp: Date.now() - (24 * 60 * 60 * 1000) + 1000 // Justo antes de 24 horas
        }
        localStorage.setItem('reference-upload-progress', JSON.stringify(borderlineProgress))

        wrapper.vm.checkIncompleteOperations()

        expect(wrapper.vm.showRestorePrompt).toBe(true)
      })
    })

    describe('restoreSavedProgress', () => {
      it('restaura fileReferences desde savedProgress', () => {
        const savedRefs = [
          { title: 'Restored Ref 1', authors: ['Author A'] },
          { title: 'Restored Ref 2', authors: ['Author B'] }
        ]
        wrapper.vm.savedProgress = { fileReferences: savedRefs }
        wrapper.vm.showRestorePrompt = true

        wrapper.vm.restoreSavedProgress()

        expect(wrapper.vm.fileReferences).toHaveLength(2)
        expect(wrapper.vm.fileReferences[0].title).toBe('Restored Ref 1')
        expect(wrapper.vm.showRestorePrompt).toBe(false)
      })

      it('no hace nada si savedProgress es null', () => {
        wrapper.vm.savedProgress = null
        wrapper.vm.fileReferences = [{ title: 'Existing' }]

        wrapper.vm.restoreSavedProgress()

        expect(wrapper.vm.fileReferences).toHaveLength(1)
        expect(wrapper.vm.fileReferences[0].title).toBe('Existing')
      })

      it('no hace nada si savedProgress no tiene fileReferences', () => {
        wrapper.vm.savedProgress = { timestamp: Date.now() }
        wrapper.vm.fileReferences = []

        wrapper.vm.restoreSavedProgress()

        expect(wrapper.vm.fileReferences).toHaveLength(0)
      })
    })

    describe('clearSavedProgress', () => {
      it('elimina datos de localStorage y oculta prompt', () => {
        localStorage.setItem('reference-upload-progress', JSON.stringify({ test: true }))
        wrapper.vm.showRestorePrompt = true

        wrapper.vm.clearSavedProgress()

        expect(localStorage.getItem('reference-upload-progress')).toBeNull()
        expect(wrapper.vm.showRestorePrompt).toBe(false)
      })

      it('funciona incluso si no hay datos en localStorage', () => {
        wrapper.vm.showRestorePrompt = true

        wrapper.vm.clearSavedProgress()

        expect(wrapper.vm.showRestorePrompt).toBe(false)
      })
    })

    describe('generateOperationId', () => {
      it('genera un ID único con formato timestamp-random', () => {
        const id = wrapper.vm.generateOperationId()

        expect(id).toBeTruthy()
        expect(typeof id).toBe('string')
        expect(id).toMatch(/^\d+-[a-z0-9]+$/)
      })

      it('genera IDs diferentes en llamadas consecutivas', () => {
        const id1 = wrapper.vm.generateOperationId()
        const id2 = wrapper.vm.generateOperationId()

        expect(id1).not.toBe(id2)
      })

      it('el ID contiene un timestamp válido', () => {
        const beforeTime = Date.now()
        const id = wrapper.vm.generateOperationId()
        const afterTime = Date.now()

        const timestamp = parseInt(id.split('-')[0])
        expect(timestamp).toBeGreaterThanOrEqual(beforeTime)
        expect(timestamp).toBeLessThanOrEqual(afterTime)
      })
    })

    describe('saveCheckpoint', () => {
      it('guarda checkpoint con timestamp y datos adicionales', () => {
        const checkpointData = {
          completedBatches: 3,
          totalBatches: 10,
          failedItems: ['item1', 'item2']
        }

        wrapper.vm.saveCheckpoint(checkpointData)

        const saved = JSON.parse(localStorage.getItem('reference-upload-checkpoint'))
        expect(saved).toBeTruthy()
        expect(saved.completedBatches).toBe(3)
        expect(saved.totalBatches).toBe(10)
        expect(saved.failedItems).toEqual(['item1', 'item2'])
        expect(saved.timestamp).toBeDefined()
      })

      it('sobrescribe checkpoint anterior', () => {
        wrapper.vm.saveCheckpoint({ completedBatches: 1 })
        wrapper.vm.saveCheckpoint({ completedBatches: 5 })

        const saved = JSON.parse(localStorage.getItem('reference-upload-checkpoint'))
        expect(saved.completedBatches).toBe(5)
      })

      it('guarda checkpoint vacío con solo timestamp', () => {
        wrapper.vm.saveCheckpoint({})

        const saved = JSON.parse(localStorage.getItem('reference-upload-checkpoint'))
        expect(saved.timestamp).toBeDefined()
        expect(Object.keys(saved)).toHaveLength(1)
      })
    })

    describe('Flujo completo de persistencia', () => {
      it('guarda, detecta y restaura progreso correctamente', () => {
        // 1. Guardar progreso
        const originalRefs = [
          { title: 'Original Ref', authors: ['Test Author'] }
        ]
        wrapper.vm.fileReferences = originalRefs
        wrapper.vm.storeProgress()

        // 2. Simular recarga del componente (limpiar estado)
        wrapper.vm.fileReferences = []
        wrapper.vm.showRestorePrompt = false
        wrapper.vm.savedProgress = null

        // 3. Detectar operaciones incompletas
        wrapper.vm.checkIncompleteOperations()
        expect(wrapper.vm.showRestorePrompt).toBe(true)

        // 4. Restaurar progreso
        wrapper.vm.restoreSavedProgress()
        expect(wrapper.vm.fileReferences).toHaveLength(1)
        expect(wrapper.vm.fileReferences[0].title).toBe('Original Ref')
        expect(wrapper.vm.showRestorePrompt).toBe(false)
      })

      it('guarda, detecta y descarta progreso correctamente', () => {
        // 1. Guardar progreso
        wrapper.vm.fileReferences = [{ title: 'To Discard' }]
        wrapper.vm.storeProgress()

        // 2. Simular recarga
        wrapper.vm.fileReferences = []
        wrapper.vm.checkIncompleteOperations()
        expect(wrapper.vm.showRestorePrompt).toBe(true)

        // 3. Descartar progreso
        wrapper.vm.clearSavedProgress()
        expect(wrapper.vm.showRestorePrompt).toBe(false)
        expect(localStorage.getItem('reference-upload-progress')).toBeNull()
        expect(wrapper.vm.fileReferences).toHaveLength(0)
      })
    })
  })

  // ============================================
  // GRUPO 3: Tests de parsing RIS (watcher pre_references)
  // ============================================
  describe('RIS Parsing (watcher pre_references)', () => {
    beforeEach(() => {
      // Limpiar fileReferences antes de cada test
      wrapper.vm.fileReferences = []
      wrapper.vm.uploadProgress = ''
    })

    it('no procesa nada cuando el contenido está vacío', async () => {
      wrapper.vm.pre_references = ''
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fileReferences).toHaveLength(0)
    })

    it('no procesa nada cuando el contenido solo tiene espacios', async () => {
      wrapper.vm.pre_references = '   \n   '
      await wrapper.vm.$nextTick()
      expect(wrapper.vm.fileReferences).toHaveLength(0)
    })

    it('parsea una referencia RIS simple con campos básicos', async () => {
      const risContent = `TY  -JOUR
TI  -Test Title
AU  -Smith, John
PY  -2020
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences).toHaveLength(1)
      expect(wrapper.vm.fileReferences[0].type).toBe('JOUR')
      expect(wrapper.vm.fileReferences[0].title).toBe('Test Title')
      expect(wrapper.vm.fileReferences[0].authors).toContain('Smith, John')
      expect(wrapper.vm.fileReferences[0].publication_year).toBe('2020')
    })

    it('parsea múltiples referencias RIS', async () => {
      const risContent = `TY  -JOUR
TI  -First Article
AU  -Author One
PY  -2020
ER  -
TY  -BOOK
TI  -Second Book
AU  -Author Two
PY  -2019
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences).toHaveLength(2)
      expect(wrapper.vm.fileReferences[0].title).toBe('First Article')
      expect(wrapper.vm.fileReferences[0].type).toBe('JOUR')
      expect(wrapper.vm.fileReferences[1].title).toBe('Second Book')
      expect(wrapper.vm.fileReferences[1].type).toBe('BOOK')
    })

    it('maneja múltiples autores correctamente', async () => {
      const risContent = `TY  -JOUR
TI  -Multi Author Study
AU  -Smith, John
AU  -Jones, Alice
AU  -Brown, Bob
PY  -2021
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences).toHaveLength(1)
      expect(wrapper.vm.fileReferences[0].authors).toHaveLength(3)
      expect(wrapper.vm.fileReferences[0].authors).toContain('Smith, John')
      expect(wrapper.vm.fileReferences[0].authors).toContain('Jones, Alice')
      expect(wrapper.vm.fileReferences[0].authors).toContain('Brown, Bob')
    })

    it('usa TI como título principal cuando está presente', async () => {
      const risContent = `TY  -JOUR
TI  -Primary Title
T1  -Secondary Title
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].title).toBe('Primary Title')
      expect(wrapper.vm.fileReferences[0].title_1).toBe('Secondary Title')
    })

    it('usa T1 como título cuando TI no está presente', async () => {
      const risContent = `TY  -JOUR
T1  -Fallback Title
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].title).toBe('Fallback Title')
    })

    it('extrae el año de publicación correctamente de formato fecha', async () => {
      const risContent = `TY  -JOUR
TI  -Test
PY  -2020/03/15
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].publication_year).toBe('2020')
      expect(wrapper.vm.fileReferences[0].real_date).toBe('2020/03/15')
    })

    it('parsea campos opcionales: abstract, volume, pages', async () => {
      const risContent = `TY  -JOUR
TI  -Complete Reference
AU  -Author Name
PY  -2022
AB  -This is the abstract text
VL  -15
SP  -100
EP  -110
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].abstract).toBe('This is the abstract text')
      expect(wrapper.vm.fileReferences[0].volume_number).toBe('15')
      expect(wrapper.vm.fileReferences[0].start_page).toBe('100')
      expect(wrapper.vm.fileReferences[0].end_page).toBe('110')
    })

    it('parsea campos de identificadores: ISSN, DOI, URL', async () => {
      const risContent = `TY  -JOUR
TI  -Reference with IDs
SN  -1234-5678
DO  -10.1000/xyz123
UR  -https://example.com/article
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].isbn_issn).toBe('1234-5678')
      expect(wrapper.vm.fileReferences[0].doi).toBe('10.1000/xyz123')
      expect(wrapper.vm.fileReferences[0].url).toBe('https://example.com/article')
    })

    it('parsea campos de database y date', async () => {
      const risContent = `TY  -JOUR
TI  -Database Reference
DB  -PubMed
DA  -2022/05/01
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].database).toBe('PubMed')
      expect(wrapper.vm.fileReferences[0].date).toBe('2022/05/01')
    })

    it('maneja tags de autor alternativos (A1, A2, A3, A4)', async () => {
      const risContent = `TY  -JOUR
TI  -Alt Author Tags
A1  -Primary Author
A2  -Secondary Author
A3  -Tertiary Author
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].authors).toHaveLength(3)
      expect(wrapper.vm.fileReferences[0].authors).toContain('Primary Author')
      expect(wrapper.vm.fileReferences[0].authors).toContain('Secondary Author')
    })

    it('parsea campos definibles por usuario (U1-U5)', async () => {
      const risContent = `TY  -JOUR
TI  -Custom Fields
U1  -Custom Value 1
U2  -Custom Value 2
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences[0].user_definable).toHaveLength(2)
      expect(wrapper.vm.fileReferences[0].user_definable).toContain('Custom Value 1')
      expect(wrapper.vm.fileReferences[0].user_definable).toContain('Custom Value 2')
    })

    it('actualiza uploadProgress con el conteo de referencias', async () => {
      const risContent = `TY  -JOUR
TI  -Test
ER  -
TY  -JOUR
TI  -Test 2
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.uploadProgress).toBe('2 referencias procesadas localmente')
    })

    it('maneja líneas sin el formato correcto (sin separador "  -")', async () => {
      const risContent = `TY  -JOUR
TI  -Valid Title
Invalid line without separator
AU  -Valid Author
ER  -`
      wrapper.vm.pre_references = risContent
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences).toHaveLength(1)
      expect(wrapper.vm.fileReferences[0].title).toBe('Valid Title')
      expect(wrapper.vm.fileReferences[0].authors).toContain('Valid Author')
    })

    it('maneja saltos de línea Windows (CRLF) y Unix (LF)', async () => {
      const risContentWindows = "TY  -JOUR\r\nTI  -Windows Title\r\nER  -"
      wrapper.vm.pre_references = risContentWindows
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.fileReferences).toHaveLength(1)
      expect(wrapper.vm.fileReferences[0].title).toBe('Windows Title')
    })
  })

  // ============================================
  // GRUPO 4: Tests de API PubMed
  // ============================================
  describe('PubMed API', () => {
    beforeEach(() => {
      // Limpiar estado de PubMed
      wrapper.vm.pubmed_request = ''
      wrapper.vm.pubmed_requested = []
      wrapper.vm.pubmed_selected = []
      wrapper.vm.pubmedErrorImported = []
      wrapper.vm.pubmed_loading = false
      wrapper.vm.pubmed_error = false
      wrapper.vm.btnSearchPubMed = false
      wrapper.vm.btnCleanDisabled = true
      // Limpiar mocks
      jest.clearAllMocks()
    })

    describe('PubmedRequest', () => {
      it('inicializa el estado correctamente al iniciar búsqueda', () => {
        wrapper.vm.pubmed_request = '12345678'

        wrapper.vm.PubmedRequest()

        expect(wrapper.vm.btnSearchPubMed).toBe(true)
        expect(wrapper.vm.pubmed_loading).toBe(true)
        expect(wrapper.vm.pubmed_error).toBe(false)
        expect(wrapper.vm.pubmedErrorImported).toEqual([])
      })

      it('divide el input en líneas y llama processPubMedRequest', () => {
        const spy = jest.spyOn(wrapper.vm, 'processPubMedRequest')
        wrapper.vm.pubmed_request = '12345678\n87654321'

        wrapper.vm.PubmedRequest()

        expect(spy).toHaveBeenCalledWith(['12345678', '87654321'])
        spy.mockRestore()
      })
    })

    describe('processPubMedRequest', () => {
      it('filtra líneas vacías y no numéricas', async () => {
        const spy = jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: {
            result: {
              uids: ['12345678'],
              '12345678': {
                uid: '12345678',
                title: 'Test Article',
                authors: [{ name: 'Smith, John' }],
                pubdate: '2020 Jan',
                issn: '1234-5678'
              }
            }
          }
        })

        await wrapper.vm.processPubMedRequest(['12345678', '', 'invalid', '   ', '87654321'])

        // Solo debe llamar con IDs válidos (>= 7 dígitos numéricos)
        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledWith('12345678')
        expect(spy).toHaveBeenCalledWith('87654321')
        spy.mockRestore()
      })

      it('no hace nada si no hay IDs válidos', async () => {
        const spy = jest.spyOn(wrapper.vm, 'apiPubMed')

        await wrapper.vm.processPubMedRequest(['abc', '123', '', '  '])

        expect(spy).not.toHaveBeenCalled()
        expect(wrapper.vm.pubmed_loading).toBe(false)
        expect(wrapper.vm.btnSearchPubMed).toBe(false)
        expect(wrapper.vm.btnCleanDisabled).toBe(false)
        spy.mockRestore()
      })

      it('agrega IDs con error a pubmedErrorImported cuando status no es 200', async () => {
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 404,
          data: null
        })

        await wrapper.vm.processPubMedRequest(['12345678'])

        expect(wrapper.vm.pubmedErrorImported).toContain('12345678')
      })

      it('agrega IDs a pubmedErrorImported cuando respuesta tiene error', async () => {
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: { error: 'Not found' }
        })

        await wrapper.vm.processPubMedRequest(['12345678'])

        expect(wrapper.vm.pubmedErrorImported).toContain('12345678')
      })

      it('agrega IDs a pubmedErrorImported cuando no hay uids', async () => {
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: { result: { uids: [] } }
        })

        await wrapper.vm.processPubMedRequest(['12345678'])

        expect(wrapper.vm.pubmedErrorImported).toContain('12345678')
      })

      it('procesa respuesta válida llamando processPubmedData', async () => {
        const pubmedData = {
          uid: '12345678',
          title: 'Test Article',
          authors: [{ name: 'Smith, John' }],
          pubdate: '2020 Jan',
          issn: '1234-5678'
        }
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: {
            result: {
              uids: ['12345678'],
              '12345678': pubmedData
            }
          }
        })
        const processSpy = jest.spyOn(wrapper.vm, 'processPubmedData')

        await wrapper.vm.processPubMedRequest(['12345678'])

        expect(processSpy).toHaveBeenCalledWith(pubmedData)
        processSpy.mockRestore()
      })

      it('procesa en batches de 5 IDs', async () => {
        const spy = jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: {
            result: {
              uids: ['12345678'],
              '12345678': {
                uid: '12345678',
                title: 'Test',
                authors: [],
                pubdate: '2020',
                issn: ''
              }
            }
          }
        })

        const ids = [
          '1234567', '2345678', '3456789', '4567890', '5678901',
          '6789012', '7890123'
        ]
        await wrapper.vm.processPubMedRequest(ids)

        // 7 IDs deben procesarse en 2 batches (5 + 2)
        expect(spy).toHaveBeenCalledTimes(7)
        spy.mockRestore()
      })

      it('setea pubmed_loading a false al finalizar', async () => {
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: { result: { uids: [] } }
        })
        wrapper.vm.pubmed_loading = true

        await wrapper.vm.processPubMedRequest(['12345678'])

        expect(wrapper.vm.pubmed_loading).toBe(false)
        expect(wrapper.vm.btnCleanDisabled).toBe(false)
      })

      it('maneja errores de batch agregando todos los IDs a errores', async () => {
        jest.spyOn(wrapper.vm, 'apiPubMed').mockRejectedValue(new Error('Network error'))

        await wrapper.vm.processPubMedRequest(['1234567', '2345678', '3456789'])

        expect(wrapper.vm.pubmedErrorImported).toEqual(['1234567', '2345678', '3456789'])
      })
    })

    describe('apiPubMed', () => {
      it('hace GET a /api/pubmed/fetch con el ID', async () => {
        axios.get.mockResolvedValue({ status: 200, data: {} })

        await wrapper.vm.apiPubMed('12345678')

        expect(axios.get).toHaveBeenCalledWith('/api/pubmed/fetch?id=12345678')
      })

      it('propaga errores de axios', async () => {
        const error = new Error('Network error')
        axios.get.mockRejectedValue(error)

        await expect(wrapper.vm.apiPubMed('12345678')).rejects.toThrow('Network error')
      })
    })

    describe('processPubmedData', () => {
      it('crea referencia con datos correctos de PubMed', () => {
        const pubmedData = {
          uid: '12345678',
          title: 'Test Article Title',
          authors: [
            { name: 'Smith, John' },
            { name: 'Jones, Alice' }
          ],
          pubdate: '2020 Jan 15',
          issn: '1234-5678'
        }

        wrapper.vm.processPubmedData(pubmedData)

        expect(wrapper.vm.pubmed_requested).toHaveLength(1)
        const ref = wrapper.vm.pubmed_requested[0]
        expect(ref.title).toBe('Test Article Title')
        expect(ref.database).toBe('PubMed')
        expect(ref.authors).toEqual(['Smith, John', 'Jones, Alice'])
        expect(ref.publication_year).toBe('2020')
        expect(ref.isbn_issn).toBe('1234-5678')
        expect(ref.uid).toBe('12345678')
        expect(ref.disabled).toBe(false)
      })

      it('extrae el año correctamente de diferentes formatos de pubdate', () => {
        wrapper.vm.processPubmedData({
          uid: '1',
          title: 'Test',
          authors: [],
          pubdate: '2019 Mar-Apr',
          issn: ''
        })

        expect(wrapper.vm.pubmed_requested[0].publication_year).toBe('2019')
      })

      it('marca como disabled si el uid ya existe en references', async () => {
        // Crear nuevo wrapper con referencias existentes
        const wrapperWithRefs = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [{ id: 1, uid: '12345678', title: 'Existing' }],
            episteResponse: [],
            lists: [],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        wrapperWithRefs.vm.processPubmedData({
          uid: '12345678',
          title: 'Duplicate',
          authors: [],
          pubdate: '2020',
          issn: ''
        })

        expect(wrapperWithRefs.vm.pubmed_requested[0].disabled).toBe(true)
      })

      it('no marca como disabled si el uid no existe en references', async () => {
        // Crear nuevo wrapper con referencias existentes diferentes
        const wrapperWithRefs = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [{ id: 1, uid: '99999999', title: 'Other' }],
            episteResponse: [],
            lists: [],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        wrapperWithRefs.vm.processPubmedData({
          uid: '12345678',
          title: 'New Reference',
          authors: [],
          pubdate: '2020',
          issn: ''
        })

        expect(wrapperWithRefs.vm.pubmed_requested[0].disabled).toBe(false)
      })

      it('incluye organization y project_id de la ruta', () => {
        wrapper.vm.processPubmedData({
          uid: '12345678',
          title: 'Test',
          authors: [],
          pubdate: '2020',
          issn: ''
        })

        const ref = wrapper.vm.pubmed_requested[0]
        expect(ref.organization).toBe('test-org-456')
        expect(ref.project_id).toBe('test-project-123')
      })
    })

    describe('PubmedRequestClean', () => {
      it('limpia todo el estado de PubMed', () => {
        // Setear estado con datos
        wrapper.vm.btnSearchPubMed = true
        wrapper.vm.pubmed_request = '12345678'
        wrapper.vm.pubmed_requested = [{ title: 'Test' }]
        wrapper.vm.pubmed_selected = [0]
        wrapper.vm.pubmedErrorImported = ['error1']
        wrapper.vm.pubmed_loading = true
        wrapper.vm.pubmed_error = true

        wrapper.vm.PubmedRequestClean()

        expect(wrapper.vm.btnSearchPubMed).toBe(false)
        expect(wrapper.vm.pubmed_request).toBe('')
        expect(wrapper.vm.pubmed_requested).toEqual([])
        expect(wrapper.vm.pubmed_selected).toEqual([])
        expect(wrapper.vm.pubmedErrorImported).toEqual([])
        expect(wrapper.vm.pubmed_loading).toBe(false)
        expect(wrapper.vm.pubmed_error).toBe(false)
      })
    })

    describe('importReferences', () => {
      beforeEach(() => {
        axios.post.mockReset()
      })

      it('no hace nada si no hay referencias seleccionadas', async () => {
        wrapper.vm.pubmed_selected = []

        await wrapper.vm.importReferences()

        expect(axios.post).not.toHaveBeenCalled()
      })

      it('emite statusLoadReferences true al iniciar', async () => {
        wrapper.vm.pubmed_requested = [
          { title: 'Test', authors: [], disabled: false }
        ]
        wrapper.vm.pubmed_selected = [0]
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        expect(wrapper.emitted('statusLoadReferences')[0]).toEqual([true])
      })

      it('hace POST a /api/isoqf_references/batch-import con datos correctos', async () => {
        wrapper.vm.pubmed_requested = [
          { title: 'Ref 1', authors: ['Author 1'], disabled: false, uid: '123' },
          { title: 'Ref 2', authors: ['Author 2'], disabled: true, uid: '456' }
        ]
        wrapper.vm.pubmed_selected = [0, 1]
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        expect(axios.post).toHaveBeenCalledWith(
          '/api/isoqf_references/batch-import',
          expect.objectContaining({
            references: expect.arrayContaining([
              expect.objectContaining({ title: 'Ref 1', uid: '123' }),
              expect.objectContaining({ title: 'Ref 2', uid: '456' })
            ]),
            organization: 'test-org-456',
            project_id: 'test-project-123',
            operation_id: expect.any(String)
          })
        )
      })

      it('elimina propiedad disabled de las referencias antes de enviar', async () => {
        wrapper.vm.pubmed_requested = [
          { title: 'Test', disabled: true }
        ]
        wrapper.vm.pubmed_selected = [0]
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        const sentRefs = axios.post.mock.calls[0][1].references
        expect(sentRefs[0]).not.toHaveProperty('disabled')
      })

      it('limpia el formulario después de importar exitosamente', async () => {
        wrapper.vm.pubmed_request = '12345678'
        wrapper.vm.pubmed_requested = [{ title: 'Test', disabled: false }]
        wrapper.vm.pubmed_selected = [0]
        wrapper.vm.pubmedErrorImported = ['error']
        wrapper.vm.btnSearchPubMed = true
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        expect(wrapper.vm.pubmed_request).toBe('')
        expect(wrapper.vm.pubmed_requested).toEqual([])
        expect(wrapper.vm.pubmed_selected).toEqual([])
        expect(wrapper.vm.pubmedErrorImported).toEqual([])
        expect(wrapper.vm.btnSearchPubMed).toBe(false)
      })

      it('emite CallGetReferences después de importar', async () => {
        wrapper.vm.pubmed_requested = [{ title: 'Test', disabled: false }]
        wrapper.vm.pubmed_selected = [0]
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
        expect(wrapper.emitted('CallGetReferences')[0]).toEqual([false])
      })

      it('emite statusLoadReferences false al finalizar (éxito)', async () => {
        wrapper.vm.pubmed_requested = [{ title: 'Test', disabled: false }]
        wrapper.vm.pubmed_selected = [0]
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        const emissions = wrapper.emitted('statusLoadReferences')
        expect(emissions[emissions.length - 1]).toEqual([false])
      })

      it('emite statusLoadReferences false al finalizar (error)', async () => {
        wrapper.vm.pubmed_requested = [{ title: 'Test', disabled: false }]
        wrapper.vm.pubmed_selected = [0]
        axios.post.mockRejectedValue(new Error('Network error'))

        await wrapper.vm.importReferences()

        const emissions = wrapper.emitted('statusLoadReferences')
        expect(emissions[emissions.length - 1]).toEqual([false])
      })

      it('solo importa referencias seleccionadas por índice', async () => {
        wrapper.vm.pubmed_requested = [
          { title: 'Ref 0', disabled: false },
          { title: 'Ref 1', disabled: false },
          { title: 'Ref 2', disabled: false }
        ]
        wrapper.vm.pubmed_selected = [0, 2] // Solo índices 0 y 2
        axios.post.mockResolvedValue({ data: { references: [] } })

        await wrapper.vm.importReferences()

        const sentRefs = axios.post.mock.calls[0][1].references
        expect(sentRefs).toHaveLength(2)
        expect(sentRefs[0].title).toBe('Ref 0')
        expect(sentRefs[1].title).toBe('Ref 2')
      })
    })

    describe('Flujo completo PubMed', () => {
      it('búsqueda exitosa: input → buscar → seleccionar → importar', async () => {
        // 1. Configurar mock de apiPubMed
        jest.spyOn(wrapper.vm, 'apiPubMed').mockResolvedValue({
          status: 200,
          data: {
            result: {
              uids: ['12345678'],
              '12345678': {
                uid: '12345678',
                title: 'Test Article',
                authors: [{ name: 'Smith, John' }],
                pubdate: '2020 Jan',
                issn: '1234-5678'
              }
            }
          }
        })
        axios.post.mockResolvedValue({ data: { references: [{ id: 1 }] } })

        // 2. Ingresar ID y buscar
        wrapper.vm.pubmed_request = '12345678'
        wrapper.vm.PubmedRequest()
        await wrapper.vm.$nextTick()

        // Esperar a que termine processPubMedRequest
        await new Promise(resolve => setTimeout(resolve, 100))

        // 3. Verificar que se encontró la referencia
        expect(wrapper.vm.pubmed_requested).toHaveLength(1)
        expect(wrapper.vm.pubmed_requested[0].title).toBe('Test Article')

        // 4. Seleccionar la referencia
        wrapper.vm.pubmed_selected = [0]

        // 5. Importar
        await wrapper.vm.importReferences()

        // 6. Verificar que se limpió el estado
        expect(wrapper.vm.pubmed_requested).toEqual([])
        expect(wrapper.vm.pubmed_selected).toEqual([])
        expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
      })
    })
  })

  // ============================================
  // GRUPO 5: Tests de eliminación de referencias
  // ============================================
  describe('Reference Deletion', () => {
    beforeEach(() => {
      wrapper.vm.appearMsgRemoveReferences = false
      wrapper.vm.disableBtnRemoveAllRefs = false
      jest.clearAllMocks()
    })

    describe('findRelatedFindings', () => {
      it('retorna undefined si no se proporciona refId', () => {
        const result = wrapper.vm.findRelatedFindings()
        expect(result).toBeUndefined()
      })

      it('retorna undefined si refId es null', () => {
        const result = wrapper.vm.findRelatedFindings(null)
        expect(result).toBeUndefined()
      })

      it('retorna "No review findings will be affected." si no hay hallazgos relacionados', () => {
        // Crear wrapper con lists vacías
        const wrapperWithLists = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [{ id: 1, title: 'Test Ref' }],
            episteResponse: [],
            lists: [],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        const result = wrapperWithLists.vm.findRelatedFindings(1)
        expect(result).toBe('No review findings will be affected.')
      })

      it('retorna hallazgos afectados cuando hay coincidencias', () => {
        const wrapperWithLists = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [{ id: 1, title: 'Test Ref' }],
            episteResponse: [],
            lists: [
              { cnt: 1, raw_ref: [{ id: 1 }] },
              { cnt: 2, raw_ref: [{ id: 2 }] },
              { cnt: 3, raw_ref: [{ id: 1 }] }
            ],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        const result = wrapperWithLists.vm.findRelatedFindings(1)
        expect(result).toBe('The findings affected are: #1, #3')
      })

      it('usa sort si cnt no está disponible', () => {
        const wrapperWithLists = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [],
            episteResponse: [],
            lists: [
              { sort: 5, raw_ref: [{ id: 10 }] }
            ],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        const result = wrapperWithLists.vm.findRelatedFindings(10)
        expect(result).toBe('The findings affected are: #5')
      })

      it('retorna un solo hallazgo correctamente', () => {
        const wrapperWithLists = shallowMount(UploadReferences, {
          localVue,
          mocks: {
            $route: mockRoute,
            $http: { get: jest.fn(), post: jest.fn() }
          },
          propsData: {
            checkPermissions: true,
            loadReferences: false,
            references: [],
            episteResponse: [],
            lists: [
              { cnt: 7, raw_ref: [{ id: 42 }] }
            ],
            charsOfStudies: {},
            methodologicalTableRefs: {}
          }
        })

        const result = wrapperWithLists.vm.findRelatedFindings(42)
        expect(result).toBe('The findings affected are: #7')
      })
    })

    describe('confirmRemoveAllReferences', () => {
      it('muestra mensaje de confirmación y deshabilita botón', () => {
        const mockEvent = { preventDefault: jest.fn() }

        wrapper.vm.confirmRemoveAllReferences(mockEvent)

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(wrapper.vm.appearMsgRemoveReferences).toBe(true)
        expect(wrapper.vm.disableBtnRemoveAllRefs).toBe(true)
      })

      it('llama preventDefault en el evento', () => {
        const mockEvent = { preventDefault: jest.fn() }

        wrapper.vm.confirmRemoveAllReferences(mockEvent)

        expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1)
      })
    })

    describe('removeAllReferences', () => {
      it('hace POST a /api/isoqf_references/batch-delete con delete_all', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.removeAllReferences()

        expect(axios.post).toHaveBeenCalledWith(
          '/api/isoqf_references/batch-delete',
          {
            delete_all: true,
            project_id: 'test-project-123',
            organization: 'test-org-456',
            confirmation: 'DELETE_ALL_REFERENCES_test-project-123'
          }
        )
      })

      it('emite loadReferences, CallGetReferences y CallGetProject al éxito', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.removeAllReferences()
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('loadReferences')).toBeTruthy()
        expect(wrapper.emitted('loadReferences')[0]).toEqual([true])
        expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
        expect(wrapper.emitted('CallGetProject')).toBeTruthy()
      })

      it('oculta mensaje de confirmación al éxito', async () => {
        wrapper.vm.appearMsgRemoveReferences = true
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.removeAllReferences()
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.appearMsgRemoveReferences).toBe(false)
      })

      it('rehabilita botón en caso de error', async () => {
        wrapper.vm.disableBtnRemoveAllRefs = true
        axios.post.mockRejectedValue(new Error('Network error'))

        await wrapper.vm.removeAllReferences()
        await wrapper.vm.$nextTick()

        expect(wrapper.vm.disableBtnRemoveAllRefs).toBe(false)
      })

      it('incluye token de confirmación con project_id', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.removeAllReferences()

        const callArgs = axios.post.mock.calls[0][1]
        expect(callArgs.confirmation).toBe('DELETE_ALL_REFERENCES_test-project-123')
      })
    })

    describe('confirmRemoveReferenceById', () => {
      it('no hace nada si refId es undefined', async () => {
        await wrapper.vm.confirmRemoveReferenceById()

        expect(axios.post).not.toHaveBeenCalled()
      })

      it('no hace nada si refId es null', async () => {
        await wrapper.vm.confirmRemoveReferenceById(null)

        expect(axios.post).not.toHaveBeenCalled()
      })

      it('hace POST a /api/isoqf_references/batch-delete con reference_ids', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.confirmRemoveReferenceById(123)

        expect(axios.post).toHaveBeenCalledWith(
          '/api/isoqf_references/batch-delete',
          {
            reference_ids: [123],
            project_id: 'test-project-123',
            organization: 'test-org-456'
          }
        )
      })

      it('envía reference_ids como array con un elemento', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.confirmRemoveReferenceById(456)

        const callArgs = axios.post.mock.calls[0][1]
        expect(Array.isArray(callArgs.reference_ids)).toBe(true)
        expect(callArgs.reference_ids).toHaveLength(1)
        expect(callArgs.reference_ids[0]).toBe(456)
      })

      it('emite CallGetReferences y CallGetProject al éxito', async () => {
        axios.post.mockResolvedValue({ data: {} })

        await wrapper.vm.confirmRemoveReferenceById(123)
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('CallGetReferences')).toBeTruthy()
        expect(wrapper.emitted('CallGetReferences')[0]).toEqual([false])
        expect(wrapper.emitted('CallGetProject')).toBeTruthy()
      })

      it('llama openModalReferencesSingle(false) al éxito', async () => {
        axios.post.mockResolvedValue({ data: {} })
        const spy = jest.spyOn(wrapper.vm, 'openModalReferencesSingle')

        await wrapper.vm.confirmRemoveReferenceById(123)
        await wrapper.vm.$nextTick()

        expect(spy).toHaveBeenCalledWith(false)
        spy.mockRestore()
      })

      it('maneja errores sin romper la aplicación', async () => {
        axios.post.mockRejectedValue(new Error('Network error'))

        // No debería lanzar error - la función maneja el error internamente
        wrapper.vm.confirmRemoveReferenceById(123)
        await wrapper.vm.$nextTick()

        // El error se loguea pero no rompe la aplicación
        expect(axios.post).toHaveBeenCalled()
      })
    })

    describe('Flujo completo de eliminación', () => {
      it('eliminar todas: confirmar → aceptar → API call → limpiar estado', async () => {
        const mockEvent = { preventDefault: jest.fn() }
        axios.post.mockResolvedValue({ data: {} })

        // 1. Mostrar confirmación
        wrapper.vm.confirmRemoveAllReferences(mockEvent)
        expect(wrapper.vm.appearMsgRemoveReferences).toBe(true)

        // 2. Confirmar eliminación
        await wrapper.vm.removeAllReferences()
        await wrapper.vm.$nextTick()

        // 3. Verificar que se limpió el estado
        expect(wrapper.vm.appearMsgRemoveReferences).toBe(false)
        expect(wrapper.emitted('CallGetProject')).toBeTruthy()
      })

      it('cancelar eliminación mantiene estado', () => {
        const mockEvent = { preventDefault: jest.fn() }

        // 1. Mostrar confirmación
        wrapper.vm.confirmRemoveAllReferences(mockEvent)
        expect(wrapper.vm.appearMsgRemoveReferences).toBe(true)

        // 2. Cancelar (simular clic en No)
        wrapper.vm.appearMsgRemoveReferences = false

        // 3. Verificar que no se llamó a la API
        expect(axios.post).not.toHaveBeenCalled()
      })
    })
  })
})
