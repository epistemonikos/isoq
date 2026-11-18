import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import LockService from '@/services/lockService'
import propertiesLockMixin, { PROPERTIES_WAIT_POLL_MS } from '@/mixins/propertiesLockMixin'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), probeRefLocks: jest.fn() }
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const KEY = 'project_properties'
const listing = (locks, reachable = true) => ({ locks, reachable, enabled: true })

function makeHost (calls, refresh) {
  return {
    mixins: [propertiesLockMixin],
    template: '<div />',
    methods: {
      propertiesLockProjectId () { return 'p1' },
      refreshBeforePropertiesLock () {
        calls.push('refresh')
        return refresh ? refresh() : Promise.resolve()
      }
    }
  }
}

let wrappers = []
let store
function mountHost (calls = [], refresh) {
  const w = shallowMount(makeHost(calls, refresh), {
    mocks: { $store: { state: store } }
  })
  wrappers.push(w)
  return w
}

beforeEach(() => {
  jest.clearAllMocks()
  store = Vue.observable({ user: { id: 'u-me' }, isOnline: true })
  LockService.probeRefLocks.mockResolvedValue(listing([]))
  LockService.releaseRef.mockResolvedValue()
})
afterEach(() => {
  wrappers.forEach(w => w.destroy())
  wrappers = []
})

describe('propertiesLockMixin — entrar', () => {
  it('con el lock libre queda held', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    expect(LockService.acquireRef).toHaveBeenCalledWith('p1', KEY)
    expect(w.vm.propertiesLock).toEqual({ status: 'held', lockedBy: null })
    expect(w.vm.propertiesLockHeld).toBe(true)
  })

  it('tomado por otra persona queda denied con su nombre y arma la espera de 15 s', async () => {
    const spy = jest.spyOn(window, 'setInterval')
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana', reason: 'locked_by_other_user' })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: 'Ana' })
    expect(spy).toHaveBeenCalledWith(expect.any(Function), PROPERTIES_WAIT_POLL_MS)
    spy.mockRestore()
  })

  it('sin permiso de escritura queda forbidden y NO espera', async () => {
    const spy = jest.spyOn(window, 'setInterval')
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    expect(w.vm.propertiesLock.status).toBe('forbidden')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('salir con el acquire en vuelo suelta el lock cuando llega', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const w = mountHost()
    const entering = w.vm.enterPropertiesLock()
    w.vm.leavePropertiesLock()
    LockService.releaseRef.mockClear()
    grant({ success: true })
    await entering
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.propertiesLock.status).toBe('idle')
  })
})

describe('propertiesLockMixin — esperar a que se libere', () => {
  async function deniedHost (calls) {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls)
    await w.vm.enterPropertiesLock()
    return w
  }

  it('al liberarse refresca ANTES de tomar el lock', async () => {
    const calls = []
    const w = await deniedHost(calls)
    LockService.acquireRef.mockImplementation(() => { calls.push('acquire'); return Promise.resolve({ success: true }) })
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(calls).toEqual(['refresh', 'acquire'])
    expect(w.vm.propertiesLock.status).toBe('held')
  })

  it('si sigue tomado no refresca y actualiza el nombre', async () => {
    const calls = []
    const w = await deniedHost(calls)
    LockService.probeRefLocks.mockResolvedValue(listing([{ ref_id: KEY, user_id: 'u-beto', user_name: 'Beto' }]))
    await w.vm.checkPropertiesLockFree()
    expect(calls).toEqual([])
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: 'Beto' })
  })

  it('mi propio lock en otra pestaña cuenta como libre', async () => {
    const calls = []
    const w = await deniedHost(calls)
    LockService.probeRefLocks.mockResolvedValue(listing([{ ref_id: KEY, user_id: 'u-me', user_name: 'Yo' }]))
    LockService.acquireRef.mockResolvedValue({ success: true })
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(calls).toEqual(['refresh'])
    expect(w.vm.propertiesLock.status).toBe('held')
  })

  it('si el refresco falla NO toma el lock y sigue esperando', async () => {
    const calls = []
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls, () => Promise.reject(new Error('500')))
    await w.vm.enterPropertiesLock()
    LockService.acquireRef.mockClear()
    const spy = jest.spyOn(window, 'setInterval')
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: null })
    expect(spy).toHaveBeenCalledWith(expect.any(Function), PROPERTIES_WAIT_POLL_MS)
    spy.mockRestore()
  })

  it('otra persona se adelanta: vuelve a denied con el nombre nuevo', async () => {
    const w = await deniedHost([])
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Beto' })
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: 'Beto' })
  })

  it('un sondeo que responde después de salir no hace nada', async () => {
    const calls = []
    const w = await deniedHost(calls)
    let answer
    LockService.probeRefLocks.mockReturnValue(new Promise(resolve => { answer = resolve }))
    const checking = w.vm.checkPropertiesLockFree()
    w.vm.leavePropertiesLock()
    answer(listing([]))
    await checking
    expect(calls).toEqual([])
    expect(w.vm.propertiesLock.status).toBe('idle')
  })
})

describe('propertiesLockMixin — salir y perder', () => {
  it('salir suelta la clave y vuelve a idle', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    w.vm.leavePropertiesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.propertiesLock).toEqual({ status: 'idle', lockedBy: null })
  })

  it('dos anfitriones en la misma pestaña: el que sale último es el que suelta', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const tab = mountHost()
    const modal = mountHost()
    await modal.vm.enterPropertiesLock()
    await tab.vm.enterPropertiesLock()
    modal.vm.leavePropertiesLock()
    expect(LockService.releaseRef).not.toHaveBeenCalled()
    tab.vm.leavePropertiesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
  })

  it('ref-lock-lost de otra clave no la afecta', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: 'R1', lockedBy: 'Ana' } }))
    expect(w.vm.propertiesLock.status).toBe('held')
  })

  it('ref-lock-lost de la clave: lost con nombre, y espera', async () => {
    const spy = jest.spyOn(window, 'setInterval')
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: KEY, lockedBy: 'Ana', reason: 'un_motivo_que_todavia_no_existe' }
    }))
    expect(w.vm.propertiesLock).toEqual({ status: 'lost', lockedBy: 'Ana' })
    expect(spy).toHaveBeenCalledWith(expect.any(Function), PROPERTIES_WAIT_POLL_MS)
    spy.mockRestore()
  })

  it('ref-lock-lost sin estar adentro se ignora', () => {
    const w = mountHost()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: KEY, lockedBy: 'Ana' } }))
    expect(w.vm.propertiesLock.status).toBe('idle')
  })
})

describe('propertiesLockMixin — inactividad', () => {
  it('expirar suelta, queda released_idle y NO espera', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterPropertiesLock()
    const spy = jest.spyOn(window, 'setInterval')
    w.vm.expirePropertiesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.propertiesLock.status).toBe('released_idle')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('«Seguir editando» refresca y después toma', async () => {
    const calls = []
    LockService.acquireRef.mockImplementation(() => { calls.push('acquire'); return Promise.resolve({ success: true }) })
    const w = mountHost(calls)
    await w.vm.enterPropertiesLock()
    w.vm.expirePropertiesLock()
    calls.length = 0
    await w.vm.resumePropertiesLock()
    expect(calls).toEqual(['refresh', 'acquire'])
    expect(w.vm.propertiesLock.status).toBe('held')
  })
})

describe('propertiesLockMixin — sin red o sin respuesta no se da por libre', () => {
  async function deniedHost (calls) {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls)
    await w.vm.enterPropertiesLock()
    return w
  }

  it('si el listado no respondió, sigue esperando sin refrescar ni tomar', async () => {
    const calls = []
    const w = await deniedHost(calls)
    LockService.acquireRef.mockClear()
    LockService.probeRefLocks.mockResolvedValue(listing([], false))
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(calls).toEqual([])
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: 'Ana' })
  })

  it('sin red sigue esperando aunque el listado diga libre (el grant offline no es un lock)', async () => {
    const calls = []
    const w = await deniedHost(calls)
    LockService.acquireRef.mockClear()
    store.isOnline = false
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(calls).toEqual([])
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock.status).toBe('denied')
  })

  it('si la red se cae durante el refresco, no toma el lock', async () => {
    const calls = []
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls, () => { store.isOnline = false; return Promise.resolve() })
    await w.vm.enterPropertiesLock()
    LockService.acquireRef.mockClear()
    await w.vm.checkPropertiesLockFree()
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock.status).toBe('denied')
  })
})

describe('propertiesLockMixin — sesiones', () => {
  it('un refresco de una sesión anterior no toma el lock en la sesión nueva', async () => {
    const calls = []
    let finishOldRefresh
    let refreshes = 0
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls, () => {
      refreshes++
      return refreshes === 1 ? new Promise(resolve => { finishOldRefresh = resolve }) : Promise.resolve()
    })
    await w.vm.enterPropertiesLock()
    const oldChain = w.vm.checkPropertiesLockFree()
    await flushPromises()
    // Sale y vuelve a entrar (otro proyecto, en el modal de la lista) mientras refrescaba.
    w.vm.leavePropertiesLock()
    await w.vm.enterPropertiesLock()
    LockService.acquireRef.mockClear()
    finishOldRefresh()
    await oldChain
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock).toEqual({ status: 'denied', lockedBy: 'Ana' })
  })
})

describe('propertiesLockMixin — ronda 2: caminos de sesiones viejas', () => {
  it('un refresco que rechaza después de salir no arma el sondeo ni cambia el estado', async () => {
    let failRefresh
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost([], () => new Promise((resolve, reject) => { failRefresh = reject }))
    await w.vm.enterPropertiesLock()
    const chain = w.vm.checkPropertiesLockFree()
    await flushPromises()
    w.vm.leavePropertiesLock()
    const spy = jest.spyOn(window, 'setInterval')
    failRefresh(new Error('project changed while refreshing'))
    await chain
    expect(spy).not.toHaveBeenCalled()
    expect(w.vm.$_propsLockTimer).toBeNull()
    expect(w.vm.propertiesLock.status).toBe('idle')
    spy.mockRestore()
  })

  it('salir y re-entrar con el acquire en vuelo (promesa compartida) no suelta el lock de la sesión nueva', async () => {
    let grant
    const shared = new Promise(resolve => { grant = resolve })
    LockService.acquireRef.mockReturnValue(shared) // lockService deduplica: ambas sesiones esperan la misma
    const w = mountHost()
    const first = w.vm.enterPropertiesLock()
    w.vm.leavePropertiesLock()
    const second = w.vm.enterPropertiesLock()
    LockService.releaseRef.mockClear()
    grant({ success: true })
    await first
    await second
    expect(LockService.releaseRef).not.toHaveBeenCalled()
    expect(w.vm.propertiesLock.status).toBe('held')
  })

  it('otro anfitrión todavía en acquiring impide que el que sale suelte', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const modal = mountHost()
    const tab = mountHost()
    const entering = modal.vm.enterPropertiesLock()
    const tabEntering = tab.vm.enterPropertiesLock()
    modal.vm.leavePropertiesLock()
    grant({ success: true })
    await entering
    await tabEntering
    expect(LockService.releaseRef).not.toHaveBeenCalled()
    expect(tab.vm.propertiesLock.status).toBe('held')
  })
})

describe('propertiesLockMixin — expirar con otro anfitrión entrando', () => {
  it('no suelta si otro anfitrión está en acquiring', async () => {
    LockService.acquireRef.mockResolvedValueOnce({ success: true })
    const tab = mountHost()
    await tab.vm.enterPropertiesLock()
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const modal = mountHost()
    const entering = modal.vm.enterPropertiesLock()
    tab.vm.expirePropertiesLock()
    expect(LockService.releaseRef).not.toHaveBeenCalled()
    grant({ success: true })
    await entering
  })

  it('solo, sí suelta', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const tab = mountHost()
    await tab.vm.enterPropertiesLock()
    tab.vm.expirePropertiesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
  })
})

describe('propertiesLockMixin — ronda 3', () => {
  it('un ref-lock-lost con el acquire en vuelo no deja el sondeo armado sobre held', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const w = mountHost()
    const entering = w.vm.enterPropertiesLock()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: KEY, lockedBy: null } }))
    grant({ success: true })
    await entering
    expect(w.vm.propertiesLock.status).toBe('held')
    expect(w.vm.$_propsLockTimer).toBeNull()
  })
})
