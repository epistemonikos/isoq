import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  releaseRef: jest.fn(),
  // El registro de candados que sostiene ESTA pestaña. Lo lee `refLockStateMixin` para
  // descartarlos del sondeo, así que su ausencia no rompe ningún test —muere en una
  // promesa rechazada sin manejar— pero deja el refresco al liberarse un candado sin
  // ejercitar. Declararlo es lo que hace que el mock represente al servicio real.
  refLocks: new Map(),
  // getList() cierra sondeando los ref-locks. El mock lo declara para que el spec
  // represente al componente real; que su ausencia ya NO rompa el scroll lo
  // garantiza el `.catch` de fetchAndUpdateRefLocks, no este mock.
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

const error500 = () => Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } }, config: { method: 'get' } })

function createWrapper ({ owner = true } = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const getExtractedData = jest.fn()
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: owner ? 'org1' : 'otra', id: 42 } } },
      $notify
    },
    stubs,
    methods: {
      getList: jest.fn(), getProject: jest.fn(), getAllReferences: jest.fn(), getFinding: jest.fn(),
      getCharsOfStudies: jest.fn(), getMethAssessments: jest.fn(), getExtractedData
    }
  })
  return { wrapper, $notify, getExtractedData }
}

async function conFindingSinTabla (wrapper) {
  await wrapper.setData({
    list: { ...wrapper.vm.list, id: 'list1', organization: 'org1', references: ['R1'] },
    findings: { id: 'f1' },
    extracted_data: { id: null, fields: [], items: [], fieldsObj: [] },
    project: { ...wrapper.vm.project, id: 'p1', organization: 'org1' }
  })
  Api.get.mockClear()
  Api.post.mockClear()
}

// Si la tabla de datos extraídos no se creó al crear el finding (o se perdió), el finding
// quedaba sin ella para siempre: nada la volvía a crear, y cada fila que se editaba apuntaba a
// un documento `null`. Ahora se crea al abrir el finding, preguntándole antes al servidor.
describe('editList — la tabla de datos extraídos que falta se crea al abrir', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    Api.post.mockResolvedValue({ data: { id: 'ed-nuevo' } })
  })

  it('si el servidor confirma que no existe, la crea y la vuelve a cargar', async () => {
    const { wrapper, getExtractedData } = createWrapper()
    await conFindingSinTabla(wrapper)
    await wrapper.vm.ensureExtractedData()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/isoqf_extracted_data', { finding_id: 'f1' }, { networkOnly: true })
    expect(Api.post).toHaveBeenCalledTimes(1)
    const [url, body] = Api.post.mock.calls[0]
    expect(url).toBe('/isoqf_extracted_data')
    expect(body.finding_id).toBe('f1')
    expect(body.organization).toBe('org1')
    expect(body.fields.map(f => f.key)).toEqual(['ref_id', 'authors', 'column_0'])
    expect(getExtractedData).toHaveBeenCalledWith(true)
    wrapper.destroy()
  })

  it('si ya existe en el servidor (la lista embebida venía vieja), no crea otra', async () => {
    const { wrapper, getExtractedData } = createWrapper()
    await conFindingSinTabla(wrapper)
    Api.get.mockResolvedValueOnce({ data: [{ id: 'ed-existente' }] })
    await wrapper.vm.ensureExtractedData()
    await flushPromises()
    expect(Api.post).not.toHaveBeenCalled()
    expect(getExtractedData).toHaveBeenCalledWith(true)
    wrapper.destroy()
  })

  it('si no se puede comprobar, no crea nada y avisa', async () => {
    const { wrapper, $notify } = createWrapper()
    await conFindingSinTabla(wrapper)
    Api.get.mockRejectedValueOnce(error500())
    await wrapper.vm.ensureExtractedData()
    await flushPromises()
    expect(Api.post).not.toHaveBeenCalled()
    expect($notify.warning).toHaveBeenCalledWith('notifications.extracted_data_missing')
    wrapper.destroy()
  })

  it('quien sólo puede ver no escribe nada', async () => {
    const { wrapper } = createWrapper({ owner: false })
    await conFindingSinTabla(wrapper)
    await wrapper.setData({ project: { ...wrapper.vm.project, can_write: [], can_read: [42] } })
    await wrapper.vm.ensureExtractedData()
    await flushPromises()
    expect(Api.get).not.toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('si la tabla ya vino, no pregunta nada', async () => {
    const { wrapper } = createWrapper()
    await conFindingSinTabla(wrapper)
    await wrapper.setData({ extracted_data: { id: 'ed1', fields: [], items: [], fieldsObj: [] } })
    await wrapper.vm.ensureExtractedData()
    await flushPromises()
    expect(Api.get).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('dos llamadas seguidas no crean dos tablas', async () => {
    const { wrapper } = createWrapper()
    await conFindingSinTabla(wrapper)
    await Promise.all([wrapper.vm.ensureExtractedData(), wrapper.vm.ensureExtractedData()])
    await flushPromises()
    expect(Api.post).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
