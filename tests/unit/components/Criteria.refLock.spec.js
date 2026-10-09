import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import Criteria from '@/components/Criteria.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  refLocks: new Map()
}))

jest.mock('@/utils/Api', () => ({
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// mount y no shallowMount: los stubs automáticos de vue-test-utils no reciben los
// listeners `.native`, y el foco de la caja es justamente lo que dispara el lock.
// Con el textarea real el test prueba el cableado, no sólo el método.
function createWrapper (props = {}) {
  return mount(Criteria, {
    localVue,
    propsData: {
      canEdit: true,
      label: 'Inclusion criteria',
      description: 'placeholder',
      dataTxt: 'texto inicial',
      criteria: 'inclusion',
      ...props
    },
    mocks: {
      $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
      $route: { params: { id: 'proj1' } },
      $store: { state: { user: { first_name: 'damian', last_name: 'garrido' } } }
    }
  })
}

const textarea = wrapper => wrapper.find('textarea')

// `trigger('focus')` de vue-test-utils no llega al listener `.native` en este jsdom
// (el evento que fabrica no lo despierta); un `dispatchEvent` normal sí. Es la misma
// ruta que recorre el navegador, así que el test sigue probando el cableado real.
const fire = (wrapper, type) => {
  textarea(wrapper).element.dispatchEvent(new Event(type))
  return wrapper.vm.$nextTick()
}

beforeEach(() => {
  jest.clearAllMocks()
  LockService.acquireRef.mockResolvedValue({ success: true })
})

describe('Criteria.vue — adquisición del lock', () => {
  it('pide el lock de su propio criterio al enfocar la caja', async () => {
    const wrapper = createWrapper({ criteria: 'exclusion' })

    await fire(wrapper, 'focus')
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'criteria::exclusion')
  })

  it('no pide el lock cuando el usuario no tiene permiso de escritura', async () => {
    const wrapper = createWrapper({ canEdit: false })

    await fire(wrapper, 'focus')
    await flushPromises()

    expect(LockService.acquireRef).not.toHaveBeenCalled()
  })

  it('deja la caja en solo lectura y nombra a quien la tiene cuando el lock está tomado', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = createWrapper()

    await fire(wrapper, 'focus')
    await flushPromises()

    expect(wrapper.vm.isReadOnly).toBe(true)
    expect(textarea(wrapper).attributes('disabled')).toBeTruthy()
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  it('no anuncia dueño cuando el rechazo es por permisos revocados, no por otro usuario', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    const wrapper = createWrapper()

    await fire(wrapper, 'focus')
    await flushPromises()

    expect(wrapper.vm.isReadOnly).toBe(true)
    expect(wrapper.vm.blockedBy).toBeNull()
  })

  it('no guarda mientras la caja está en solo lectura por un lock ajeno', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = createWrapper()

    await fire(wrapper, 'focus')
    await flushPromises()
    wrapper.vm.criteriaAction('inclusion')

    expect(Api.patch).not.toHaveBeenCalled()
  })
})

describe('Criteria.vue — liberación del lock', () => {
  afterEach(() => { jest.useRealTimers() })

  // Los timers falsos se encienden DESPUÉS del focus: los modernos de Jest 27 también
  // falsean `process.nextTick`, del que depende flushPromises, así que encenderlos antes
  // deja el await del acquire colgado para siempre. La gracia arranca recién en el blur.
  async function focused (props = {}) {
    const wrapper = createWrapper(props)
    await fire(wrapper, 'focus')
    await flushPromises()
    jest.useFakeTimers()
    return wrapper
  }

  it('no suelta la caja apenas el cursor sale de ella', async () => {
    const wrapper = await focused()

    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(4999)

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('suelta la caja cuando vence la gracia de 5 s', async () => {
    const wrapper = await focused()

    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(5000)

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
  })

  it('volver a la caja antes de que venza la gracia cancela la liberación', async () => {
    const wrapper = await focused()

    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(3000)
    await fire(wrapper, 'focus')
    jest.advanceTimersByTime(5000)

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  // Al cambiar de paso el componente se destruye con el autoguardado de 1,5 s todavía
  // pendiente. Sin flush, ese guardado se perdería (o llegaría después de haber soltado
  // el lock, que es peor). En el camino del blur no hace falta probarlo: la gracia de
  // 5 s es más larga que el debounce, y por eso se eligió así.
  it('guarda lo que quedó pendiente antes de soltar el lock al cambiar de paso', async () => {
    const wrapper = await focused()
    wrapper.vm.local_data = 'texto editado'
    await wrapper.vm.$nextTick()

    wrapper.destroy()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_projects/proj1', { inclusion: 'texto editado' })
    expect(Api.patch.mock.invocationCallOrder[0])
      .toBeLessThan(LockService.releaseRef.mock.invocationCallOrder[0])
  })

  it('suelta el lock de inmediato al destruirse, sin esperar la gracia', async () => {
    const wrapper = await focused()

    wrapper.destroy()

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
  })

  it('no suelta nada si nunca llegó a tener el lock', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = await focused()

    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(5000)
    wrapper.destroy()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})

describe('Criteria.vue — pérdida del lock y estado ajeno', () => {
  const loseLock = (refId, lockedBy = null) => window.dispatchEvent(
    new CustomEvent('ref-lock-lost', { detail: { refId, lockedBy } })
  )

  it('pasa a solo lectura y nombra a quien la tomó si pierde el lock mientras edita', async () => {
    const wrapper = createWrapper()
    await fire(wrapper, 'focus')
    await flushPromises()

    loseLock('criteria::inclusion', 'Ana Pérez')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(true)
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  it('ya no suelta el lock que perdió: soltarlo sería soltar el de otra persona', async () => {
    const wrapper = createWrapper()
    await fire(wrapper, 'focus')
    await flushPromises()

    loseLock('criteria::inclusion', 'Ana Pérez')
    await wrapper.vm.$nextTick()
    wrapper.destroy()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('ignora la pérdida de un lock que no es el de esta caja', async () => {
    const wrapper = createWrapper()
    await fire(wrapper, 'focus')
    await flushPromises()

    loseLock('criteria::exclusion', 'Ana Pérez')
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(false)
  })

  it('deja de escuchar la pérdida de locks al destruirse', async () => {
    const wrapper = createWrapper()
    await fire(wrapper, 'focus')
    await flushPromises()
    wrapper.destroy()

    loseLock('criteria::inclusion', 'Ana Pérez')

    expect(wrapper.vm.lockDeniedBy).toBeNull()
  })

  it('deshabilita la caja cuando el sondeo reporta un lock ajeno sobre ella', async () => {
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'Ana Pérez' }]
    })
    await wrapper.vm.$nextTick()

    expect(textarea(wrapper).attributes('disabled')).toBeTruthy()
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  it('ignora los locks del sondeo que no son de esta caja', async () => {
    const wrapper = createWrapper({
      refLocks: [
        { ref_id: 'criteria::exclusion', user_name: 'Ana Pérez' },
        { ref_id: 'R1::s0::o0', user_name: 'Ana Pérez' }
      ]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(false)
  })

  it('no se bloquea contra su propio lock cuando el sondeo se lo devuelve', async () => {
    LockService.refLocks.set('criteria::inclusion', 'proj1')
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'Yo Mismo' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(false)
    LockService.refLocks.clear()
  })

  // Sin esto la caja quedaba muerta: al fallar el acquire se deshabilita, y un textarea
  // deshabilitado ya no se puede enfocar, así que nunca habría un segundo intento
  // aunque la otra persona soltara la caja un minuto después. Cada sondeo renueva
  // la verdad y borra lo que este cliente creyó de primera mano.
  it('vuelve a estar disponible cuando un sondeo posterior ya no reporta el lock', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'Ana Pérez' }]
    })
    await fire(wrapper, 'focus')
    await flushPromises()
    expect(wrapper.vm.isReadOnly).toBe(true)

    wrapper.setProps({ refLocks: [] })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(false)
  })

  it('deshabilita también el botón Guardar mientras la caja está tomada', async () => {
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'Ana Pérez' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').attributes('disabled')).toBeTruthy()
  })

  it('avisa al padre cuando le rechazan el lock, para que refresque sin esperar el tick', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = createWrapper()

    await fire(wrapper, 'focus')
    await flushPromises()

    expect(wrapper.emitted('lock-denied')).toHaveLength(1)
  })
})

// Reproducción del defecto medido en navegador el 2026-08-19: al pasar de una caja a la
// otra con el mouse, el blur y el focus ocurren en el mismo tick, siempre ANTES de que el
// servidor conceda el lock. La traza mostraba `lockHeld=true, releaseTimer=null`: el lock
// llegaba después de que nadie fuera ya a soltarlo, y quedaba tomado hasta cerrar la
// pestaña — el otro usuario veía la primera caja bloqueada para siempre.
describe('Criteria.vue — salir de la caja antes de que llegue el lock', () => {
  // Con timers falsos modernos flushPromises se cuelga (falsean process.nextTick), así que
  // acá las promesas se drenan por microtasks, que no se falsean.
  const drain = async () => { for (let i = 0; i < 5; i++) await Promise.resolve() }

  afterEach(() => { jest.useRealTimers() })

  it('suelta igual la caja si el usuario se va antes de que el servidor conceda el lock', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const wrapper = createWrapper()
    jest.useFakeTimers()

    await fire(wrapper, 'focus')
    await fire(wrapper, 'blur')
    expect(wrapper.vm.lockHeld).toBe(false)

    grant({ success: true })
    await drain()
    jest.advanceTimersByTime(5000)
    await drain()

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
  })

  it('no suelta la caja si el usuario volvió a ella mientras se pedía el lock', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const wrapper = createWrapper()
    jest.useFakeTimers()

    await fire(wrapper, 'focus')
    await fire(wrapper, 'blur')
    await fire(wrapper, 'focus')

    grant({ success: true })
    await drain()
    jest.advanceTimersByTime(5000)
    await drain()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})

describe('Criteria.vue — lock propio hecho en otra pestaña', () => {
  // Medido en navegador: al abrir el Paso 2 la caja decía "Being edited by damian garrido",
  // el propio usuario. El registro en memoria de LockService sólo conoce los locks de ESTA
  // pestaña, así que el resto de la app compara además por nombre (studyLockState).
  it('no se bloquea a sí mismo por un lock que lleva su propio nombre', async () => {
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'damian garrido' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(false)
  })

  it('sigue bloqueándose con el lock de otra persona', async () => {
    const wrapper = createWrapper({
      refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'Ana Pérez' }]
    })
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.isReadOnly).toBe(true)
  })
})
