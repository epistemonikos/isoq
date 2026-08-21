// Bloqueo de la identidad del finding (nombre, categoría, referencias) en el tab iSoQ.
//
// Era la última superficie del Paso 2 sin locking granular: dos personas podían abrir el
// mismo finding y la última en guardar pisaba a la otra sin que ninguna se enterara.
//
// La clave es el id del documento `isoqf_findings`, la MISMA que toma evidenceProfileForm
// al abrir la hoja de evidence profile. No es casualidad: los dos editores escriben ese
// documento, y editar las referencias invalida los datos extraídos de la hoja. Que se
// excluyan mutuamente es el comportamiento buscado.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ViewTable from '@/components/project/ViewTable.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [{ id: 'finding1' }] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const LISTS = [
  {
    id: 'list1',
    name: 'Finding One',
    notes: '',
    sort: 1,
    references: ['ref1'],
    category: null,
    category_name: '',
    cerqual_option: '',
    cerqual_explanation: '',
    raw_ref: ['ref1'],
    filter_cerqual: '',
    evidence_profile: {
      methodological_limitations: { notes: '' },
      coherence: { notes: '' },
      adequacy: { notes: '' },
      relevance: { notes: '' },
      cerqual: { option: null, notes: '' }
    }
  }
]

function createWrapper (overrideProps = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(ViewTable, {
    localVue,
    propsData: {
      lists: LISTS,
      list_categories: { options: [], selected: null },
      fields: { with_categories: [], without_categories: [] },
      project: { id: 'proj1', is_public: false, private: true },
      references: [],
      refs: [],
      isBusy: false,
      mode: 'edit',
      canEdit: true,
      findings: [{ id: 'finding1', list_id: 'list1' }],
      refLocks: [],
      ...overrideProps
    },
    mocks: {
      $t: (key, params) => params ? `${key}:${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } },
      $notify
    },
    stubs: { videoHelp: true }
  })
  wrapper.vm.$refs['edit-finding-name'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['remove-finding'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-references-list'] = { show: jest.fn(), hide: jest.fn() }
  return { wrapper, $notify }
}

describe('ViewTable — toma del lock al abrir un editor', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('el modal de nombre bloquea el finding, con el id que ya venía en props', async () => {
    const { wrapper } = createWrapper()

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'finding1')
    // El id ya estaba en `findings`: no hace falta ir a preguntarlo.
    expect(Api.get).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  // Antes el modal se mostraba sin esperar el GET del finding_id, así que quien guardaba
  // rápido mandaba un PATCH /isoqf_findings/undefined.
  it('no muestra el modal hasta tener el finding_id', async () => {
    const { wrapper } = createWrapper({ findings: [] })
    const orden = []
    Api.get.mockImplementation(() => {
      orden.push('resuelve-id')
      return Promise.resolve({ data: [{ id: 'finding1' }] })
    })
    wrapper.vm.$refs['edit-finding-name'].show = jest.fn(() => orden.push('modal'))

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(orden).toEqual(['resuelve-id', 'modal'])
    expect(wrapper.vm.editFindingName.finding_id).toBe('finding1')
    wrapper.destroy()
  })

  it('cae al servidor cuando el finding todavía no está en props', async () => {
    const { wrapper } = createWrapper({ findings: [] })

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(Api.get).toHaveBeenCalledWith('/isoqf_findings', { organization: 'org1', list_id: 'list1' })
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'finding1')
    wrapper.destroy()
  })

  it('el modal de referencias toma la misma clave', async () => {
    const { wrapper } = createWrapper()

    await wrapper.vm.openModalReferences({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'finding1')
    wrapper.destroy()
  })

  it('borrar también pasa por el lock', async () => {
    const { wrapper } = createWrapper()

    await wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'finding1')
    wrapper.destroy()
  })
})

describe('ViewTable — rechazo del lock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
  })

  // Abrir en solo lectura y no impedir abrir: deja ver y copiar el contenido, igual que
  // hacen evidenceProfileForm y Criteria.
  it('rechazado deja el formulario en solo lectura y nombra a quien lo tiene', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const { wrapper } = createWrapper()

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(wrapper.vm.isFindingReadOnly).toBe(true)
    expect(wrapper.vm.findingLockedBy).toBe('Ana')
    expect(wrapper.vm.readOnlyNotice).toContain('lock.ref_locked_by')
    expect(wrapper.vm.$refs['edit-finding-name'].show).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('avisa al padre para que no espere al próximo sondeo', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const { wrapper } = createWrapper()

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(wrapper.emitted('lock-denied')).toBeTruthy()
    wrapper.destroy()
  })

  // Un 403 no tiene a quién culpar: nadie más lo tiene, a este usuario le sacaron el
  // permiso de escritura. Nombrar a un dueño ahí sería inventarlo.
  it('un 403 no inventa un dueño', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true, lockedBy: 'Ana' })
    const { wrapper, $notify } = createWrapper()

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(wrapper.vm.isFindingReadOnly).toBe(true)
    expect(wrapper.vm.findingLockedBy).toBeNull()
    expect($notify.warning).toHaveBeenCalledWith('lock.permissions_revoked')
    wrapper.destroy()
  })

  it('en solo lectura no se guarda', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    Api.patch.mockClear()

    await wrapper.vm.updateListName()

    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('ViewTable — pérdida del lock con el editor abierto', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('el aviso del finding propio pasa el formulario a solo lectura', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    wrapper.vm.onRefLockLost({ detail: { refId: 'finding1', lockedBy: 'Ana' } })

    expect(wrapper.vm.isFindingReadOnly).toBe(true)
    expect(wrapper.vm.lockLostWhileEditing).toBe(true)
    expect(wrapper.vm.readOnlyNotice).toContain('lock.lost_while_editing')
    wrapper.destroy()
  })

  // Ya no es nuestro: soltarlo sería pedirle al servidor que suelte el de otra persona.
  it('no intenta soltar un lock que ya perdió', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    wrapper.vm.onRefLockLost({ detail: { refId: 'finding1', lockedBy: 'Ana' } })
    LockService.releaseRef.mockClear()

    wrapper.vm.onEditFindingNameHidden()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('el aviso de otro finding no toca este editor', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    wrapper.vm.onRefLockLost({ detail: { refId: 'otro-finding', lockedBy: 'Ana' } })

    expect(wrapper.vm.isFindingReadOnly).toBe(false)
    wrapper.destroy()
  })
})

describe('ViewTable — devolución del lock', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('cerrar el modal de nombre lo suelta', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    wrapper.vm.onEditFindingNameHidden()

    expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
    expect(wrapper.vm.lockedFindingRef).toBeNull()
    wrapper.destroy()
  })

  // bootstrap-vue emite `ok` y enseguida `hidden`, pero el PATCH es asíncrono: soltar en
  // `hidden` dejaría la escritura viajando sin lock detrás.
  it('no lo suelta mientras un guardado está en vuelo', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    await wrapper.setData({ savingFinding: true })

    wrapper.vm.onEditFindingNameHidden()

    expect(LockService.releaseRef).not.toHaveBeenCalled()
    expect(wrapper.vm.lockedFindingRef).toBe('finding1')
    wrapper.destroy()
  })

  it('lo suelta cuando el guardado termina bien', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    wrapper.vm.onEditFindingNameHidden()
    LockService.releaseRef.mockClear()
    await wrapper.setData({ savingFinding: true, lockedFindingRef: 'finding1' })

    await wrapper.vm.updateListName()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
    wrapper.destroy()
  })

  it('lo suelta también cuando el guardado falla', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    Api.patch.mockRejectedValueOnce(new Error('boom'))

    await wrapper.vm.updateListName()
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
    expect(wrapper.vm.savingFinding).toBe(false)
    wrapper.destroy()
  })

  // viewProject hace un releaseRef() global al salir del proyecto, pero este componente
  // está detrás de un v-if de permisos y puede desaparecer sin que se salga.
  it('lo suelta si el componente se destruye con el modal abierto', async () => {
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    LockService.releaseRef.mockClear()

    wrapper.destroy()

    expect(LockService.releaseRef).toHaveBeenCalledWith('finding1')
  })
})

describe('ViewTable — grisado de la fila antes del clic', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
  })

  it('una fila que otro tiene tomada sale bloqueada y con su nombre', () => {
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: 'Ana' }] })

    expect(wrapper.vm.isFindingLocked('list1')).toBe(true)
    expect(wrapper.vm.findingLockedByName('list1')).toContain('Ana')
    wrapper.destroy()
  })

  it('una fila libre no se bloquea', () => {
    const { wrapper } = createWrapper({ refLocks: [] })

    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
    expect(wrapper.vm.findingLockedByName('list1')).toBe('')
    wrapper.destroy()
  })

  // Camino 1 de descarte: el lock lo tomó esta misma pestaña.
  it('el lock propio de esta pestaña no bloquea', () => {
    LockService.refLocks = new Map([['finding1', 'proj1']])
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: 'Yo Mismo' }] })

    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
    wrapper.destroy()
  })

  // Camino 2, y es el que hace falta de verdad: LockService sólo conoce los locks de ESTA
  // pestaña. Sin comparar por nombre, un finding abierto en otra pestaña del mismo usuario
  // se lee como ajeno y la fila queda bloqueada contra uno mismo, con el propio nombre.
  it('el lock propio dejado en OTRA pestaña tampoco bloquea', () => {
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: 'Yo Mismo' }] })

    expect(LockService.refLocks.has('finding1')).toBe(false)
    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
    wrapper.destroy()
  })

  // Sin nombre a quién mostrar el cartel quedaría mudo; mejor no bloquear.
  it('un lock sin nombre no bloquea', () => {
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: '' }] })

    expect(wrapper.vm.polledHolderOf('list1')).toBeNull()
    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
    wrapper.destroy()
  })

  it('sin finding_id conocido no se bloquea nada', () => {
    const { wrapper } = createWrapper({ findings: [], refLocks: [{ ref_id: 'finding1', user_name: 'Ana' }] })

    expect(wrapper.vm.polledHolderOf('list1')).toBeNull()
    wrapper.destroy()
  })

  // El botón no queda muerto tras un rechazo: su grisado se deriva del sondeo en cada
  // render, así que cuando la otra persona suelta, vuelve a habilitarse solo.
  it('cuando el otro suelta, la fila se rehabilita sin intervención', async () => {
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: 'Ana' }] })
    expect(wrapper.vm.isFindingLocked('list1')).toBe(true)

    await wrapper.setProps({ refLocks: [] })

    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
    wrapper.destroy()
  })

  // Regresión: un watcher de `refLocks` copiado de Criteria.vue limpiaba
  // `isFindingReadOnly` cada 15 s. Con el modal abierto eso devolvía el formulario a
  // editable SIN tener el lock — exactamente lo contrario de lo que se busca. Acá ese
  // estado se decide al abrir y sólo se limpia al cerrar.
  it('un sondeo nuevo no vuelve editable un formulario abierto en solo lectura', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    await wrapper.setProps({ refLocks: [] })

    expect(wrapper.vm.isFindingReadOnly).toBe(true)
    wrapper.destroy()
  })

  // Ídem para el lock perdido en pleno tipeo: el cartel y el bloqueo tienen que durar
  // hasta que la persona cierre, no evaporarse en el próximo sondeo.
  it('un sondeo nuevo no borra el aviso de lock perdido', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const { wrapper } = createWrapper()
    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    wrapper.vm.onRefLockLost({ detail: { refId: 'finding1', lockedBy: 'Ana' } })

    await wrapper.setProps({ refLocks: [] })

    expect(wrapper.vm.isFindingReadOnly).toBe(true)
    expect(wrapper.vm.lockLostWhileEditing).toBe(true)
    wrapper.destroy()
  })
})

// bootstrap-vue no monta su tooltip sobre un botón `disabled`: el navegador no emite
// eventos de mouse en elementos deshabilitados, así que el nombre quedaba sólo en el
// `title` nativo — lento, con otro estilo y ausente para quien navega con teclado.
// Medido en navegador. El nombre tiene que estar en el texto de la fila.
describe('ViewTable — quién edita se ve sin pasar el mouse', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks = new Map()
  })

  it('el nombre de quien tiene la fila aparece en el texto renderizado', () => {
    const { wrapper } = createWrapper({ refLocks: [{ ref_id: 'finding1', user_name: 'Ana' }] })

    expect(wrapper.vm.findingLockedByName('list1')).toContain('Ana')
    expect(wrapper.vm.findingLockedByName('list1')).toContain('lock.ref_locked_by')
    wrapper.destroy()
  })

  it('una fila libre no muestra ningún nombre', () => {
    const { wrapper } = createWrapper({ refLocks: [] })

    expect(wrapper.vm.findingLockedByName('list1')).toBe('')
    wrapper.destroy()
  })
})
