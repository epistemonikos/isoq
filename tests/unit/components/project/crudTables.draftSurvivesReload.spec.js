// #414 — en el Paso 3 no-CAMELOT, lo que se escribe en un estudio se borra solo.
//
// Megan llena el estudio 1, guarda y abre enseguida el estudio 2. Guardar dispara
// `getData()` (y `get-project`, que vuelve a pasar `references` y relee la tabla otra vez).
// Cuando esa lectura vuelve, `handleResponseData` reemplazaba `dataTableFieldsModal.items`
// —el arreglo que el modal tiene enlazado con `v-model`— por las filas del servidor, que
// todavía no tienen lo que la persona alcanzó a escribir en el estudio 2: el texto
// desaparecía, o quedaba a medias.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  getHeaders: jest.fn(() => ({}))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve())
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const tableDoc = (r2Value) => ({
  id: 'tabla-1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_a', label: 'Contexto' }
  ],
  items: [
    { ref_id: 'R1', authors: 'Alpha 2020', column_a: 'guardado del estudio 1' },
    { ref_id: 'R2', authors: 'Beta 2021', column_a: r2Value }
  ]
})

// BootstrapVue 2: `v-model` de b-form-textarea escucha `update`; `@input` es el del auto-guardado.
function type (stub, text) {
  stub.vm.$emit('update', text)
  stub.vm.$emit('input', text)
}

function createWrapper () {
  const wrapper = shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: [
        { id: 'R1', authors: ['Alpha, A'], publication_year: '2020' },
        { id: 'R2', authors: ['Beta, B'], publication_year: '2021' }
      ],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true, BackToTop: true, draggable: true }
  })
  wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('crudTables — el borrador del modal sobrevive a una recarga de la tabla (#414)', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [tableDoc('')] })
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('una lectura que vuelve con el editor abierto no pisa lo que se está escribiendo', async () => {
    // La lectura que disparó el guardado del estudio 1 todavía no vuelve.
    let resolveReload
    Api.get.mockReturnValueOnce(new Promise(resolve => { resolveReload = resolve }))
    wrapper.vm.getData()

    wrapper.vm.addContentDataTable(1)
    await flushPromises()
    const textarea = () => wrapper.find('b-form-textarea-stub')
    type(textarea(), 'lo que alcanzó a escribir')
    await wrapper.vm.$nextTick()

    resolveReload({ data: [tableDoc('')] })
    await flushPromises()

    expect(textarea().attributes('value')).toBe('lo que alcanzó a escribir')
  })

  it('al cerrar el editor, la tabla sigue mostrando lo que trajo el servidor', async () => {
    wrapper.vm.addContentDataTable(1)
    await flushPromises()
    wrapper.vm.onEditModalHidden()

    Api.get.mockResolvedValueOnce({ data: [tableDoc('del servidor')] })
    await wrapper.vm.getData()

    expect(wrapper.vm.dataTable.items[1].column_a).toBe('del servidor')
  })

  // El conflicto de versión es lo contrario: «Recargar» pide la fila del servidor.
  it('«Recargar» tras un conflicto de versión sí trae la fila del servidor al editor', async () => {
    wrapper.vm.addContentDataTable(1)
    await flushPromises()
    type(wrapper.find('b-form-textarea-stub'), 'mi intento')
    await wrapper.vm.$nextTick()

    Api.get.mockResolvedValueOnce({ data: [tableDoc('lo que guardó otra persona')] })
    await wrapper.vm.reloadAfterVersionConflict()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('b-form-textarea-stub').attributes('value')).toBe('lo que guardó otra persona')
  })

  // Mismo bug en el modal «crear tabla»: `handleResponseData` reiniciaba `fields` y
  // `nroColumns`, que son los títulos que la persona está escribiendo ahí.
  it('una lectura que vuelve con el modal de crear columnas abierto no borra los títulos', async () => {
    await wrapper.setData({ columnsCreateModalOpen: true })
    wrapper.vm.dataTableFieldsModal.nroColumns = 3
    wrapper.vm.dataTableFieldsModal.fields = ['Edad', 'País', 'Diseño']
    await wrapper.vm.$nextTick()

    await wrapper.vm.getData()
    await wrapper.vm.$nextTick()

    const values = wrapper.findAll('b-form-input-stub[id^="column_"]').wrappers.map(w => w.attributes('value'))
    expect(values).toEqual(['Edad', 'País', 'Diseño'])
  })
})
