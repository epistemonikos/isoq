// El alta de columna del modal deja de viajar dentro del PATCH del ítem.
//
// `performSave` no llevaba `fields` de paso: ERA el camino de creación de columnas de este
// modal. El botón «Add field» crea una entrada sin clave, `performSave` la acuñaba con
// `newCustomFieldKey()`, escribía el valor en el ítem y mandaba `fields: mergedFields` en
// el mismo PATCH para que la columna existiera.
//
// Backend va a empezar a IGNORAR `fields` en el endpoint por ítem (con warning, y un 400
// más adelante). El día que lo desplieguen, este camino deja de crear columnas en
// silencio: el ítem entra, `fields` se descarta, y el valor queda guardado bajo una clave
// que no está en `fields` — invisible en la tabla. Así que el alta se va al endpoint de
// columna, que es donde vive.
//
// Consecuencia que no existía antes: eran un request y ahora son dos, así que el primero
// puede fallar y el segundo entrar igual. La decisión tomada es ABORTAR TODO: no se
// guarda nada, el modal queda abierto y el texto sigue en el formulario. No se pierde
// trabajo — el costo es un reintento.
//
// La rama POST (`charsData.id` vacío: la tabla todavía no existe) NO cambia. Ese es el
// POST genérico, la puerta que backend dejó abierta a propósito, y ahí `fields` es
// legítimo porque manda el documento completo.
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
    Promise.resolve({ key, response: { data: {} } }))
}))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

const CAMELOT = {
  fields: [],
  categories: []
}

const CHARS_DATA = {
  id: 'doc1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_vieja', label: 'Contexto' }
  ],
  items: []
}

const REFERENCE = { id: 'ref1', authors: ['Smith, J'], publication_year: '2020' }

function createWrapper (charsData = CHARS_DATA) {
  return shallowMount(EditReferenceModal, {
    propsData: { reference: REFERENCE, charsData, camelot: CAMELOT },
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

// Deja el modal como queda tras apretar «Add field» y escribir una etiqueta: una entrada
// sin clave, que es lo que dispara el alta.
async function conColumnaNueva (wrapper, extra = []) {
  await wrapper.setData({
    isReadOnly: false,
    customFields: [
      { label: 'Contexto', value: 'ya existía', key: 'column_vieja', locked: false, hasComments: false },
      { label: 'Columna nueva', value: 'texto nuevo', key: null, locked: false, hasComments: false },
      ...extra
    ]
  })
}

describe('EditReferenceModal — el alta de columna sale del PATCH del ítem', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.acquireRef.mockResolvedValue({ success: true })
    columnService.addColumn.mockImplementation((collection, docId, label, key) =>
      Promise.resolve({ key, response: { data: {} } }))
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('crea la columna por el endpoint de columna, no dentro del PATCH', async () => {
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(columnService.addColumn).toHaveBeenCalledTimes(1)
    const [collection, docId, label, key] = columnService.addColumn.mock.calls[0]
    expect(collection).toBe('isoqf_characteristics')
    expect(docId).toBe('doc1')
    expect(label).toBe('Columna nueva')
    expect(key).toMatch(/^column_[0-9a-f]{24}$/)
  })

  it('el PATCH del ítem ya no lleva `fields`', async () => {
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    const patchItem = Api.patch.mock.calls.find(([url]) => url.includes('/item/'))
    expect(patchItem).toBeDefined()
    expect(patchItem[1]).not.toHaveProperty('fields')
  })

  it('el PATCH del ítem sí lleva el valor bajo la clave recién acuñada', async () => {
    // Es la mitad que hace que el alta sirva de algo: la columna existe y la celda tiene
    // contenido. Si la clave del alta y la del ítem no coincidieran, la columna saldría
    // vacía y nadie vería el error.
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    const [, key] = [null, columnService.addColumn.mock.calls[0][3]]
    const patchItem = Api.patch.mock.calls.find(([url]) => url.includes('/item/'))
    expect(patchItem[1][key]).toBe('texto nuevo')
  })

  it('las columnas se crean ANTES del PATCH del ítem', async () => {
    // Al revés, el ítem quedaría un instante con un valor bajo una columna inexistente, y
    // cualquier lector concurrente lo vería vacío.
    const orden = []
    columnService.addColumn.mockImplementation((c, d, l, key) => {
      orden.push('columna')
      return Promise.resolve({ key, response: { data: {} } })
    })
    Api.patch.mockImplementation((url) => {
      if (url.includes('/item/')) orden.push('item')
      return Promise.resolve({ data: {} })
    })
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(orden).toEqual(['columna', 'item'])
  })

  it('toma el lock del documento antes de crear, y lo suelta después', async () => {
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'doc1::fields')
    expect(LockService.releaseRef).toHaveBeenCalledWith('doc1::fields')
  })

  it('suelta el lock del documento SIN soltar el del estudio', async () => {
    // `releaseRef()` sin argumento suelta todos los locks de la pestaña. Si lo llamáramos
    // así, crear una columna le sacaría a esta persona el estudio que tiene abierto.
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    LockService.releaseRef.mock.calls.forEach(([arg]) => {
      expect(arg).toBe('doc1::fields')
    })
  })

  it('sin columna nueva no toca el lock del documento ni el endpoint de columna', async () => {
    // El lock se toma sólo si hay algo que crear. Sostenerlo en cada guardado bloquearía a
    // cualquiera que quiera renombrar una columna mientras alguien tiene un estudio
    // abierto, que puede ser un rato largo.
    wrapper = createWrapper()
    await wrapper.setData({
      isReadOnly: false,
      customFields: [
        { label: 'Contexto', value: 'texto', key: 'column_vieja', locked: false, hasComments: false }
      ]
    })

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(LockService.acquireRef).not.toHaveBeenCalledWith('proj1', 'doc1::fields')
    expect(LockService.releaseRef).not.toHaveBeenCalledWith('doc1::fields')
  })

  describe('cuando el lock del documento está tomado por otra persona', () => {
    beforeEach(() => {
      LockService.acquireRef.mockImplementation((projectId, ref) =>
        ref === 'doc1::fields'
          ? Promise.resolve({ success: false, lockedBy: 'Ana López' })
          : Promise.resolve({ success: true }))
    })

    it('no crea la columna', async () => {
      wrapper = createWrapper()
      await conColumnaNueva(wrapper)

      wrapper.vm.performSave(true)
      await flushPromises()

      expect(columnService.addColumn).not.toHaveBeenCalled()
    })

    it('aborta todo: tampoco manda el PATCH del ítem', async () => {
      // La decisión: o entra todo o nada, igual que antes de partir el request. El texto
      // sigue en el formulario, así que no se pierde trabajo — el costo es un reintento.
      wrapper = createWrapper()
      await conColumnaNueva(wrapper)

      wrapper.vm.performSave(true)
      await flushPromises()

      const patchItem = Api.patch.mock.calls.find(([url]) => url.includes('/item/'))
      expect(patchItem).toBeUndefined()
    })

    it('deja el modal abierto y no dice que guardó', async () => {
      wrapper = createWrapper()
      await conColumnaNueva(wrapper)

      wrapper.vm.performSave(true)
      await flushPromises()

      expect(wrapper.vm.$bvModal.hide).not.toHaveBeenCalled()
      expect(wrapper.vm.$notify.success).not.toHaveBeenCalled()
    })

    it('dice quién tiene las columnas, no «intente nuevamente»', async () => {
      // El consejo genérico es falso mientras el lock sea de otra persona: reintentar no
      // hace nada. Mismo criterio que `isLockRejection` aplica a los rechazos del
      // servidor, acá para un acquire que ni llegó a mandar el request.
      wrapper = createWrapper()
      await conColumnaNueva(wrapper)

      wrapper.vm.performSave(true)
      await flushPromises()

      const avisos = [
        ...wrapper.vm.$notify.warning.mock.calls,
        ...wrapper.vm.$notify.error.mock.calls
      ].map(([msg]) => msg)

      expect(avisos.join(' ')).toContain('Ana López')
      expect(avisos.join(' ')).not.toContain('notifications.save_error')
    })

    it('libera el botón de guardar para que se pueda reintentar', async () => {
      // `isSaving` en true para siempre dejaría el modal mudo: `performSave` sale por el
      // guard de la primera línea y el segundo intento no haría nada.
      wrapper = createWrapper()
      await conColumnaNueva(wrapper)

      wrapper.vm.performSave(true)
      await flushPromises()

      expect(wrapper.vm.isSaving).toBe(false)
    })
  })

  it('el guardado por inactividad persiste TODO antes de cerrar el modal', async () => {
    // El temporizador de inactividad existe para persistir y después soltar el lock, en
    // ese orden. Partir el guardado en dos requests metió un `await` antes del PATCH del
    // ítem, y con eso `hide()` y `resetModal()` pasaron a correr primero: el PATCH salía
    // después de liberar el lock, daba 409, y el texto se perdía. Justo lo que este
    // mecanismo previene.
    //
    // Mira el ÚLTIMO patch, no el primero: el primero ahora es el alta de la columna.
    wrapper = createWrapper()
    await conColumnaNueva(wrapper)
    wrapper.vm.onFieldChanged()

    await wrapper.vm.onInactivityExpired()
    await flushPromises()

    const ordenes = Api.patch.mock.invocationCallOrder
    const ordenHide = wrapper.vm.$bvModal.hide.mock.invocationCallOrder[0]
    expect(ordenes.length).toBeGreaterThan(0)
    expect(ordenHide).toBeDefined()
    expect(Math.max(...ordenes)).toBeLessThan(ordenHide)
  })

  it('con la tabla todavía inexistente sigue por el POST, que sí manda fields', async () => {
    // La puerta que backend dejó abierta a propósito: el POST genérico manda el documento
    // completo, así que ahí `fields` no es un colado sino el contenido.
    wrapper = createWrapper({ ...CHARS_DATA, id: null })
    await conColumnaNueva(wrapper)

    wrapper.vm.performSave(true)
    await flushPromises()

    expect(columnService.addColumn).not.toHaveBeenCalled()
    expect(Api.post).toHaveBeenCalled()
    const [, body] = Api.post.mock.calls[0]
    expect(body).toHaveProperty('fields')
  })
})
