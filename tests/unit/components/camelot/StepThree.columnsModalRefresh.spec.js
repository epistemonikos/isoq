// El refresco por `last_update` no debe aplicarse con el modal de columnas abierto.
//
// Encontrado probando en el navegador: al guardar una columna el modal se cerraba solo.
// La causa es que `hasOpenEditor()` sólo miraba `currentItem`, o sea el modal de edición de
// referencia, así que el refresco se aplicaba, recargaba `charsData` y el modal se caía.
//
// Y el disparador es la propia escritura: cada operación de columna sella `last_update` en
// el proyecto, y `projectFreshnessMixin` lo pollea, así que quien edita columnas se
// autoexpulsa del modal sin que haya ningún otro usuario involucrado.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))
jest.mock('@/mixins/camelotMixin', () => ({ camelotMixin: { computed: {}, methods: {}, data: () => ({}) } }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return shallowMount(StepThree, {
    localVue,
    propsData: { references: [], type: 'isoqf_characteristics' },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    }
  })
}

describe('StepThree — el modal de columnas cuenta como editor abierto', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('sin nada abierto, el refresco puede aplicarse', () => {
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })

  it('con el modal de columnas abierto, el refresco se posterga', async () => {
    await wrapper.setData({ columnsModalOpen: true })

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })

  it('al cerrarse el modal vuelve a permitirlo', async () => {
    await wrapper.setData({ columnsModalOpen: true })

    wrapper.vm.onColumnsModalClosed()

    expect(wrapper.vm.columnsModalOpen).toBe(false)
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
  })

  // Sigue valiendo para el editor de referencia, que era el único caso cubierto.
  it('el editor de referencia sigue contando', async () => {
    await wrapper.setData({ currentItem: { ref_id: 'R1' } })

    expect(wrapper.vm.hasOpenEditor()).toBe(true)
  })
})
