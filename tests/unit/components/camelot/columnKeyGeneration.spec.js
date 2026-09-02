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
// `/isoqf_characteristics/<doc>/field/<clave>` — el endpoint de alta de columna.
const CLAVE_EN_URL = /\/field\/(column_[0-9a-f]+)$/

const MOCKS = {
  $t: key => key,
  $route: { params: { org_id: 'org1', id: 'proj1' } },
  $bvModal: { show: jest.fn(), hide: jest.fn() },
  $bvToast: { toast: jest.fn() },
  $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
}

// La mitad de ManageColumnsButton que había acá desapareció con `handleSaveColumns`: ese
// componente ya no genera claves, las pide a `columnService.addColumn`. El formato de la
// clave se verifica en tests/unit/utils/customFieldsHelper.newKey.spec.js y en
// tests/unit/services/columnService.spec.js; que el alta pase por ahí, en
// ManageColumnsButton.granular.spec.js.

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

  // La clave ya no viaja en el `fields` del PATCH del ítem: viaja en la URL del endpoint
  // de columna, que es por donde el alta pasa desde que salió de ahí. Es la misma
  // migración que le tocó a ManageColumnsButton (ver la nota de arriba), un componente
  // después. La garantía verificada no cambió — sólo el lugar donde se lee.
  function clavesCreadas () {
    return Api.patch.mock.calls
      .map(([url]) => (CLAVE_EN_URL.exec(url) || [])[1])
      .filter(Boolean)
  }

  it('genera una clave aleatoria de 24 hex, no `column_<timestamp>_<index>`', async () => {
    await wrapper.setData({
      customFields: [{ label: 'Contexto', value: 'texto' }]
    })

    await wrapper.vm.performSave(false)

    const claves = clavesCreadas()
    expect(claves).toHaveLength(1)
    expect(claves[0]).toMatch(CLAVE_ALEATORIA)
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

    const [a, b] = clavesCreadas()
    expect(a).not.toBe(b)
    expect(a).toMatch(CLAVE_ALEATORIA)
    expect(b).toMatch(CLAVE_ALEATORIA)
  })
})
