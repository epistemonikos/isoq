// El editor del estudio guarda el orden de las columnas.
//
// Dos huecos medidos en navegador el 2026-09-30:
//
// 1. «Add new field» muestra la columna nueva ARRIBA, pero el alta es un `$push` en el
//    servidor y nadie la reordenaba: quedaba última, detrás de las 24 claves CAMELOT.
// 2. «Move» reordenaba la lista del modal y ese orden no se guardaba nunca.
//
// Las columnas son del documento, no del estudio: el orden que se elige acá es el de toda
// la tabla, igual que en «Add or edit columns». Se manda en el mismo guardado, con el lock
// `<doc_id>::fields` que el alta ya toma, y sólo cuando difiere del guardado.
import { shallowMount } from '@vue/test-utils'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'
import * as columnService from '@/services/columnService'

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
    Promise.resolve({ key, response: { data: {} } })),
  reorderColumns: jest.fn(() => Promise.resolve({ data: {} }))
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const CHARS_DATA = {
  id: 'doc1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_a', label: 'A' },
    { key: 'context_extractedData', label: 'Context' },
    { key: 'context_comments', label: 'Comments' },
    { key: 'column_b', label: 'B' }
  ],
  items: []
}

const REFERENCE = { id: 'ref1', authors: ['Smith, J'], publication_year: '2020' }

const A = { label: 'A', value: '', key: 'column_a', locked: false, hasComments: false }
const B = { label: 'B', value: '', key: 'column_b', locked: false, hasComments: false }
const CONTEXT = {
  label: 'Context',
  value: '',
  key: 'context_extractedData',
  locked: true,
  isCamelot: true,
  hasComments: true,
  commentsKey: 'context_comments',
  commentsValue: ''
}
const NUEVA = { id: 'field_1', label: 'Nueva', value: 'texto', key: null, locked: false, hasComments: false }

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
      'b-modal': true,
      'b-form-group': true,
      'b-form-input': true,
      'b-form-textarea': true,
      'b-button': true,
      'b-row': true,
      'b-col': true,
      'font-awesome-icon': true,
      CustomFieldsManager: true
    }
  })
}

// Copias: el guardado le escribe la clave acuñada al campo, y un fixture compartido
// llegaría al test siguiente como columna ya creada.
async function guardarCon (wrapper, customFields) {
  await wrapper.setData({ isReadOnly: false, customFields: customFields.map(field => ({ ...field })) })
  wrapper.vm.performSave(true)
  // El camino con lock encadena acquire → altas → reorden → release → PATCH.
  for (let i = 0; i < 6; i++) await flushPromises()
}

function ordenDe (mockFn) {
  return mockFn.mock.invocationCallOrder[0]
}

describe('EditReferenceModal — la columna nueva queda primera', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
    columnService.reorderColumns.mockImplementation(() => Promise.resolve({ data: {} }))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('manda el orden con la nueva primera, justo después de crearla', async () => {
    wrapper = createWrapper()
    await guardarCon(wrapper, [NUEVA, A, CONTEXT, B])

    const nueva = columnService.addColumn.mock.calls[0][3]
    expect(columnService.reorderColumns).toHaveBeenCalledTimes(1)
    expect(columnService.reorderColumns).toHaveBeenCalledWith('isoqf_characteristics', 'doc1',
      [nueva, 'column_a', 'context_extractedData', 'context_comments', 'column_b'])
    expect(ordenDe(columnService.addColumn))
      .toBeLessThan(ordenDe(columnService.reorderColumns))
  })

  it('el orden sale antes del PATCH de la fila y con el lock de columnas tomado', async () => {
    wrapper = createWrapper()
    await guardarCon(wrapper, [NUEVA, A, CONTEXT, B])

    const patchFila = Api.patch.mock.invocationCallOrder[
      Api.patch.mock.calls.findIndex(([url]) => url.includes('/item/'))
    ]
    expect(ordenDe(columnService.reorderColumns)).toBeLessThan(patchFila)

    const suelta = LockService.releaseRef.mock.invocationCallOrder[
      LockService.releaseRef.mock.calls.findIndex(([key]) => key === 'doc1::fields')
    ]
    expect(ordenDe(columnService.reorderColumns)).toBeLessThan(suelta)
  })
})

describe('EditReferenceModal — «Move» se guarda', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
    columnService.reorderColumns.mockImplementation(() => Promise.resolve({ data: {} }))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('un orden distinto del guardado viaja, con cada _comments pegado a su dominio', async () => {
    wrapper = createWrapper()
    await guardarCon(wrapper, [B, CONTEXT, A])

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(columnService.reorderColumns).toHaveBeenCalledWith('isoqf_characteristics', 'doc1',
      ['column_b', 'context_extractedData', 'context_comments', 'column_a'])
  })

  it('toma y suelta el lock de columnas para reordenar', async () => {
    wrapper = createWrapper()
    await guardarCon(wrapper, [B, CONTEXT, A])

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'doc1::fields')
    expect(LockService.releaseRef).toHaveBeenCalledWith('doc1::fields')
  })

  // Es el caso de todo guardado por tecleo: sin esto cada pulsación tomaría el lock del
  // documento y mandaría un reorden que no cambia nada.
  it('si el orden es el guardado no manda nada ni toma el lock de columnas', async () => {
    wrapper = createWrapper()
    await guardarCon(wrapper, [A, CONTEXT, B])

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
    expect(LockService.acquireRef).not.toHaveBeenCalledWith('proj1', 'doc1::fields')
    expect(Api.patch.mock.calls.some(([url]) => url.includes('/item/'))).toBe(true)
  })

  // Documento anterior al 15-sep: las CAMELOT sólo existen en memoria.
  it('no menciona las claves CAMELOT virtuales', async () => {
    const viejo = {
      ...CHARS_DATA,
      fields: [
        ...CHARS_DATA.fields.filter(f => !f.key.startsWith('context_')),
        { key: 'context_extractedData', label: 'Context', virtual: true },
        { key: 'context_comments', label: 'Comments', virtual: true }
      ]
    }
    wrapper = createWrapper(viejo)
    await guardarCon(wrapper, [B, CONTEXT, A])

    expect(columnService.reorderColumns)
      .toHaveBeenCalledWith('isoqf_characteristics', 'doc1', ['column_b', 'column_a'])
  })

  // El orden es secundario: perder el texto del estudio porque el reorden falló sería
  // cambiar lo importante por lo accesorio. Pero el fallo tiene que verse.
  it('si el reorden falla, igual guarda la fila y lo avisa', async () => {
    columnService.reorderColumns.mockRejectedValueOnce({ response: { status: 500, data: {} } })
    wrapper = createWrapper()
    await guardarCon(wrapper, [B, CONTEXT, A])

    expect(Api.patch.mock.calls.some(([url]) => url.includes('/item/'))).toBe(true)
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('camelot.step_three.columns_modal.error_update')
    expect(LockService.releaseRef).toHaveBeenCalledWith('doc1::fields')
  })

  // La tabla todavía no existe: el POST manda `fields` completo, y en ese orden.
  it('con la tabla inexistente no reordena aparte', async () => {
    wrapper = createWrapper({ ...CHARS_DATA, id: '' })
    await guardarCon(wrapper, [B, CONTEXT, A])

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })
})
