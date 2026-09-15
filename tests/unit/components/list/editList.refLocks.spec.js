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
  // El registro de locks que sostiene ESTA pestaña. Lo lee `refLockStateMixin` para
  // descartarlos del sondeo; sin él el mock no representa al servicio real.
  refLocks: new Map(),
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

// ── Refresco al liberarse un lock ajeno ──────────────────────────────────────
// El sondeo de candados y la carga de datos eran dos canales que nunca se hablaron:
// cuando otra persona terminaba de evaluar una dimensión, acá se borraba el cartel y se
// habilitaba el botón, pero la celda seguía diciendo «Assessment not completed». El
// instante en que un lock ajeno desaparece ES la señal de que hay algo nuevo que leer.
describe('editList.vue — refresco al liberarse un lock ajeno', () => {
  const HOJA = {
    id: 'list1',
    project_id: 'proj1',
    references: ['R1', 'R2']
  }

  // La aserción va sobre `getList`: es el camino de recarga que el propio guardado ya
  // usa (`@update-list-data`). El spy se pone sobre la INSTANCIA y no sobre el stub de
  // `createWrapper`, porque Vue guarda los métodos ya enlazados (`bind`) y el jest.fn
  // original queda envuelto: `wrapper.vm.getList` no es el mock.
  const montar = async () => {
    const wrapper = createWrapper()
    const getList = jest.spyOn(wrapper.vm, 'getList')
    wrapper.vm.$_getListSpy = getList
    await wrapper.setData({
      list: HOJA,
      findings: { id: 'f1' },
      characteristics_studies: { id: 'charsDoc', fields: [], items: [] },
      meth_assessments: { id: 'methDoc', fields: [], items: [] }
    })
    return wrapper
  }

  const recargas = wrapper => wrapper.vm.$_getListSpy

  const sondearCon = async (wrapper, locks) => {
    LockService.fetchRefLocks.mockResolvedValueOnce(locks)
    await wrapper.vm.fetchAndUpdateRefLocks()
    await flushMicrotasks()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
    jest.useFakeTimers()
  })
  afterEach(() => jest.useRealTimers())

  it('el primer sondeo sólo siembra la instantánea: no recarga', async () => {
    // Sin esto, entrar a una hoja que ya tiene candados ajenos dispararía una recarga
    // redundante encima del getList que acaba de traer los datos.
    const wrapper = await montar()
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Ana' }])
    expect(recargas(wrapper)).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('recarga cuando se libera la sección que otra persona estaba evaluando', async () => {
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('recarga aunque en el mismo ciclo otra persona tome otra sección', async () => {
    // El total de candados no cambia, pero sí hay algo nuevo que mostrar.
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::adequacy', user_name: 'Beto' }])
    expect(recargas(wrapper)).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('recarga cuando se libera la fila de datos extraídos de una referencia de la hoja', async () => {
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'R2', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('recarga cuando se liberan las columnas de una tabla de la hoja', async () => {
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'charsDoc::fields', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('NO recarga por un candado que se libera en otro hallazgo del proyecto', async () => {
    // El sondeo trae los locks de TODO el proyecto. Una hoja abierta no tiene nada que
    // repintar porque alguien suelte una sección de otro hallazgo.
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'f9::ep::coherence', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('NO recarga cuando sólo se TOMAN candados nuevos', async () => {
    const wrapper = await montar()
    await sondearCon(wrapper, [])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Ana' }])
    expect(recargas(wrapper)).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('NO recarga por el candado que sostiene esta misma pestaña', async () => {
    // Al guardar, el propio modal ya dispara `@update-list-data` -> getList. Sin este
    // descarte, cerrar el modal sumaría una segunda recarga completa por cada sección.
    const wrapper = await montar()
    LockService.refLocks.set('f1::ep::coherence', 'proj1')
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Yo' }])
    LockService.refLocks.delete('f1::ep::coherence')
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('una liberación provoca UNA sola recarga, no una por sondeo', async () => {
    // getList() termina llamando a fetchAndUpdateRefLocks(): si la instantánea no se
    // actualizara antes de disparar la recarga, esto sería un bucle cada 5 s.
    const wrapper = await montar()
    await sondearCon(wrapper, [{ ref_id: 'f1::ep::coherence', user_name: 'Ana' }])
    recargas(wrapper).mockClear()
    await sondearCon(wrapper, [])
    await sondearCon(wrapper, [])
    expect(recargas(wrapper)).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })
})
