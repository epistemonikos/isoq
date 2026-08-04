// Las claves de columna que genera el cliente tienen que ser aleatorias.
//
// Los dos componentes que crean columnas derivaban la clave del reloj:
//   ManageColumnsButton  → `column_${Date.now()}_${Math.random()...}`
//   EditReferenceModal   → `column_${Date.now()}_${index}`   ← ni siquiera aleatorio
//
// El segundo colisiona de verdad: dos personas agregando su primera columna en el mismo
// milisegundo obtienen `column_<t>_0` las dos, y una pisa a la otra. Y el backend pide
// explícitamente ≥12 bytes aleatorios para aceptar claves del cliente
// (docs/respuesta-backend-columnas-contrato-ejecucion.md §B1), porque de eso depende que
// el alta por `PATCH` sea idempotente.
import { shallowMount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} }))
}))

const CLAVE_ALEATORIA = /^column_[0-9a-f]{24}$/

const MOCKS = {
  $t: key => key,
  $route: { params: { org_id: 'org1', id: 'proj1' } },
  $bvModal: { show: jest.fn(), hide: jest.fn() },
  $bvToast: { toast: jest.fn() },
  $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
}

describe('ManageColumnsButton — clave de una columna nueva', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(ManageColumnsButton, {
      propsData: {
        charsData: { id: 'char1', fields: [{ key: 'authors', label: 'Authors' }], items: [] },
        visibleColumnKeys: ['authors'],
        canEdit: true
      },
      mocks: MOCKS,
      stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
    })
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  it('genera una clave aleatoria de 24 hex, no derivada del reloj', async () => {
    // Una columna sin `key` es una columna nueva: la agregó el usuario en el modal.
    await wrapper.setData({ columnDefinitions: [{ label: 'Contexto' }] })

    wrapper.vm.handleSaveColumns()

    const enviados = Api.patch.mock.calls[0][1].fields
    const nueva = enviados.find(f => f.label === 'Contexto')
    expect(nueva.key).toMatch(CLAVE_ALEATORIA)
  })

  it('dos columnas nuevas guardadas juntas no comparten clave', async () => {
    await wrapper.setData({
      columnDefinitions: [{ label: 'Contexto' }, { label: 'Método' }]
    })

    wrapper.vm.handleSaveColumns()

    const enviados = Api.patch.mock.calls[0][1].fields
    const a = enviados.find(f => f.label === 'Contexto').key
    const b = enviados.find(f => f.label === 'Método').key
    expect(a).not.toBe(b)
  })

  it('no le toca la clave a una columna que ya existe', async () => {
    await wrapper.setData({
      columnDefinitions: [{ key: 'column_1', label: 'Renombrada' }]
    })

    wrapper.vm.handleSaveColumns()

    const enviados = Api.patch.mock.calls[0][1].fields
    expect(enviados.find(f => f.label === 'Renombrada').key).toBe('column_1')
  })
})

describe('EditReferenceModal — clave de una columna nueva', () => {
  let wrapper

  function createWrapper () {
    return shallowMount(EditReferenceModal, {
      propsData: {
        reference: { id: 'R1', authors: ['Smith, J'], publication_year: '2020' },
        charsData: { id: 'char1', fields: [{ key: 'authors', label: 'Authors' }], items: [] },
        canEdit: true
      },
      mocks: MOCKS,
      stubs: {
        'b-button': true,
        'b-modal': true,
        'b-form-input': true,
        'b-form-textarea': true,
        'font-awesome-icon': true,
        'CustomFieldsManager': true
      }
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => {
    if (wrapper) wrapper.destroy()
  })

  it('genera una clave aleatoria de 24 hex, no `column_<timestamp>_<index>`', async () => {
    await wrapper.setData({
      customFields: [{ label: 'Contexto', value: 'texto' }]
    })

    await wrapper.vm.performSave(false)

    const enviados = (Api.patch.mock.calls[0] || Api.post.mock.calls[0])[1]
    const fields = enviados.fields || []
    const nueva = fields.find(f => f.label === 'Contexto')
    expect(nueva.key).toMatch(CLAVE_ALEATORIA)
  })

  // El caso que colisionaba de verdad: el índice hacía la clave predecible, así que dos
  // usuarios agregando su primera columna a la vez obtenían la misma.
  it('dos columnas nuevas no comparten clave', async () => {
    await wrapper.setData({
      customFields: [
        { label: 'Contexto', value: 'a' },
        { label: 'Método', value: 'b' }
      ]
    })

    await wrapper.vm.performSave(false)

    const enviados = (Api.patch.mock.calls[0] || Api.post.mock.calls[0])[1]
    const fields = enviados.fields || []
    const a = fields.find(f => f.label === 'Contexto').key
    const b = fields.find(f => f.label === 'Método').key
    expect(a).not.toBe(b)
    expect(a).toMatch(CLAVE_ALEATORIA)
    expect(b).toMatch(CLAVE_ALEATORIA)
  })
})
