import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import OfflineIndicator from '@/components/OfflineIndicator.vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  isOnline: jest.fn(() => true),
  setOnline: jest.fn(),
  syncPendingOperations: jest.fn().mockResolvedValue(undefined),
  getPendingCount: jest.fn().mockResolvedValue(0)
}))

// Interpola de verdad, a diferencia del `(key) => key` de los otros specs: lo que este
// aviso tiene que probar es que el nombre perdido LLEGA al texto, y con la traducción
// devolviendo la clave a secas un `{name}` sin pasar se vería idéntico a uno pasado.
const translate = (key, params) => (params ? `${key}|${JSON.stringify(params)}` : key)

function createWrapper () {
  const wrapper = shallowMount(OfflineIndicator, {
    localVue,
    mocks: { $t: translate, $store: { commit: jest.fn(), state: { isOnline: true } } },
    stubs: { 'font-awesome-icon': true }
  })
  const toast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, toast }
}

// Cuando la cola descarta un rename por nombre duplicado no hay ningún editor abierto:
// la persona lo escribió sin conexión y el modal se cerró hace rato. Este es el único
// componente montado siempre, así que el aviso vive acá o no se ve.
describe('OfflineIndicator.vue — aviso de nombre duplicado al sincronizar', () => {
  afterEach(() => jest.restoreAllMocks())

  it('nombra el texto que se perdió', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('duplicate-key-conflict', {
      detail: { endpoint: '/api/isoqf_list_categories/c1', text: '7. Skills', source: 'replay' }
    }))

    expect(toast).toHaveBeenCalledWith(
      `offline.duplicateKeyConflict|${JSON.stringify({ name: '7. Skills' })}`,
      expect.objectContaining({ title: 'offline.duplicateKeyConflictTitle', noAutoHide: true })
    )
    wrapper.destroy()
  })

  // Los 11 documentos medidos sin campo `text` prueban que un nombre vacío es un estado
  // real de esta colección, no una hipótesis. Un aviso que diga «"" ya existe» no le
  // explica nada a nadie.
  it('usa el texto sin nombre cuando el payload no lo trae', () => {
    const { wrapper, toast } = createWrapper()

    window.dispatchEvent(new CustomEvent('duplicate-key-conflict', {
      detail: { endpoint: '/api/isoqf_list_categories/c1', text: '', source: 'replay' }
    }))

    expect(toast).toHaveBeenCalledWith(
      'offline.duplicateKeyConflictNoName',
      expect.objectContaining({ title: 'offline.duplicateKeyConflictTitle' })
    )
    wrapper.destroy()
  })

  it('deja de escuchar al destruirse, para no avisar dos veces con dos vistas', () => {
    const { wrapper, toast } = createWrapper()
    wrapper.destroy()

    window.dispatchEvent(new CustomEvent('duplicate-key-conflict', {
      detail: { endpoint: '/api/isoqf_list_categories/c1', text: '7. Skills', source: 'replay' }
    }))

    expect(toast).not.toHaveBeenCalled()
  })
})
