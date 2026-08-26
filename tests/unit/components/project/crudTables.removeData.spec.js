import { shallowMount, createLocalVue } from '@vue/test-utils'
import crudTables from '@/components/project/crudTables.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

jest.mock('@/utils/xlsxExporter', () => ({
  exportTableToXLSX: jest.fn().mockResolvedValue(undefined),
  exportAOAToXLSX: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@/utils/csvImporter', () => ({ parseTableRows: jest.fn(), parseCSVData: jest.fn() }))
jest.mock('@/utils/xlsxImporter', () => ({ parseXLSXData: jest.fn() }))
jest.mock('@/utils/tableDataUtils', () => ({
  loadFileAsText: jest.fn(),
  sortByAuthors: jest.fn(items => items),
  filterDisplayFields: jest.fn(fields =>
    fields.filter(f => !['ref_id', 'authors', 'actions'].includes(f.key)))
}))
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn().mockResolvedValue(undefined),
    isEnabled: true
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

/**
 * «Quitar los datos de este estudio» blanquea la fila: conserva `ref_id` y `authors` y
 * vacía las columnas. El texto que ve la persona lo dice así —«eliminar todo el contenido
 * de esta fila»— y la fila sigue en la tabla después.
 *
 * Lo que estaba mal era el cómo: reescribía el array `items` completo por la ruta
 * genérica, así que se llevaba por delante lo que otra persona estuviera escribiendo en
 * cualquier otra fila, y lo hacía sin tomar ningún lock.
 */
describe('crudTables.vue — quitar los datos de un estudio', () => {
  let wrapper

  const fields = [{ key: 'ref_id' }, { key: 'authors' }, { key: 'column_0' }, { key: 'column_1' }]
  const stages = [{ key: 0, options: [{ option: 2, text: 'evaluado' }] }]

  const mount = () => shallowMount(crudTables, {
    localVue,
    propsData: {
      type: 'isoqf_assessments',
      prefix: 'as',
      canEdit: true,
      project: { is_public: false },
      references: [],
      refs: [],
      lists: [],
      useCamelot: false
    },
    mocks: {
      $t: msg => msg,
      $route: { params: { id: 'project-123', org_id: 'org-456' } },
      $bvModal: { msgBoxConfirm: jest.fn(() => Promise.resolve(true)) }
    },
    stubs: {
      'font-awesome-icon': true,
      videoHelp: true,
      BackToTop: true,
      draggable: true
    }
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
    wrapper = mount()
    // `mounted` dispara `updateMyDataTables` y `getData`; sin dejarlas asentar, su
    // respuesta vacía sobreescribe lo que este test acaba de sembrar.
    await flush()
    jest.clearAllMocks()
    await wrapper.setData({
      dataTable: {
        id: 'doc1',
        fields,
        items: [
          { ref_id: 'r1', authors: 'A 2020', column_0: 'dato de A', column_1: 'otro', _v: 4, stages },
          { ref_id: 'r2', authors: 'B 2021', column_0: 'dato de B', column_1: 'x', _v: 2 }
        ]
      },
      removeReferenceDataTable: { id: 'r1', findings: [] },
      isRowReadOnly: false
    })
    // `shallowMount` no instancia el `b-modal`, así que su ref no trae `show`.
    wrapper.vm.$refs['removeContentModalDataTable'] = { show: jest.fn(), hide: jest.fn() }
  })

  afterEach(() => wrapper && wrapper.destroy())

  it('escribe por el sub-recurso de la fila, no el documento entero', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.removeDataFromLists()
    await flush()

    expect(Api.patch).toHaveBeenCalledTimes(1)
    expect(Api.patch.mock.calls[0][0]).toBe('/isoqf_assessments/doc1/item/r1')
  })

  it('vacía las columnas y conserva la identidad de la fila', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.removeDataFromLists()
    await flush()

    const payload = Api.patch.mock.calls[0][1]
    expect(payload.ref_id).toBe('r1')
    expect(payload.authors).toBe('A 2020')
    expect(payload.column_0).toBe('')
    expect(payload.column_1).toBe('')
  })

  it('conserva el contador de versión y el árbol de evaluaciones', async () => {
    // Blanquear las columnas no es motivo para tirar lo que no es una columna: el `$set`
    // del servidor reemplaza el ítem completo, así que lo que no viaje se pierde.
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.removeDataFromLists()
    await flush()

    const payload = Api.patch.mock.calls[0][1]
    expect(payload._v).toBe(4)
    expect(payload.stages).toEqual(stages)
  })

  it('no toca la fila de al lado', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.removeDataFromLists()
    await flush()

    const payload = Api.patch.mock.calls[0][1]
    expect(payload.ref_id).not.toBe('r2')
    // Y el endpoint por fila no puede alcanzarla ni por accidente.
    expect(Api.patch.mock.calls[0][0]).not.toContain('r2')
  })

  it('pide el lock de la fila al abrir la confirmación', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    expect(LockService.acquireRef).toHaveBeenCalledWith('project-123', 'r1')
  })

  it('no escribe si la fila la tiene otra persona', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.removeDataFromLists()
    await flush()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.removeLockedBy).toBe('Ana')
  })

  it('suelta el lock al cerrar la confirmación', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    wrapper.vm.onRemoveModalHidden()
    await flush()

    expect(LockService.releaseRef).toHaveBeenCalledWith('r1')
  })

  // BootstrapVue no emite `cancel` cuando se cierra con ESC, con la X o clickeando el
  // fondo. Colgado sólo de `cancel`, el lock quedaba tomado hasta que el TTL lo barriera y
  // nadie más podía editar esa fila.
  it('suelta el lock también cuando se cierra sin cancelar', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    // `hidden` es el único evento que BootstrapVue emite en las cuatro rutas de cierre.
    wrapper.vm.onRemoveModalHidden()
    await flush()

    expect(LockService.releaseRef).toHaveBeenCalledWith('r1')
  })

  it('suelta el lock después de confirmar', async () => {
    wrapper.vm.openModalRemoveContentDataTable('r1')
    await flush()

    await wrapper.vm.removeDataFromLists()
    await flush()

    expect(LockService.releaseRef).toHaveBeenCalledWith('r1')
  })

  describe('sin pisarse con el editor de fila, que usa el mismo servicio', () => {
    // Los dos flujos piden locks del mismo servicio sobre las mismas filas. Compartir los
    // campos de estado hacía que cerrar la confirmación soltara el lock del editor
    // abierto, y encima lo devolvía a escribible: la persona seguía tecleando mientras
    // cada guardado recibía 409, y el canal de conflicto lo tapaba por ser de lock.
    const openEditorOn = async (refId) => {
      await wrapper.setData({
        dataTableFieldsModal: { items: [], selected_item_index: 0, editingRefId: refId }
      })
      wrapper.vm.$refs['edit-content-dataTable'] = { show: jest.fn(), hide: jest.fn() }
      wrapper.vm.lockedRowRef = refId
      wrapper.vm.rowEditorOpen = true
      wrapper.vm.isRowReadOnly = false
    }

    it('cerrar la confirmación no suelta el lock del editor abierto', async () => {
      await openEditorOn('r1')
      wrapper.vm.openModalRemoveContentDataTable('r2')
      await flush()
      LockService.releaseRef.mockClear()

      wrapper.vm.onRemoveModalHidden()
      await flush()

      expect(LockService.releaseRef).not.toHaveBeenCalledWith('r1')
    })

    it('un rechazo en la confirmación no devuelve a escribible el editor abierto', async () => {
      await openEditorOn('r1')
      LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })

      wrapper.vm.openModalRemoveContentDataTable('r2')
      await flush()
      wrapper.vm.onRemoveModalHidden()
      await flush()

      expect(wrapper.vm.isRowReadOnly).toBe(false)
      expect(wrapper.vm.lockedRowRef).toBe('r1')
    })

    it('abrir la confirmación de otra fila no pierde el lock de la anterior', async () => {
      wrapper.vm.openModalRemoveContentDataTable('r1')
      await flush()
      wrapper.vm.openModalRemoveContentDataTable('r2')
      await flush()

      expect(LockService.releaseRef).toHaveBeenCalledWith('r1')
    })
  })
})
