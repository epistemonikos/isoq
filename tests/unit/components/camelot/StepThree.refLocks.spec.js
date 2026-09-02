import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
// refLockStateMixin usa el default export (LockService.refLocks) y studyLockState, no
// sólo fetchRefLocks: con el mock plano anterior, foreignRefLocks explotaba en
// `.refLocks.has` y studyLockStateOf llamaba undefined().
jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      refLocks: new Map()
    }
  }
})
jest.mock('@/mixins/camelotMixin', () => ({ camelotMixin: { computed: {}, methods: {}, data: () => ({}) } }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper (references = []) {
  return shallowMount(StepThree, {
    localVue,
    propsData: {
      references,
      type: 'isoqf_characteristics'
    },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    }
  })
}

describe('StepThree.vue — isRefLocked()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('retorna true cuando ref_id está en activeRefLocks', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    expect(wrapper.vm.isRefLocked('ref2')).toBe(false)
    wrapper.destroy()
  })

  // El botón Edit se derivaba de una comparación plana `l.ref_id === refId`, que ni veía
  // un estudio bloqueado a través de una de sus celdas (endpoint D) ni distinguía los
  // locks propios de los ajenos — y `/refs` devuelve también los propios.
  it('un lock PROPIO no deshabilita el estudio', async () => {
    const wrapper = createWrapper()
    LockService.refLocks.set('ref1', 'proj1')
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Yo Mismo' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(false)
    expect(wrapper.vm.refLockedByName('ref1')).toBe('')
    LockService.refLocks.clear()
    wrapper.destroy()
  })

  it('una CELDA ajena del estudio sí lo deshabilita, y lo nombra', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1::s0::o2', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(true)
    expect(wrapper.vm.refLockedByName('ref1')).toContain('Ana')
    wrapper.destroy()
  })

  it('no confunde un estudio cuyo id empieza igual que otro', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1X::s0::o0', user_name: 'Ana' }] })
    expect(wrapper.vm.isRefLocked('ref1')).toBe(false)
    wrapper.destroy()
  })

  it('refLockedByName retorna el nombre del usuario que tiene el lock', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana López' }] })
    expect(wrapper.vm.refLockedByName('ref1')).toContain('Ana López')
    wrapper.destroy()
  })

  it('fetchAndUpdateRefLocks llama LockService.fetchRefLocks con el projectId', async () => {
    LockService.fetchRefLocks.mockResolvedValue([{ ref_id: 'ref1', user_name: 'Ana' }])
    const wrapper = createWrapper()
    await wrapper.vm.fetchAndUpdateRefLocks()
    await flushPromises()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    expect(wrapper.vm.activeRefLocks).toEqual([{ ref_id: 'ref1', user_name: 'Ana' }])
    wrapper.destroy()
  })

  it('re-pollea al recibir el evento window ref-locks-changed', async () => {
    const wrapper = createWrapper()
    await flushPromises()
    LockService.fetchRefLocks.mockClear()
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    await flushPromises()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })
})

// "que la lista de estudios se vaya refrescando": the 15s tick that already polls locks
// also asks whether the project changed, so B sees what A saved without reloading.
describe('StepThree.vue — refresco por last_update', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.fetchRefLocks.mockResolvedValue([])
  })

  it('el tick de polling también consulta la frescura del proyecto', async () => {
    const wrapper = createWrapper()
    const spy = jest.spyOn(wrapper.vm, 'checkProjectFreshness').mockResolvedValue()

    await wrapper.vm.fetchAndUpdateRefLocks()

    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
    wrapper.destroy()
  })

  it('recargar significa releer la tabla de características', async () => {
    const wrapper = createWrapper()
    const load = jest.spyOn(wrapper.vm, 'loadCharacteristicsData').mockImplementation(() => {})

    wrapper.vm.applyProjectRefresh()

    expect(load).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('el modal de un estudio abierto cuenta como editor abierto', async () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.hasOpenEditor()).toBe(false)
    await wrapper.setData({ currentItem: { id: 'ref1' } })
    expect(wrapper.vm.hasOpenEditor()).toBe(true)
    wrapper.destroy()
  })

  it('cerrar el modal del estudio aplica el refresco pendiente y limpia la selección', async () => {
    const wrapper = createWrapper()
    const apply = jest.spyOn(wrapper.vm, 'applyProjectRefresh').mockImplementation(() => {})
    await wrapper.setData({ currentItem: { id: 'ref1' }, pendingRefresh: true })

    wrapper.vm.onReferenceModalClosed()

    expect(wrapper.vm.currentItem).toBeNull()
    expect(apply).toHaveBeenCalled()
    wrapper.destroy()
  })
})
