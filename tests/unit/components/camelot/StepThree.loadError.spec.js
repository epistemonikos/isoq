import { mount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

/**
 * Una carga que falla no se muestra como vacío (CLAUDE.md, MUST-USE PATTERNS). El `.catch`
 * sólo apagaba el spinner, y sin referencias la pantalla decía «no hay registros»: la
 * persona leía que el Paso 3 estaba vacío cuando lo que pasó es que no se pudo leer.
 */
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return mount(StepThree, {
    localVue,
    propsData: { references: [], type: 'isoqf_characteristics' },
    mocks: { $t: key => key, $route: { params: { id: 'proj1', org_id: 'org1' } } },
    stubs: {
      ManageColumnsButton: true, ToggleConcernsButton: true, TableColumnFilter: true,
      ExportCSVButton: true, EditReferenceModal: true, 'font-awesome-icon': true
    }
  })
}

describe('StepThree — carga fallida', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
  })

  it('muestra el cartel con Reintentar, no «no hay registros»', async () => {
    Api.get.mockRejectedValue(new Error('500'))
    const wrapper = createWrapper()
    await flushPromises()

    expect(wrapper.find('[data-test="step-three-load-error"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('camelot.step_three.no_records')
    wrapper.destroy()
  })

  it('Reintentar vuelve a pedir y, si sale bien, el cartel se va', async () => {
    Api.get.mockRejectedValueOnce(new Error('500'))
    const wrapper = createWrapper()
    await flushPromises()
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.find('[data-test="step-three-load-retry"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="step-three-load-error"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
