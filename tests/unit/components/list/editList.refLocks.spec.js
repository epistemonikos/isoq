import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import LockService from '@/services/lockService'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn(),
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// `fetchAndUpdateRefLocks` arranca con un `Promise.resolve().then(...)` para que
// un fallo del sondeo no pueda tumbar la cadena de getList(), así que la llamada
// al servicio ocurre un microtask después del disparador.
// Microtasks reales y no `process.nextTick`: los fake timers de Jest interceptan
// nextTick, así que un helper basado en él nunca resuelve dentro de estos tests.
const flushMicrotasks = async () => {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

// La tabla del evidence profile se stubbea declarando la prop: un stub booleano no
// hereda las props del componente real (es un import dinámico), y entonces
// `props('activeRefLocks')` da undefined y la aserción del binding no prueba nada.
const EP_TABLE_STUB = {
  name: 'evidence-profile-table',
  props: ['activeRefLocks'],
  template: '<div class="ep-table-stub"></div>'
}

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': EP_TABLE_STUB, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

function createWrapper () {
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      // OJO: en `/worksheet/:id/edit` este `:id` es el de la LIST, no del proyecto.
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    // getList se stubbea: acá sólo interesa el sondeo de locks.
    methods: { getList: jest.fn() }
  })
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return wrapper
}

describe('editList.vue — sondeo de ref-locks', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  it('NO sondea mientras no hay project_id', async () => {
    // El error más fácil de cometer en todo el cambio: `$route.params.id` es el id
    // de la LIST (getList lo usa tal cual para /getLists, y la ruta de preview lleva
    // el projectId como un param aparte). El project id sólo existe tras getList().
    // Sondear con el id equivocado devolvería los locks de otro proyecto, o ninguno.
    const wrapper = createWrapper()
    await wrapper.vm.fetchAndUpdateRefLocks()
    expect(LockService.fetchRefLocks).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('sondea con list.project_id, nunca con el param de la ruta', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    await wrapper.vm.fetchAndUpdateRefLocks()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    expect(LockService.fetchRefLocks).not.toHaveBeenCalledWith('list1')
    wrapper.destroy()
  })

  it('guarda los locks sondeados para que el hijo los pinte', async () => {
    const locks = [{ ref_id: 'finding1', user_name: 'Ana Pérez' }]
    LockService.fetchRefLocks.mockResolvedValueOnce(locks)
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    await wrapper.vm.fetchAndUpdateRefLocks()
    expect(wrapper.vm.activeRefLocks).toEqual(locks)
    wrapper.destroy()
  })

  it('una respuesta vacía deja el listado vacío, no undefined', async () => {
    // `fetchRefLocks` falla en silencio a `[]`; el contrato de la prop es un array.
    LockService.fetchRefLocks.mockResolvedValueOnce(undefined)
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    await wrapper.vm.fetchAndUpdateRefLocks()
    expect(wrapper.vm.activeRefLocks).toEqual([])
    wrapper.destroy()
  })

  it('no escribe en la vista si murió mientras el sondeo estaba en vuelo', async () => {
    let resolve
    LockService.fetchRefLocks.mockReturnValueOnce(new Promise(r => { resolve = r }))
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    const pending = wrapper.vm.fetchAndUpdateRefLocks()
    wrapper.vm.$_alive = false
    resolve([{ ref_id: 'finding1', user_name: 'Ana Pérez' }])
    await pending
    expect(wrapper.vm.activeRefLocks).toEqual([])
    wrapper.destroy()
  })

  // 5 s, no los 15 s de las demás superficies: acá dos personas evalúan dimensiones
  // distintas del mismo hallazgo y el aviso decide cuál abre cada una.
  it('el sondeo periódico corre al ritmo acordado', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    LockService.fetchRefLocks.mockClear()
    jest.advanceTimersByTime(5000)
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(5000)
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('no se queda en los 15 s de las otras vistas', async () => {
    // Afirmación sobre el ritmo REAL y no sobre la constante: un cambio en el valor que
    // no llegara al `setInterval` pasaría igual el test de arriba.
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    LockService.fetchRefLocks.mockClear()
    jest.advanceTimersByTime(15000)
    await flushMicrotasks()
    expect(LockService.fetchRefLocks.mock.calls.length).toBeGreaterThan(1)
    wrapper.destroy()
  })

  it('beforeDestroy apaga el timer', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    wrapper.destroy()
    LockService.fetchRefLocks.mockClear()
    jest.advanceTimersByTime(60000)
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).not.toHaveBeenCalled()
  })

  it('beforeDestroy quita el listener de ref-locks-changed', async () => {
    // El orden importa: el `releaseRef()` del propio beforeDestroy emite
    // `ref-locks-changed`, así que con el listener todavía puesto dispararía un
    // sondeo sobre la vista que se está destruyendo.
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    wrapper.destroy()
    LockService.fetchRefLocks.mockClear()
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).not.toHaveBeenCalled()
  })

  it('un rechazo de lock del hijo sondea sin esperar el tick', async () => {
    // `emitRefLocksChanged` se dispara sólo en un acquire exitoso y en el release,
    // nunca en un 409. Sin este puente, el grisado esperaba hasta 15 s con los
    // botones invitando al clic.
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    LockService.fetchRefLocks.mockClear()
    wrapper.find('.ep-table-stub').vm.$emit('lock-denied')
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })

  it('el evento global ref-locks-changed también sondea', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' } })
    LockService.fetchRefLocks.mockClear()
    window.dispatchEvent(new CustomEvent('ref-locks-changed'))
    await flushMicrotasks()
    expect(LockService.fetchRefLocks).toHaveBeenCalledWith('proj1')
    wrapper.destroy()
  })

  it('pasa los locks al hijo que pinta los botones', async () => {
    const locks = [{ ref_id: 'finding1', user_name: 'Ana Pérez' }]
    const wrapper = createWrapper()
    await wrapper.setData({ list: { id: 'list1', project_id: 'proj1' }, activeRefLocks: locks })
    expect(wrapper.find('.ep-table-stub').props('activeRefLocks')).toEqual(locks)
    wrapper.destroy()
  })
})
