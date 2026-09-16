// El import de tabla pregunta quién está editando antes de arrasar.
//
// `saveImportedData()` dispara `DELETE /<coleccion>/<id>` + `POST /<coleccion>/` — el
// documento completo. Exige el lock de PROYECTO, así que si otra persona lo tiene el
// servidor rechaza. Pero no mira los ref locks: quien esté editando un estudio del Paso 3
// o 4 sostiene un lock por `ref_id`, y el import le pasa por encima sin conflicto, sin
// aviso, y con las filas ya borradas por el DELETE.
//
// Backend decidió no cerrarlo del lado servidor (un import destructivo que falla porque
// alguien tiene una fila abierta es una lotería) y sugirió que preguntemos antes con
// `GET /api/lock/<project_id>/refs`. Esta es nuestra mitad: avisar, y dejar que la persona
// decida.
//
// Todos estos tests son de CAMINO, no de valor: comprueban que el dato llegue a la
// decisión. Es lo único que un test de este lado puede garantizar sobre un campo de
// respuesta — el servidor puede instrumentar lo que le mandamos, nunca lo que
// descartamos.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')
const LockService = require('@/services/lockService')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
  renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
  deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-creada'))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  probeRefLocks: jest.fn(() => Promise.resolve({ locks: [], reachable: true, enabled: true })),
  // El registro de lo que sostiene ESTA pestaña. `refLockStateMixin` lo consulta para no
  // avisar sobre nuestros propios locks.
  refLocks: new Map()
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const FIELDS = [
  { key: 'ref_id', label: 'ID' },
  { key: 'authors', label: 'Authors' },
  { key: 'column_0', label: 'Contexto' }
]

function createWrapper (type = 'isoqf_characteristics') {
  return shallowMount(crudTables, {
    localVue,
    propsData: {
      type,
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: [{ id: 'R1', authors: ['Smith, J'], publication_year: '2020' }],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      videoHelp: true,
      BackToTop: true,
      draggable: true
    }
  })
}

// BootstrapVue instala $bvModal como propiedad read-only, así que `mocks` no lo reemplaza:
// hay que espiarlo sobre la instancia ya montada.
function espiarConfirm (wrapper, respuesta = true) {
  wrapper.vm.$bvModal.msgBoxConfirm = jest.fn(() => Promise.resolve(respuesta))
  return wrapper.vm.$bvModal.msgBoxConfirm
}

// Deja el componente como queda después de cargar un archivo: una tabla con filas
// (para que el import pase por el DELETE) y datos importados listos para guardar.
async function conArchivoCargado (wrapper) {
  await flushPromises()
  wrapper.vm.$refs[`import-table-${wrapper.vm.type}`] = { show: jest.fn(), hide: jest.fn() }
  await wrapper.setData({
    dataTable: { id: 'tabla-1', fields: FIELDS, items: [{ ref_id: 'R1', authors: 'Smith 2020' }] },
    importDataTable: {
      error: null,
      fields: ['ref_id', 'authors', 'column_0'],
      items: [{ ref_id: 'R1', authors: 'Smith 2020', column_0: 'importado' }],
      fieldsObj: [{ key: 'authors', label: 'Author(s), Year' }]
    }
  })
}

const LOCKS_AJENOS = [
  { ref_id: 'R7', user_name: 'Ana López' },
  { ref_id: 'R9', user_name: 'Luis Pérez' }
]

describe('crudTables — el import pregunta antes de arrasar', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
    LockService.probeRefLocks.mockResolvedValue({ locks: [], reachable: true, enabled: true })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('sin nadie editando, importa sin preguntar', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(confirm).not.toHaveBeenCalled()
    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/tabla-1')
  })

  it('con gente editando, pregunta nombrándola y diciendo cuántos estudios', async () => {
    LockService.probeRefLocks.mockResolvedValue({
      locks: LOCKS_AJENOS, reachable: true, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper, true)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    const [mensaje] = confirm.mock.calls[0]
    expect(mensaje).toContain('import_modal.ref_locks_confirm')
    expect(mensaje).toContain('Ana López, Luis Pérez')
    expect(mensaje).toContain('"count":2')
  })

  it('si confirma, importa igual — la decisión es de la persona', async () => {
    LockService.probeRefLocks.mockResolvedValue({
      locks: LOCKS_AJENOS, reachable: true, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    espiarConfirm(wrapper, true)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledWith('/isoqf_characteristics/tabla-1')
    expect(Api.post).toHaveBeenCalled()
  })

  it('si cancela, no escribe NI le borra el archivo que acababa de cargar', async () => {
    // Lo segundo importa tanto como lo primero: `saveImportedData` limpiaba
    // `importDataTable` incondicionalmente al final, así que cancelar la confirmación le
    // habría costado volver a elegir el archivo y revisar las columnas de nuevo.
    LockService.probeRefLocks.mockResolvedValue({
      locks: LOCKS_AJENOS, reachable: true, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    espiarConfirm(wrapper, false)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(Api.delete).not.toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    expect(wrapper.vm.importDataTable.items).toHaveLength(1)
  })

  it('si no pudo averiguarlo, pregunta con el texto de incertidumbre', async () => {
    // `reachable:false` es la razón de existir de `probeRefLocks`: sin ese campo un error
    // de red se leería igual que «nadie está editando», y le diríamos lo contrario de la
    // verdad justo antes de una operación destructiva.
    LockService.probeRefLocks.mockResolvedValue({
      locks: [], reachable: false, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper, true)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    const [mensaje] = confirm.mock.calls[0]
    expect(mensaje).toContain('import_modal.ref_locks_unknown')
    expect(mensaje).not.toContain('import_modal.ref_locks_confirm')
  })

  it('con la concurrencia apagada importa directo, sin preguntar', async () => {
    // No es incertidumbre: sin locks posibles no hay nada que avisar, y un clic extra
    // donde la pregunta no aplica es lo que hace que se dejen de leer los carteles.
    LockService.probeRefLocks.mockResolvedValue({
      locks: [], reachable: true, enabled: false
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(confirm).not.toHaveBeenCalled()
    expect(Api.delete).toHaveBeenCalled()
  })

  it('no avisa sobre un lock que sostiene esta misma pestaña', async () => {
    LockService.refLocks = new Map([['R7', {}]])
    LockService.probeRefLocks.mockResolvedValue({
      locks: [{ ref_id: 'R7', user_name: 'Yo Mismo' }], reachable: true, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(confirm).not.toHaveBeenCalled()
  })

  it('avisa del lock de columnas de esta tabla, que el import también se lleva', async () => {
    // El import reemplaza `fields` además de `items`. Y es el único lock atribuible: la
    // clave `<doc_id>::fields` sí trae el id del documento.
    LockService.probeRefLocks.mockResolvedValue({
      locks: [{ ref_id: 'tabla-1::fields', user_name: 'Ana López' }],
      reachable: true,
      enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    const confirm = espiarConfirm(wrapper, true)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    const [mensaje] = confirm.mock.calls[0]
    expect(mensaje).toContain('import_modal.ref_locks_columns')
    expect(mensaje).toContain('Ana López')
  })

  it('vuelve a consultar al guardar, no reusa lo que vio al abrir el modal', async () => {
    // Entre abrir el modal y apretar Guardar pasan minutos: se elige el archivo, se
    // revisan las columnas en la previsualización. Un listado de hace cinco minutos
    // avisaría de quien ya salió y callaría a quien acaba de entrar.
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)
    await wrapper.vm.openModalImportTable()
    await flushPromises()
    const consultasAlAbrir = LockService.probeRefLocks.mock.calls.length
    espiarConfirm(wrapper, true)

    await wrapper.vm.saveImportedData()
    await flushPromises()

    expect(LockService.probeRefLocks.mock.calls.length).toBeGreaterThan(consultasAlAbrir)
  })

  it('al abrir el modal deja listo el aviso pasivo con los nombres', async () => {
    LockService.probeRefLocks.mockResolvedValue({
      locks: LOCKS_AJENOS, reachable: true, enabled: true
    })
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)

    await wrapper.vm.openModalImportTable()
    await flushPromises()

    expect(wrapper.vm.importLockNotice).toContain('Ana López, Luis Pérez')
  })

  it('sin nadie editando no hay aviso pasivo', async () => {
    wrapper = createWrapper()
    await conArchivoCargado(wrapper)

    await wrapper.vm.openModalImportTable()
    await flushPromises()

    expect(wrapper.vm.importLockNotice).toBe('')
  })
})
