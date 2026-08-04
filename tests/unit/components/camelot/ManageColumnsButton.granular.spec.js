// El modal de columnas del Paso 3 CAMELOT pasa a aplicar cada operación por separado.
//
// Antes acumulaba todo en memoria y un botón "Guardar cambios" mandaba el documento con
// `fields` completo — Last-Write-Wins: con una copia obsoleta se perdía la columna que
// otra persona acababa de crear. Ahora cada acción va por su endpoint granular.
//
// El reorden es la excepción y se acumula hasta el cierre: es lo único conmutativo del
// conjunto —el backend acepta `order` como subconjunto, así que mandarlo una vez al final
// da el mismo resultado que mandarlo en cada arrastre— y así el alta no necesita un
// segundo request para dejar la columna donde el usuario la ve.
import { shallowMount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import columnService from '@/services/columnService'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

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
    ensureTableDocument: jest.fn(() => Promise.resolve('char_creado')),
    movableKeys: jest.requireActual('@/services/columnService').movableKeys
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
    { key: 'context_extractedData', label: 'CAMELOT' },
    { key: 'context_comments', label: 'Comentarios' }
  ],
  items: []
}

function createWrapper (charsData = CHARS) {
  return shallowMount(ManageColumnsButton, {
    propsData: { charsData, visibleColumnKeys: ['authors', 'column_a'], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: {
        show: jest.fn(),
        hide: jest.fn(),
        msgBoxConfirm: jest.fn(() => Promise.resolve(true))
      },
      $bvToast: { toast: jest.fn() }
    },
    stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
  })
}

describe('ManageColumnsButton — alta y renombrado al salir del campo', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('una columna sin clave se crea con addColumn', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Nueva' })

    expect(columnService.addColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', 'Nueva')
    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  // La clave que devuelve el servidor tiene que quedar en el estado local: sin ella el
  // reorden posterior no puede mencionar la columna, y un segundo blur la crearía de nuevo.
  it('guarda la clave devuelta en la definición local', async () => {
    await wrapper.setData({ columnDefinitions: [{ id: 'f1', label: 'Nueva' }] })

    await wrapper.vm.onFieldCommitted(wrapper.vm.columnDefinitions[0])
    await flushPromises()

    expect(wrapper.vm.columnDefinitions[0].key).toBe('column_nueva')
  })

  it('una columna con clave se renombra', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro título' })

    expect(columnService.renameColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', 'column_a', 'Otro título')
    expect(columnService.addColumn).not.toHaveBeenCalled()
  })

  it('nunca manda el documento completo por el PATCH genérico', async () => {
    const Api = require('@/utils/Api')

    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    expect(Api.patch).not.toHaveBeenCalled()
  })
})

describe('ManageColumnsButton — borrado con confirmación', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // El DELETE borra el contenido de esa columna en todas las filas, y ya no hay un botón
  // de guardar en el medio: el clic es destructivo en el momento.
  it('pide confirmación antes de borrar', async () => {
    await wrapper.setData({ columnDefinitions: [{ id: 'f1', key: 'column_a', label: 'Contexto' }] })

    await wrapper.vm.onRemoveRequested({ id: 'f1', key: 'column_a', label: 'Contexto' })

    expect(wrapper.vm.$bvModal.msgBoxConfirm).toHaveBeenCalled()
    expect(columnService.deleteColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', 'column_a')
  })

  it('no borra nada si el usuario cancela la confirmación', async () => {
    wrapper.vm.$bvModal.msgBoxConfirm.mockResolvedValueOnce(false)
    await wrapper.setData({ columnDefinitions: [{ id: 'f1', key: 'column_a', label: 'Contexto' }] })

    await wrapper.vm.onRemoveRequested({ id: 'f1', key: 'column_a', label: 'Contexto' })

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.columnDefinitions).toHaveLength(1)
  })

  it('quita la columna del estado local recién después de borrarla', async () => {
    await wrapper.setData({
      columnDefinitions: [
        { id: 'f1', key: 'column_a', label: 'Contexto' },
        { id: 'f2', key: 'column_b', label: 'Método' }
      ]
    })

    await wrapper.vm.onRemoveRequested({ id: 'f1', key: 'column_a', label: 'Contexto' })
    await flushPromises()

    expect(wrapper.vm.columnDefinitions.map(c => c.key)).toEqual(['column_b'])
  })

  // Una columna que nunca llegó al servidor no tiene nada que borrar allá, y `DELETE`
  // sobre `undefined` pegaría en una URL inválida.
  it('una columna sin clave se descarta sin llamar al servidor', async () => {
    await wrapper.setData({ columnDefinitions: [{ id: 'f1', label: '' }] })

    await wrapper.vm.onRemoveRequested({ id: 'f1', label: '' })

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.columnDefinitions).toHaveLength(0)
  })
})

describe('ManageColumnsButton — el reorden se manda al cerrar', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('arrastrar no dispara ningún request', () => {
    wrapper.vm.onOrderChanged(['column_a', 'context_extractedData'])

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  it('al cerrar manda el último orden arrastrado', async () => {
    wrapper.vm.openColumnsModal()
    wrapper.vm.onOrderChanged(['column_a', 'context_extractedData'])
    wrapper.vm.onOrderChanged(['context_extractedData', 'column_a'])

    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns).toHaveBeenCalledTimes(1)
    expect(columnService.reorderColumns)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', ['context_extractedData', 'column_a'])
  })

  it('no manda nada al cerrar si no se arrastró', async () => {
    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns).not.toHaveBeenCalled()
  })

  // Si otra persona borró una columna mientras el modal estaba abierto, mencionarla en
  // `order` es 400 por clave desconocida. Las claves que ya no están en el documento se
  // filtran contra lo que el usuario tiene a la vista.
  it('descarta del orden las columnas que ya no existen localmente', async () => {
    await wrapper.setData({ columnDefinitions: [{ id: 'f1', key: 'column_a', label: 'Contexto' }] })
    wrapper.vm.onOrderChanged(['column_a', 'column_borrada_por_otro'])

    await wrapper.vm.flushPendingOrder()

    expect(columnService.reorderColumns)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char1', ['column_a'])
  })
})

// El gating venía cubierto sobre `handleSaveColumns`, que ya no existe: las tres rutas
// nuevas tienen que respetarlo igual. Los casos con canEdit true de más arriba son la otra
// mitad del par — demuestran que sin el gate el servicio sí se llamaría.
describe('ManageColumnsButton — un usuario de solo lectura no escribe', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ManageColumnsButton, {
      propsData: { charsData: CHARS, visibleColumnKeys: [], canEdit: false },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('no crea ni renombra', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Nueva' })
    await wrapper.vm.onFieldCommitted({ id: 'f2', key: 'column_a', label: 'Otro' })

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  it('no borra ni pide confirmación', async () => {
    await wrapper.vm.onRemoveRequested({ id: 'f1', key: 'column_a', label: 'Contexto' })

    expect(wrapper.vm.$bvModal.msgBoxConfirm).not.toHaveBeenCalled()
    expect(columnService.deleteColumn).not.toHaveBeenCalled()
  })

  it('tampoco toma el lock', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    expect(LockService.acquireRef).not.toHaveBeenCalled()
  })
})

describe('ManageColumnsButton — lock del documento', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  // Se toma al primer cambio real y no al abrir: quien sólo fue a mirar las columnas no
  // debe bloquear a nadie. Mismo criterio que el Paso 4.
  it('toma <doc_id>::fields antes de la primera operación', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'char1::fields')
  })

  it('no lo pide de nuevo en la segunda operación', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Y otro más' })

    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })

  it('no escribe si el lock lo tiene otra persona', async () => {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })

    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    expect(columnService.renameColumn).not.toHaveBeenCalled()
  })

  it('lo suelta al cerrar el modal', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    await wrapper.vm.onModalHidden()

    expect(LockService.releaseRef).toHaveBeenCalledWith('char1::fields')
  })

  it('no suelta nada si nunca lo tomó', async () => {
    await wrapper.vm.onModalHidden()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})

// El botón vive en el Paso 3 de un proyecto que puede no tener todavía documento de tabla:
// en CAMELOT las filas son virtuales, así que nada lo crea hasta que alguien escribe. El
// guardado en bloque anterior lo creaba con un POST; las rutas granulares necesitan un
// `<doc_id>`, así que hay que resolverlo antes de la primera operación o la primera columna
// de un proyecto nuevo sería imposible de agregar.
describe('ManageColumnsButton — cuando el documento de la tabla no existe', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper({ fields: [], items: [] })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('lo resuelve antes de crear la columna', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Primera' })

    expect(columnService.ensureTableDocument)
      .toHaveBeenCalledWith('isoqf_characteristics', 'org1', 'proj1')
    expect(columnService.addColumn)
      .toHaveBeenCalledWith('isoqf_characteristics', 'char_creado', 'Primera')
  })

  it('toma el lock del documento recién resuelto', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Primera' })

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'char_creado::fields')
  })

  it('no lo resuelve dos veces', async () => {
    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Primera' })
    await wrapper.vm.onFieldCommitted({ id: 'f2', label: 'Segunda' })

    expect(columnService.ensureTableDocument).toHaveBeenCalledTimes(1)
  })

  it('no escribe nada si el documento no se pudo resolver', async () => {
    columnService.ensureTableDocument.mockResolvedValueOnce(null)

    await wrapper.vm.onFieldCommitted({ id: 'f1', label: 'Primera' })

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
  })

  // Con el documento ya en las props no hay nada que resolver: un GET extra por operación
  // sería gratuito y, con duplicados en la base, podría devolver otro documento.
  it('no lo consulta cuando charsData ya trae el id', async () => {
    wrapper.destroy()
    wrapper = createWrapper()

    await wrapper.vm.onFieldCommitted({ id: 'f1', key: 'column_a', label: 'Otro' })

    expect(columnService.ensureTableDocument).not.toHaveBeenCalled()
  })
})
