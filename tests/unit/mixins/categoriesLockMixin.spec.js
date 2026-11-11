import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import LockService from '@/services/lockService'
import categoriesLockMixin, { CATEGORIES_WAIT_POLL_MS } from '@/mixins/categoriesLockMixin'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), probeRefLocks: jest.fn() }
}))

const KEY = 'list_categories'
const listing = (locks, reachable = true) => ({ locks, reachable, enabled: true })

function makeHost (calls, refresh) {
  return {
    mixins: [categoriesLockMixin],
    template: '<div />',
    methods: {
      categoriesLockProjectId () { return 'p1' },
      refreshBeforeCategoriesLock () {
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

describe('categoriesLockMixin — entrar', () => {
  it('con el lock libre queda held', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    expect(LockService.acquireRef).toHaveBeenCalledWith('p1', KEY)
    expect(w.vm.categoriesLock).toEqual({ status: 'held', lockedBy: null })
    expect(w.vm.categoriesLockHeld).toBe(true)
  })

  it('tomado por otra persona queda denied con su nombre y arma la espera', async () => {
    const spy = jest.spyOn(window, 'setInterval')
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana', reason: 'locked_by_other_user' })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    expect(w.vm.categoriesLock).toEqual({ status: 'denied', lockedBy: 'Ana' })
    expect(w.vm.categoriesLockHeld).toBe(false)
    expect(spy).toHaveBeenCalledWith(expect.any(Function), CATEGORIES_WAIT_POLL_MS)
    spy.mockRestore()
  })

  it('sin permiso de escritura queda forbidden y NO espera', async () => {
    const spy = jest.spyOn(window, 'setInterval')
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    expect(w.vm.categoriesLock.status).toBe('forbidden')
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('entrar dos veces no pide dos locks', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    await w.vm.enterCategoriesLock()
    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })
})

describe('categoriesLockMixin — salir', () => {
  it('suelta el lock que tenía y vuelve a idle', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    w.vm.leaveCategoriesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.categoriesLock.status).toBe('idle')
  })

  it('no suelta un lock que tiene otra persona', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    w.vm.leaveCategoriesLock()
    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('si cerró con el acquire en vuelo, suelta lo que llegue y no queda held', async () => {
    let grant
    LockService.acquireRef.mockReturnValue(new Promise(resolve => { grant = resolve }))
    const w = mountHost()
    const entering = w.vm.enterCategoriesLock()
    w.vm.leaveCategoriesLock()
    grant({ success: true })
    await entering
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.categoriesLock.status).toBe('idle')
  })

  it('al desmontar suelta el lock', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    w.destroy()
    wrappers = []
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
  })
})

describe('categoriesLockMixin — esperar a que se libere', () => {
  async function denied (calls, refresh) {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana' })
    const w = mountHost(calls, refresh)
    await w.vm.enterCategoriesLock()
    return w
  }

  it('libre: refresca ANTES de adquirir y queda held', async () => {
    const calls = []
    const w = await denied(calls)
    LockService.acquireRef.mockImplementation(async () => { calls.push('acquire'); return { success: true } })
    await w.vm.checkCategoriesLockFree()
    expect(calls).toEqual(['refresh', 'acquire'])
    expect(w.vm.categoriesLock.status).toBe('held')
  })

  it('sigue tomado: actualiza el nombre y no adquiere', async () => {
    const calls = []
    const w = await denied(calls)
    LockService.probeRefLocks.mockResolvedValue(listing([{ ref_id: KEY, user_id: 'u-bea', user_name: 'Bea' }]))
    await w.vm.checkCategoriesLockFree()
    expect(w.vm.categoriesLock).toEqual({ status: 'denied', lockedBy: 'Bea' })
    expect(calls).toEqual([])
    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })

  it('un listado que no respondió NO se lee como libre', async () => {
    const calls = []
    const w = await denied(calls)
    LockService.probeRefLocks.mockResolvedValue(listing([], false))
    await w.vm.checkCategoriesLockFree()
    expect(calls).toEqual([])
    expect(w.vm.categoriesLock.status).toBe('denied')
  })

  it('sin red tampoco: el grant offline no es un lock', async () => {
    const calls = []
    const w = await denied(calls)
    store.isOnline = false
    await w.vm.checkCategoriesLockFree()
    expect(calls).toEqual([])
  })

  it('si el refresco falla no adquiere y sigue esperando sin nombrar a nadie', async () => {
    const calls = []
    const w = await denied(calls, () => Promise.reject(new Error('net')))
    await w.vm.checkCategoriesLockFree()
    expect(calls).toEqual(['refresh'])
    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
    expect(w.vm.categoriesLock).toEqual({ status: 'denied', lockedBy: null })
  })

  it('un sondeo en vuelo de una sesión ya cerrada no actúa', async () => {
    const calls = []
    const w = await denied(calls)
    let answer
    LockService.probeRefLocks.mockReturnValue(new Promise(resolve => { answer = resolve }))
    const checking = w.vm.checkCategoriesLockFree()
    w.vm.leaveCategoriesLock()
    answer(listing([]))
    await checking
    expect(calls).toEqual([])
    expect(w.vm.categoriesLock.status).toBe('idle')
  })
})

describe('categoriesLockMixin — perderlo', () => {
  async function held () {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost()
    await w.vm.enterCategoriesLock()
    return w
  }

  it('ref-lock-lost de la clave lo pasa a lost con el nombre y espera', async () => {
    const w = await held()
    const spy = jest.spyOn(window, 'setInterval')
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: KEY, lockedBy: 'Ana' } }))
    expect(w.vm.categoriesLock).toEqual({ status: 'lost', lockedBy: 'Ana' })
    expect(spy).toHaveBeenCalledWith(expect.any(Function), CATEGORIES_WAIT_POLL_MS)
    spy.mockRestore()
  })

  it('ref-lock-lost de otra clave se ignora', async () => {
    const w = await held()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: 'project_properties', lockedBy: 'Ana' } }))
    expect(w.vm.categoriesLock.status).toBe('held')
  })

  it('con el modal cerrado no hay nada que perder', () => {
    const w = mountHost()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: KEY, lockedBy: 'Ana' } }))
    expect(w.vm.categoriesLock.status).toBe('idle')
  })
})

describe('categoriesLockMixin — inactividad', () => {
  async function held (calls = []) {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountHost(calls)
    await w.vm.enterCategoriesLock()
    return w
  }

  it('expirar suelta, queda released_idle y NO espera', async () => {
    const w = await held()
    const spy = jest.spyOn(window, 'setInterval')
    w.vm.expireCategoriesLock()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.categoriesLock).toEqual({ status: 'released_idle', lockedBy: null })
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('al cerrar después de expirar no lo suelta de nuevo', async () => {
    const w = await held()
    w.vm.expireCategoriesLock()
    w.vm.leaveCategoriesLock()
    expect(LockService.releaseRef).toHaveBeenCalledTimes(1)
  })

  it('retomar refresca antes de volver a pedirlo y queda held', async () => {
    const calls = []
    const w = await held(calls)
    w.vm.expireCategoriesLock()
    LockService.acquireRef.mockImplementation(async () => { calls.push('acquire'); return { success: true } })
    await w.vm.resumeCategoriesLock()
    expect(calls).toEqual(['refresh', 'acquire'])
    expect(w.vm.categoriesLock.status).toBe('held')
  })

  it('retomar con el modal cerrado no pide nada', async () => {
    const w = mountHost()
    await w.vm.resumeCategoriesLock()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
  })

  it('expirar con el modal cerrado no hace nada', () => {
    const w = mountHost()
    w.vm.expireCategoriesLock()
    expect(w.vm.categoriesLock.status).toBe('idle')
    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})
