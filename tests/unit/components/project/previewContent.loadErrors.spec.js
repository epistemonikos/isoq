import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentSoQf from '@/components/previewContent/previewContentSoQf.vue'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({ get: jest.fn(() => Promise.resolve({ data: [] })) }))
jest.mock('@/services/wordExportService', () => ({ exportToWord: jest.fn().mockResolvedValue(undefined), getWordExportService: jest.fn(() => ({})) }))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } }, config: { method: 'get' } })

const soqfMocks = {
  $t: (key) => key,
  $route: { name: 'previewContentSoQf', params: { org_id: 'org1', isoqf_id: 'p1', token: 'public' } },
  $router: { push: jest.fn() }
}
const worksheetMocks = {
  $t: (key) => key,
  $route: { params: { id: 'l1', projectId: 'p1', token: 'public' } },
  $router: { push: jest.fn() }
}

async function montar (component, mocks) {
  const wrapper = shallowMount(component, { localVue, mocks })
  for (let i = 0; i < 4; i++) await flushPromises()
  return wrapper
}

const aviso = (wrapper) => wrapper.findComponent({ name: 'LoadErrorAlert' })

// Quien abre un link compartido o público veía tablas vacías si una carga fallaba, y lo
// que exportaba salía incompleto. Mismo aviso que el proyecto: nombra lo que faltó.
describe('previewContentSoQf — lo que no se pudo cargar se dice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  it.each([
    ['categories', 'getListCategories', []],
    ['references', 'getReferences', [false]],
    ['lists', 'getLists', []],
    ['findings', 'getFinding', ['org1', 'l1']]
  ])('%s', async (part, method, args) => {
    const wrapper = await montar(previewContentSoQf, soqfMocks)
    Api.get.mockImplementation(() => Promise.reject(error500()))
    await wrapper.vm[method](...args)
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(aviso(wrapper).props('parts')).toContain(part)
    wrapper.destroy()
  })

  it('Reintentar vuelve a pedir sólo lo que falló', async () => {
    const wrapper = await montar(previewContentSoQf, soqfMocks)
    await wrapper.setData({ loadErrors: { ...wrapper.vm.loadErrors, references: true } })
    const refs = jest.spyOn(wrapper.vm, 'getReferences').mockResolvedValue()
    const cats = jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    aviso(wrapper).vm.$emit('retry')
    await flushPromises()
    expect(refs).toHaveBeenCalled()
    expect(cats).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('previewContentWorksheet — lo que no se pudo cargar se dice', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockImplementation(() => Promise.resolve({ data: [] }))
  })

  it.each([
    ['references', 'getAllReferences'],
    ['evidence', 'getStageOneData'],
    ['extracted', 'getExtractedData'],
    ['characteristics', 'getCharsOfStudies'],
    ['assessments', 'getMethAssessments']
  ])('%s', async (part, method) => {
    const wrapper = await montar(previewContentWorksheet, worksheetMocks)
    await wrapper.setData({
      list: { ...wrapper.vm.list, id: 'l1', project_id: 'p1', references: [] },
      project: { ...(wrapper.vm.project || {}), id: 'p1' }
    })
    // `findings` no está en `data`: getStageOneData lo asigna sobre la instancia antes de
    // pedir los datos extraídos. Se imita ese orden.
    wrapper.vm.findings = { id: 'f1' }
    Api.get.mockImplementation(() => Promise.reject(error500()))
    await wrapper.vm[method]()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(aviso(wrapper).props('parts')).toContain(part)
    wrapper.destroy()
  })

  // Antes el comentario decía que caer a la numeración sin grupos «no debe pasar sin
  // reportarse», y lo único que hacía era `printErrors`: pasaba sin reportarse.
  it('los grupos que no cargaron se avisan, aunque el finding sí cargue', async () => {
    const wrapper = await montar(previewContentWorksheet, worksheetMocks)
    await wrapper.setData({ project: { ...(wrapper.vm.project || {}), id: 'p1' } })
    Api.get.mockImplementation((url) => /list_categories/.test(url)
      ? Promise.reject(error500())
      : Promise.resolve({ data: [{ id: 'l1', project_id: 'p1', references: [], category: null, sort: 1 }] }))
    await wrapper.vm.getList()
    for (let i = 0; i < 4; i++) await flushPromises()
    expect(aviso(wrapper).props('parts')).toContain('categories')
    wrapper.destroy()
  })

  it('el finding que no cargó', async () => {
    const wrapper = await montar(previewContentWorksheet, worksheetMocks)
    await wrapper.setData({ project: { ...(wrapper.vm.project || {}), id: 'p1' } })
    Api.get.mockImplementation(() => Promise.reject(error500()))
    await wrapper.vm.getList()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(aviso(wrapper).props('parts')).toContain('finding')
    wrapper.destroy()
  })
})
