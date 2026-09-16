// El catálogo CAMELOT en `fields`: siembra al nacer el documento, y qué puede mencionar
// el reorden mientras un documento viejo no lo tenga guardado.
//
// Las 24 claves (12 dominios × `_extractedData`/`_comments`) son fijas —no se crean ni se
// borran— pero tienen que EXISTIR en `fields`: la tabla del Paso 3 deriva sus columnas sólo
// de ahí, y `PUT /fields/order` rechaza con 400 cualquier clave que el documento no tenga.

import { shallowMount, mount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import CustomFieldsManager from '@/components/camelot/CustomFieldsManager.vue'
import columnService from '@/services/columnService'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

jest.mock('@/utils/Api', () => ({
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/columnService', () => ({
  __esModule: true,
  default: {
    addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
    renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
    deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
    reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
    ensureTableDocument: jest.fn(() => Promise.resolve('char_creado'))
  }
}))

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn(() => Promise.resolve({ success: true })),
    releaseRef: jest.fn(() => Promise.resolve())
  }
}))

const CHARS = {
  id: 'char1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_a', label: 'Contexto' },
    { key: 'column_b', label: 'País' }
  ],
  items: []
}

function createWrapper () {
  return shallowMount(ManageColumnsButton, {
    propsData: { charsData: CHARS, visibleColumnKeys: ['column_a', 'column_b'], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
      $bvToast: { toast: jest.fn() }
    },
    stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
  })
}

/**
 * Lo que `CustomFieldsManager` emite: su propia copia de la fila, con el `id` que se
 * inventó para el v-for. Reproducirlo acá es lo que hace al test fiel al camino real.
 */
function asChildEmits (definition, index) {
  return { ...JSON.parse(JSON.stringify(definition)), id: `field_${Date.now()}_${index}` }
}

// El documento de un proyecto CAMELOT nuevo no existe hasta que alguien escribe, así que
// lo crea la primera columna. Si nace sin el catálogo, las 12 columnas CAMELOT desaparecen
// de la tabla en el mismo instante — y quedan así en la base.
describe('ManageColumnsButton — nacimiento del documento', () => {
  beforeEach(() => jest.clearAllMocks())

  it('siembra el catálogo CAMELOT al crear el documento', async () => {
    const CATALOGO = [
      { key: 'research_extractedData', label: 'Extracted data' },
      { key: 'research_comments', label: 'Comments' }
    ]
    const wrapper = shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: { fields: [] },
        camelot: { fields: CATALOGO, categories: [] },
        visibleColumnKeys: [],
        canEdit: true
      },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })

    await wrapper.vm.resolveDocumentId()

    expect(columnService.ensureTableDocument).toHaveBeenCalledWith(
      'isoqf_characteristics', 'org1', 'proj1', { fields: CATALOGO }
    )
  })
})

// El reorden sólo puede mencionar claves que el documento tenga GUARDADAS: el backend
// responde 400 ("Unknown field keys in `order`") por cualquier otra.
//
// En un proyecto viejo las claves CAMELOT se ven porque el cliente las repone, pero no
// están en la base. Mencionarlas convertiría cada arrastre en un error.
describe('ManageColumnsButton — el orden no menciona claves que el servidor no tiene', () => {
  beforeEach(() => jest.clearAllMocks())

  function wrapperConFields (fields) {
    return shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: { id: 'char1', fields },
        camelot: { fields: [], categories: [] },
        visibleColumnKeys: [],
        canEdit: true
      },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
  }

  it('omite las claves CAMELOT repuestas por el cliente', async () => {
    const wrapper = wrapperConFields([
      { key: 'ref_id', label: 'ID' },
      { key: 'column_a', label: 'Guardada' },
      { key: 'context_extractedData', label: 'CAMELOT repuesta', virtual: true },
      { key: 'context_comments', label: 'Comentarios repuestos', virtual: true }
    ])
    await wrapper.setData({
      columnDefinitions: [
        { key: 'context_extractedData', label: 'CAMELOT repuesta', isCamelot: true },
        { key: 'column_a', label: 'Guardada' }
      ],
      pendingOrder: true
    })

    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', ['column_a'])
  })

  it('sí las menciona cuando el documento las tiene guardadas', async () => {
    const wrapper = wrapperConFields([
      { key: 'ref_id', label: 'ID' },
      { key: 'context_extractedData', label: 'CAMELOT' },
      { key: 'context_comments', label: 'Comentarios' },
      { key: 'column_a', label: 'Guardada' }
    ])
    await wrapper.setData({
      columnDefinitions: [
        { key: 'context_extractedData', label: 'CAMELOT', isCamelot: true },
        { key: 'column_a', label: 'Guardada' }
      ],
      pendingOrder: true
    })

    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns).toHaveBeenCalledWith(
      'isoqf_characteristics', 'char1',
      ['context_extractedData', 'context_comments', 'column_a']
    )
  })
})

// Las columnas CAMELOT se arrastran igual que las propias, así que el orden es una
// secuencia MIXTA: CAMELOT · propia · CAMELOT · propia · propia · CAMELOT.
//
// `order` tiene que llevar esa secuencia completa, no sólo las propias: el backend coloca
// las claves mencionadas en los slots que ocupaban colectivamente y deja quieto todo lo
// demás, así que mandar la mitad dejaría a la otra mitad clavada en sus índices viejos y el
// intercalado saldría distinto del que el usuario armó.
//
// Y cada CAMELOT arrastra su `_comments` pegado detrás. El modal lista sólo la mitad
// `_extractedData` de cada dominio, así que si el par no viajara junto, los comentarios se
// quedarían en su índice viejo y se separarían de su columna.
describe('ManageColumnsButton — orden intercalado de CAMELOT y columnas propias', () => {
  beforeEach(() => jest.clearAllMocks())

  const DOC_COMPLETO = {
    id: 'char1',
    fields: [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'research_extractedData', label: 'Extracted data' },
      { key: 'research_comments', label: 'Comments' },
      { key: 'context_extractedData', label: 'Extracted data' },
      { key: 'context_comments', label: 'Comments' },
      { key: 'column_a', label: 'Propia A' },
      { key: 'column_b', label: 'Propia B' }
    ]
  }

  function wrapperCompleto () {
    return shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: DOC_COMPLETO,
        camelot: { fields: [], categories: [] },
        visibleColumnKeys: [],
        canEdit: true
      },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
  }

  it('manda la secuencia mixta completa, con cada par CAMELOT junto', async () => {
    const wrapper = wrapperCompleto()
    // Lo que el usuario dejó en el modal: CAMELOT · propia · CAMELOT · propia.
    await wrapper.setData({
      columnDefinitions: [
        { key: 'context_extractedData', label: 'Contexto', isCamelot: true },
        { key: 'column_a', label: 'Propia A' },
        { key: 'research_extractedData', label: 'Investigación', isCamelot: true },
        { key: 'column_b', label: 'Propia B' }
      ],
      pendingOrder: true
    })

    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns).toHaveBeenCalledWith(
      'isoqf_characteristics', 'char1',
      [
        'context_extractedData', 'context_comments',
        'column_a',
        'research_extractedData', 'research_comments',
        'column_b'
      ]
    )
  })

  it('sostiene dos propias seguidas entre dos CAMELOT', async () => {
    const wrapper = wrapperCompleto()
    await wrapper.setData({
      columnDefinitions: [
        { key: 'research_extractedData', label: 'Investigación', isCamelot: true },
        { key: 'column_a', label: 'Propia A' },
        { key: 'column_b', label: 'Propia B' },
        { key: 'context_extractedData', label: 'Contexto', isCamelot: true }
      ],
      pendingOrder: true
    })

    await wrapper.vm.flushPendingOrder()

    const [, , order] = columnService.reorderColumns.mock.calls[0]
    expect(order).toEqual([
      'research_extractedData', 'research_comments',
      'column_a', 'column_b',
      'context_extractedData', 'context_comments'
    ])
  })

  // Los campos de sistema no viajan nunca: el backend los rechaza con 400 por nombre.
  it('no mete ref_id ni authors en el orden', async () => {
    const wrapper = wrapperCompleto()
    wrapper.vm.openColumnsModal()
    await wrapper.setData({ pendingOrder: true })

    await wrapper.vm.flushPendingOrder()

    const [, , order] = columnService.reorderColumns.mock.calls[0]
    expect(order).not.toContain('ref_id')
    expect(order).not.toContain('authors')
  })
})

// El alta persiste el orden EN EL ACTO, sin esperar a que se cierre el modal.
//
// El servidor agrega la columna al final (`$push`) y el modal la muestra arriba, que es
// donde el usuario la creó. Diferir el reorden al cierre era gratis cuando el documento
// tenía dos campos; con las 24 claves CAMELOT sembradas, la columna nueva aparece detrás
// de todas ellas hasta que el modal se cierra — y si el cierre no llega a disparar el
// flush, queda al final tambien en la base.
//
// El reorden por arrastre sigue acumulándose hasta el cierre: ése sí es conmutativo y no
// tiene ninguna discrepancia que corregir.
describe('ManageColumnsButton — la columna nueva queda al inicio sin cerrar el modal', () => {
  beforeEach(() => jest.clearAllMocks())

  const DOC_SEMBRADO = {
    id: 'char1',
    fields: [
      { key: 'ref_id', label: 'ID' },
      { key: 'authors', label: 'Authors' },
      { key: 'research_extractedData', label: 'Extracted data' },
      { key: 'research_comments', label: 'Comments' }
    ]
  }

  function wrapperSembrado () {
    return shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: DOC_SEMBRADO,
        camelot: { fields: [], categories: [] },
        visibleColumnKeys: [],
        canEdit: true
      },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
  }

  it('manda el orden con la columna nueva primera, en el mismo guardado', async () => {
    const wrapper = wrapperSembrado()
    wrapper.vm.openColumnsModal()
    // El hijo la inserta arriba, que es donde el usuario la ve.
    wrapper.vm.columnDefinitions.unshift({ id: 'f-nueva', label: 'País' })

    await wrapper.vm.onFieldCommitted(wrapper.vm.columnDefinitions[0])
    await flushPromises()

    expect(columnService.reorderColumns).toHaveBeenCalledWith(
      'isoqf_characteristics', 'char1',
      ['column_nueva', 'research_extractedData', 'research_comments']
    )
  })

  it('no deja orden pendiente para el cierre', async () => {
    const wrapper = wrapperSembrado()
    wrapper.vm.openColumnsModal()
    wrapper.vm.columnDefinitions.unshift({ id: 'f-nueva', label: 'País' })

    await wrapper.vm.onFieldCommitted(wrapper.vm.columnDefinitions[0])
    await flushPromises()
    columnService.reorderColumns.mockClear()

    await wrapper.vm.onModalHidden()

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  // Renombrar no mueve nada: pedir un reorden ahí sería un request al pedo.
  it('el renombrado no dispara ningún reorden', async () => {
    const wrapper = wrapperSembrado()
    wrapper.vm.openColumnsModal()

    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro nombre' })
    await flushPromises()

    expect(columnService.renameColumn).toHaveBeenCalled()
    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  // El arrastre sigue difiriéndose: es conmutativo y así el cierre lo manda una sola vez.
  it('el arrastre se sigue acumulando hasta el cierre', async () => {
    const wrapper = wrapperSembrado()
    wrapper.vm.openColumnsModal()

    wrapper.vm.onOrderChanged()

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
    expect(wrapper.vm.pendingOrder).toBe(true)
  })
})

// El orden se deriva del documento que ACABA de devolver el servidor, no del prop.
//
// En un proyecto nuevo el documento no existe cuando se abre el modal, así que `charsData`
// trae las 24 claves CAMELOT repuestas y marcadas. El alta las crea de verdad —el POST las
// siembra— y la respuesta trae el documento completo, pero el prop del hijo todavía no
// cambió: el padre lo asigna de forma síncrona y Vue lo propaga recién en el tick
// siguiente.
//
// Leyendo el prop, `order` salía con una sola clave (la recién creada) y el backend la
// dejaba en el slot que ya ocupaba: el último. La columna quedaba al final de la tabla,
// que es justo lo que el reorden venía a evitar.
describe('ManageColumnsButton — el orden usa el documento fresco, no el prop', () => {
  beforeEach(() => jest.clearAllMocks())

  // Lo que ve el hijo al abrir el modal: nada guardado, las CAMELOT repuestas.
  const SIN_DOCUMENTO = {
    fields: [
      { key: 'research_extractedData', label: 'Extracted data', virtual: true },
      { key: 'research_comments', label: 'Comments', virtual: true }
    ]
  }

  // Lo que devuelve el alta: el documento ya creado, con el catálogo sembrado.
  const DOCUMENTO_CREADO = {
    data: {
      id: 'char_creado',
      fields: [
        { key: 'ref_id', label: 'ID' },
        { key: 'authors', label: 'Authors' },
        { key: 'research_extractedData', label: 'Extracted data' },
        { key: 'research_comments', label: 'Comments' },
        { key: 'column_nueva', label: 'País' }
      ]
    }
  }

  it('mete las claves CAMELOT que el alta acaba de sembrar', async () => {
    columnService.addColumn.mockResolvedValueOnce({ key: 'column_nueva', response: DOCUMENTO_CREADO })
    const wrapper = shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: SIN_DOCUMENTO,
        camelot: { fields: [], categories: [] },
        visibleColumnKeys: [],
        canEdit: true
      },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
    wrapper.vm.openColumnsModal()
    wrapper.vm.columnDefinitions.unshift({ id: 'f-nueva', label: 'País' })

    await wrapper.vm.onFieldCommitted(wrapper.vm.columnDefinitions[0])
    await flushPromises()

    // Con el prop desactualizado esto salía como ['column_nueva'] a secas, y el backend
    // la dejaba donde ya estaba.
    expect(columnService.reorderColumns).toHaveBeenCalledWith(
      'isoqf_characteristics', 'char_creado',
      ['column_nueva', 'research_extractedData', 'research_comments']
    )
  })
})
