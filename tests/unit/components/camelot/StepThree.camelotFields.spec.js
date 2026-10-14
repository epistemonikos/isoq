// Las 12 columnas CAMELOT desaparecían del Paso 3 al crear la primera columna propia.
//
// Medido en la base: el único documento de características de un proyecto CAMELOT tenía
// `fields: ['ref_id', 'authors', 'column_98f669e1…']` — los dos campos de sistema que
// siembra `ensureTableDocument` más la columna creada, y cero claves CAMELOT.
//
// El catálogo CAMELOT nunca se persistía: se inyectaba en memoria al cargar, pero sólo
// cuando `fields` venía VACÍO. En cuanto nace el documento esa condición no se cumple
// nunca más, y como `availableTableFields` deriva las columnas exclusivamente de
// `charsData.fields`, las 12 columnas se iban de la pantalla y de la base.
//
// `charsData` entra desde el servidor por CUATRO puertas distintas, y la reconciliación
// tiene que estar en las cuatro: bastaba con que faltara en la del modal de columnas para
// que las columnas se fueran en el mismo instante en que se creaba la primera.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

const CATALOGO = [
  { key: 'research_extractedData', label: 'Extracted data' },
  { key: 'research_comments', label: 'Comments' },
  { key: 'context_extractedData', label: 'Extracted data' },
  { key: 'context_comments', label: 'Comments' }
]

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    computed: {
      camelot () {
        return {
          fields: [
            { key: 'research_extractedData', label: 'Extracted data' },
            { key: 'research_comments', label: 'Comments' },
            { key: 'context_extractedData', label: 'Extracted data' },
            { key: 'context_comments', label: 'Comments' }
          ],
          categories: [
            {
              key: 'research',
              label: 'Research question',
              options: [
                { key: 'research_extractedData', label: 'Extracted data' },
                { key: 'research_comments', label: 'Comments' }
              ]
            },
            {
              key: 'context',
              label: 'Context',
              options: [
                { key: 'context_extractedData', label: 'Extracted data' },
                { key: 'context_comments', label: 'Comments' }
              ]
            }
          ]
        }
      }
    },
    methods: {},
    data: () => ({})
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Lo que el servidor devuelve para el documento recién nacido: los de sistema y la columna
// que se acaba de crear. Ninguna clave CAMELOT.
const DOC_RECIEN_NACIDO = {
  id: 'char1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_98f669e17fe1493c5055fdf8', label: 'Mi columna' }
  ],
  items: []
}

const clavesCamelot = wrapper =>
  wrapper.vm.charsData.fields.map(f => f.key).filter(k => k.endsWith('_extractedData') || k.endsWith('_comments'))

function createWrapper () {
  return shallowMount(StepThree, {
    localVue,
    propsData: { references: [], type: 'isoqf_characteristics' },
    mocks: { $t: key => key, $route: { params: { id: 'proj1', org_id: 'org1' } } }
  })
}

describe('StepThree — el catálogo CAMELOT sobrevive al nacimiento del documento', () => {
  let wrapper

  beforeEach(() => jest.clearAllMocks())
  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('al cargar un documento que ya nació sin las claves CAMELOT, las repone', async () => {
    Api.get.mockResolvedValue({ data: [DOC_RECIEN_NACIDO] })
    wrapper = createWrapper()
    wrapper.vm.loadCharacteristicsData()
    await flushPromises()

    expect(clavesCamelot(wrapper)).toEqual(CATALOGO.map(f => f.key))
    // Y la columna que el usuario creó no se pierde en el camino.
    expect(wrapper.vm.charsData.fields.map(f => f.key)).toContain('column_98f669e17fe1493c5055fdf8')
  })

  it('sigue poniendo el catálogo cuando no hay documento todavía', async () => {
    Api.get.mockResolvedValue({ data: [] })
    wrapper = createWrapper()
    wrapper.vm.loadCharacteristicsData()
    await flushPromises()

    expect(clavesCamelot(wrapper)).toEqual(CATALOGO.map(f => f.key))
  })

  // La puerta del modal de columnas: es la que producía el síntoma reportado, porque el
  // alta reemplaza `charsData` con la respuesta del servidor en el acto.
  it('crear una columna no se lleva puestas las columnas CAMELOT', async () => {
    Api.get.mockResolvedValue({ data: [] })
    wrapper = createWrapper()
    wrapper.vm.loadCharacteristicsData()
    await flushPromises()

    wrapper.vm.applyServerChars(DOC_RECIEN_NACIDO)

    expect(clavesCamelot(wrapper)).toEqual(CATALOGO.map(f => f.key))
  })

  it('guardar una referencia tampoco', () => {
    wrapper = createWrapper()

    wrapper.vm.handleReferenceSaved({ ...DOC_RECIEN_NACIDO, items: [{ ref_id: 'R1' }] })

    expect(clavesCamelot(wrapper)).toEqual(CATALOGO.map(f => f.key))
  })

  it('ni el refresco que llega desde otra pestaña', () => {
    wrapper = createWrapper()

    wrapper.vm.$root.$emit('characteristics-updated', DOC_RECIEN_NACIDO)

    expect(clavesCamelot(wrapper)).toEqual(CATALOGO.map(f => f.key))
  })

  it('las columnas CAMELOT repuestas llegan a la tabla', async () => {
    Api.get.mockResolvedValue({ data: [DOC_RECIEN_NACIDO] })
    wrapper = createWrapper()
    wrapper.vm.loadCharacteristicsData()
    await flushPromises()

    const claves = wrapper.vm.availableTableFields.map(f => f.key)
    expect(claves).toContain('research_extractedData')
    expect(claves).toContain('context_extractedData')
    expect(claves).toContain('column_98f669e17fe1493c5055fdf8')
  })

  // El documento sano no se toca: reconciliar agrega, nunca reordena ni duplica.
  it('no duplica ni reordena lo que ya estaba completo', () => {
    wrapper = createWrapper()
    const completo = {
      id: 'char1',
      fields: [
        { key: 'ref_id', label: 'ID' },
        { key: 'context_extractedData', label: 'Extracted data' },
        { key: 'context_comments', label: 'Comments' },
        { key: 'research_extractedData', label: 'Extracted data' },
        { key: 'research_comments', label: 'Comments' },
        { key: 'column_abc', label: 'Mia' }
      ],
      items: []
    }

    wrapper.vm.applyServerChars(completo)

    expect(wrapper.vm.charsData.fields.map(f => f.key)).toEqual(completo.fields.map(f => f.key))
  })
})
