// El 409 de versión en el editor de estudios del Paso 3.
//
// Medido en navegador el 2026-08-31 contra isoqf-test: forzando un `_v` viejo, el servidor
// responde `409 version_conflict` con `expected_version`, `current_version` y el `item`
// fresco — y en pantalla no pasaba NADA. El texto seguía en el formulario, sin guardar y
// sin aviso; el único rastro era `console.error`.
//
// Dos capas fallaban a la vez. `Api.js` ya emitía `item-version-conflict` con todo lo
// necesario, pero **sólo `crudTables` lo escuchaba**. Y el `.catch` caía en
// `autoSaveStatus = 'error'`, un estado que este template no renderiza en ninguna rama: se
// asignaba y no se veía.
//
// Es el caso que CLAUDE.md llama peor que un editor bloqueado: uno mudo, porque la persona
// sigue escribiendo sobre algo que ya no se está guardando.
import { shallowMount } from '@vue/test-utils'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  isEnabled: true
}))

jest.mock('@/services/columnService', () => ({
  addColumn: jest.fn((collection, docId, label, key) =>
    Promise.resolve({ key, response: { data: {} } }))
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const CHARS_DATA = {
  id: 'doc1',
  fields: [{ key: 'ref_id', label: 'ID' }, { key: 'column_vieja', label: 'Contexto' }],
  items: [{ ref_id: 'ref1', authors: 'Smith, J 2020', column_vieja: 'lo que había', _v: 4 }]
}

const REFERENCE = { id: 'ref1', authors: ['Smith, J'], publication_year: '2020' }

function createWrapper (charsData = CHARS_DATA) {
  return shallowMount(EditReferenceModal, {
    propsData: { reference: REFERENCE, charsData, camelot: { fields: [], categories: [] } },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-modal': true, 'b-form-group': true, 'b-form-input': true, 'b-form-textarea': true,
      'b-button': true, 'b-row': true, 'b-col': true, 'b-alert': true, 'b-spinner': true,
      'font-awesome-icon': true, CustomFieldsManager: true
    }
  })
}

const emitirConflicto = (detail) => window.dispatchEvent(
  new CustomEvent('item-version-conflict', { detail })
)

const CONFLICTO = {
  refId: 'ref1',
  expectedVersion: 1,
  currentVersion: 4,
  item: { ref_id: 'ref1', authors: 'Smith, J 2020', column_vieja: 'lo que guardó la otra persona' },
  failedData: { ref_id: 'ref1', authors: 'Smith, J 2020', column_vieja: 'lo que yo escribí' },
  source: 'live'
}

describe('EditReferenceModal — el conflicto de versión deja de ser mudo', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('muestra el conflicto cuando es de este estudio', async () => {
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.versionConflict).toBeTruthy()
    expect(wrapper.vm.versionConflict.currentVersion).toBe(4)
  })

  it('ignora el conflicto de otro estudio', async () => {
    // El evento es de `window`, así que llega a todos los editores abiertos. Sin el filtro,
    // abrir dos estudios haría que el conflicto de uno bloqueara el otro.
    wrapper = createWrapper()
    emitirConflicto({ ...CONFLICTO, refId: 'otro-estudio' })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.versionConflict).toBeNull()
  })

  it('enfrenta lo guardado contra lo intentado, columna por columna', async () => {
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.conflictComparison).toEqual({
      column_vieja: { theirs: 'lo que guardó la otra persona', mine: 'lo que yo escribí' }
    })
  })

  it('corta el auto-guardado en vez de seguir reintentando', async () => {
    // Sin esto cada tecla vuelve a mandar la misma versión vieja: un 409 por pulsación,
    // y el reintento no puede funcionar nunca porque la fila no se recargó.
    wrapper = createWrapper()
    const cancel = jest.fn()
    wrapper.vm.autoSaveDebounced = Object.assign(jest.fn(), { cancel, flush: jest.fn() })
    await wrapper.setData({ autoSaveStatus: 'saving' })

    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(cancel).toHaveBeenCalled()
    expect(wrapper.vm.autoSaveStatus).toBeNull()
    expect(wrapper.vm.isReadOnly).toBe(true)
  })

  it('recargar devuelve el editor a un estado escribible', async () => {
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    wrapper.vm.reloadAfterVersionConflict()
    await flushPromises()

    expect(wrapper.vm.versionConflict).toBeNull()
    expect(wrapper.vm.isReadOnly).toBe(false)
    // El editor no puede recargarse solo: la fila fresca la tiene el padre.
    expect(wrapper.emitted('reload-chars-data')).toBeTruthy()
  })

  it('deja de escuchar al destruirse', async () => {
    // El listener es de `window` y el modal se monta y desmonta con la vista. Uno que
    // sobreviva pondría en conflicto un componente que ya no está en pantalla.
    wrapper = createWrapper()
    wrapper.destroy()

    emitirConflicto(CONFLICTO)
    expect(wrapper.vm.versionConflict).toBeNull()
    wrapper = null
  })

  it('el guardado explícito tampoco se anuncia con el error genérico', async () => {
    // «No se pudo guardar, intente nuevamente» es un consejo falso acá: reintentar manda la
    // misma versión vieja. El cartel del conflicto ya explica qué pasó y qué hacer.
    wrapper = createWrapper()
    Api.patch.mockRejectedValueOnce({
      response: { status: 409, data: { reason: 'version_conflict', current_version: 4 } },
      config: { url: '/isoqf_characteristics/doc1/item/ref1' }
    })
    await wrapper.setData({
      isReadOnly: false,
      customFields: [{ id: 'f1', label: 'Contexto', value: 'x', key: 'column_vieja', locked: false, hasComments: false }]
    })

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(wrapper.vm.$notify.error).not.toHaveBeenCalled()
  })
})

// Los de arriba prueban el estado. Éstos prueban lo único que le importa a la persona: que
// aparezca en pantalla. El bug medido era exactamente esa brecha — `autoSaveStatus` se
// ponía en `'error'` y el template no tenía rama para ese valor.
describe('EditReferenceModal — el cartel del conflicto se ve', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('renderiza el cartel del conflicto', async () => {
    wrapper = createWrapper()
    expect(wrapper.find('[data-testid="reference-version-conflict"]').exists()).toBe(false)

    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-testid="reference-version-conflict"]').exists()).toBe(true)
  })

  it('no muestra a la vez el cartel de lock, que diría lo contrario', async () => {
    // El conflicto pone el editor en solo lectura, y ese mismo flag enciende el cartel de
    // «alguien tiene este estudio». Acá es falso: el lock es de esta persona; lo que cambió
    // es la fila. Dos carteles contradictorios sobre un solo rechazo.
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(true)
    expect(wrapper.find('[data-testid="reference-readonly-notice"]').exists()).toBe(false)
  })

  it('nombra la columna como la persona la ve, no por su clave interna', async () => {
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.labelForKey('column_vieja')).toBe('Contexto')
  })

  it('cae a la clave cuando la columna ya no existe', async () => {
    // La otra persona pudo borrar la columna en el mismo movimiento. Fea pero cierta es
    // mejor que vacía: sin nada encima, los dos textos no se sabe de qué son.
    wrapper = createWrapper()
    expect(wrapper.vm.labelForKey('column_borrada')).toBe('column_borrada')
  })
})

// Las etiquetas de las dos cajas tienen que VERSE.
//
// Visto en navegador el 2026-08-31, ya con el cartel funcionando: los textos «Lo que quedó
// guardado» y «Lo que intentaste guardar» estaban puestos como `placeholder`, y un
// placeholder es invisible en cuanto la caja tiene valor — que es siempre, porque el panel
// existe justamente para mostrar dos valores. Se veían dos textos sin decir cuál era cuál,
// o sea faltaba lo único que el panel tiene que responder.
//
// Heredado de `crudTables`, que trae el mismo markup. Se arregla en los dos.
describe('EditReferenceModal — se sabe cuál texto es de quién', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('rotula las dos cajas con texto visible, no con placeholder', async () => {
    wrapper = createWrapper()
    emitirConflicto(CONFLICTO)
    await wrapper.vm.$nextTick()

    const texto = wrapper.find('[data-testid="reference-version-conflict"]').text()
    expect(texto).toContain('version_conflict.theirs')
    expect(texto).toContain('version_conflict.mine')
  })
})
