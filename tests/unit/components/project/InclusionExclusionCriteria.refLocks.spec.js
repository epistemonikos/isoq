import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import InclusionExclusionCriteria from '@/components/project/InclusionExclusionCriteria.vue'
import LockService from '@/services/lockService'

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn(() => Promise.resolve([])),
  refLocks: new Map()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Doble del hijo: sólo interesa qué props recibe. El real es un componente asíncrono,
// que shallowMount no stubea por sí solo.
const CriteriaStub = {
  name: 'criteria',
  props: ['canEdit', 'label', 'description', 'dataTxt', 'criteria', 'refLocks'],
  template: '<div class="criteria-stub"></div>'
}

// Cada wrapper vivo escucha 'ref-locks-changed' en window; sin destruirlos, los de un
// test contestan el evento del siguiente y el conteo de llamadas deja de significar algo.
const mounted = []

function createWrapper () {
  const wrapper = shallowMount(InclusionExclusionCriteria, {
    localVue,
    propsData: {
      canEdit: true,
      project: { id: 'proj1', inclusion: 'texto in', exclusion: 'texto ex' },
      ui: { project: { show_criteria: true } }
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1' } }
    },
    stubs: {
      criteria: CriteriaStub,
      'b-container': { template: '<div><slot /></div>' },
      'b-row': { template: '<div><slot /></div>' },
      'b-col': { template: '<div><slot /></div>' }
    }
  })
  mounted.push(wrapper)
  return wrapper
}

const boxFor = (wrapper, field) => wrapper.findAllComponents(CriteriaStub)
  .wrappers.find(w => w.props('criteria') === field)

beforeEach(() => {
  jest.clearAllMocks()
  LockService.refLocks.clear()
  LockService.fetchRefLocks.mockResolvedValue([])
})

afterEach(() => {
  mounted.splice(0).forEach(wrapper => wrapper.destroy())
  jest.useRealTimers()
})

describe('InclusionExclusionCriteria.vue — sondeo de locks del Paso 2', () => {
  it('consulta los locks del proyecto al montarse', async () => {
    createWrapper()
    await flushPromises()

    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
  })

  it('vuelve a consultarlos cada 15 s, igual que los Pasos 3 y 4', async () => {
    jest.useFakeTimers()
    createWrapper()

    jest.advanceTimersByTime(30000)

    expect(LockService.fetchRefLocks).toHaveBeenCalledTimes(3)
  })

  // Quién es el dueño de cada caja lo decide la propia caja (ver Criteria.refLock.spec):
  // acá sólo importa que el listado sondeado llegue completo a las dos.
  it('difunde el listado de locks vigentes a las dos cajas', async () => {
    const locks = [{ ref_id: 'criteria::inclusion', user_name: 'Ana Pérez' }]
    LockService.fetchRefLocks.mockResolvedValue(locks)
    const wrapper = createWrapper()
    await flushPromises()

    expect(boxFor(wrapper, 'inclusion').props('refLocks')).toEqual(locks)
    expect(boxFor(wrapper, 'exclusion').props('refLocks')).toEqual(locks)
  })

  it('vuelve a sondear cuando una caja avisa que le rechazaron el lock', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    LockService.fetchRefLocks.mockClear()

    boxFor(wrapper, 'exclusion').vm.$emit('lock-denied')

    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
  })

  it('refresca sin esperar el tick cuando este usuario toma o suelta un lock', async () => {
    createWrapper()
    await flushPromises()
    LockService.fetchRefLocks.mockClear()

    window.dispatchEvent(new CustomEvent('ref-locks-changed'))

    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
  })

  it('corta el sondeo y deja de escuchar al destruirse', async () => {
    jest.useFakeTimers()
    const wrapper = createWrapper()
    wrapper.destroy()
    LockService.fetchRefLocks.mockClear()

    jest.advanceTimersByTime(60000)
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))

    expect(LockService.fetchRefLocks).not.toHaveBeenCalled()
  })
})
