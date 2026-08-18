// La otra mitad del salto al guardar: el clamp del navegador.
//
// Aunque se saque el `$router.push` de viewProject (el que mandaba la página a y=0
// vía el scrollBehavior global), recargar la tabla sigue moviendo al usuario. La
// causa es distinta y más sutil: `crudTables` define `<template v-slot:table-busy>`,
// y en Bootstrap-Vue ese slot reemplaza el `tbody` COMPLETO. Con perPage 10 y celdas
// de texto largo, diez filas altas se vuelven una fila con spinner: el documento se
// acorta de verdad y el navegador clampea la posición del usuario a lo que queda.
//
// Por eso el hold va en getData() y no en el guardado: getData es el punto único por
// donde pasan las tres rutas que colapsan la tabla — guardar una fila, guardar
// columnas, y el refresco automático de 15s.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'

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
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  getHeaders: jest.fn(() => ({}))
}))

jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
  renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
  deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
  ensureTableDocument: jest.fn(() => Promise.resolve('tabla-1'))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve())
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  const wrapper = shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_characteristics',
      prefix: 'chars',
      canEdit: true,
      project: { is_public: false },
      references: [{ id: 'R1', authors: ['Smith, J'], publication_year: '2020' }],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      'videoHelp': true,
      'BackToTop': true,
      'draggable': true
    }
  })
  wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('crudTables — sostener la posición al recargar la tabla', () => {
  let wrapper

  beforeEach(async () => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    await flushPromises()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('getData() congela la posición antes de encender el spinner', async () => {
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.getData()
    await flushPromises()

    expect(hold).toHaveBeenCalled()
  })

  it('guardar una fila sostiene la posición', async () => {
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')
    await wrapper.setData({
      dataTable: { id: 'tabla-1', fields: [], fieldsObj: [], items: [] },
      dataTableFieldsModal: { items: [{ ref_id: 'R1', column_0: 'texto nuevo' }], selected_item_index: 0 },
      isRowReadOnly: false
    })

    await wrapper.vm.saveContentDataTable()
    await flushPromises()

    expect(hold).toHaveBeenCalled()
  })

  // El emit alimentaba `ui.itemData` en viewProject, que era la única razón por la
  // que routeAnchorHash() entraba y navegaba. Sin ese emit no hay navegación que
  // dispare el scrollBehavior global.
  it('guardar una fila ya no pide navegar a un ancla', async () => {
    await wrapper.setData({
      dataTable: { id: 'tabla-1', fields: [], fieldsObj: [], items: [] },
      dataTableFieldsModal: { items: [{ ref_id: 'R1', column_0: 'texto nuevo' }], selected_item_index: 0 },
      isRowReadOnly: false
    })

    await wrapper.vm.saveContentDataTable()
    await flushPromises()

    expect(wrapper.emitted('set-item-data')).toBeFalsy()
    // El refresco del proyecto sí sigue: es lo que actualiza el resto de la vista.
    expect(wrapper.emitted('get-project')).toBeTruthy()
  })

  it('el refresco automático de 15s también sostiene la posición', async () => {
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.applyProjectRefresh()
    await flushPromises()

    expect(hold).toHaveBeenCalled()
  })
})
