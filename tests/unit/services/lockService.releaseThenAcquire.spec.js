import axios from 'axios'
import LockService from '@/services/lockService'

jest.mock('axios')
jest.mock('@/utils/Api', () => ({ getHeaders: () => ({ Authorization: 'Bearer test' }) }))
jest.mock('@/store', () => ({
  store: {
    state: { isOnline: true },
    getters: { isLoggedIn: true }
  }
}))
Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => 'token'), removeItem: jest.fn(), setItem: jest.fn() },
  writable: true
})

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(LockService, 'isEnabled', 'get').mockReturnValue(true)
  jest.spyOn(LockService, 'startRefHeartbeat').mockImplementation(() => {})
  jest.spyOn(LockService, 'stopRefHeartbeat').mockImplementation(() => {})
  LockService.refLocks.clear()
  LockService.pendingRefReleases.clear()
  LockService.pendingRefAcquires.clear()
  LockService.offlineRefs.clear()
  LockService.retryingRefs.clear()
  LockService.cancelledRetries.clear()
})

/**
 * Cerrar y reabrir el modal de Propiedades manda un DELETE y un POST de la misma clave casi
 * juntos. Si el DELETE llega último, borra el lock recién tomado y el editor queda
 * habilitado sin lock detrás.
 */
describe('LockService — soltar y volver a tomar la misma clave', () => {
  it('el POST del acquire sale recién cuando terminó el DELETE del release', async () => {
    const order = []
    let finishDelete
    global.fetch = jest.fn(() => new Promise((resolve) => {
      finishDelete = () => { order.push('delete'); resolve({ ok: true }) }
    }))
    axios.post.mockImplementation(() => {
      order.push('post')
      return Promise.resolve({ data: { status: true } })
    })
    LockService.refLocks.set('project_properties', 'p1')

    const releasing = LockService.releaseRef('project_properties')
    const acquiring = LockService.acquireRef('p1', 'project_properties')
    await Promise.resolve()
    await Promise.resolve()
    expect(order).toEqual([])

    finishDelete()
    await releasing
    await acquiring
    expect(order).toEqual(['delete', 'post'])
    expect(LockService.heldRefs()).toEqual(['project_properties'])
    expect(LockService.pendingRefReleases.size).toBe(0)
  })

  it('sin release en vuelo el acquire no espera nada', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    await LockService.acquireRef('p1', 'project_properties')
    expect(axios.post).toHaveBeenCalledTimes(1)
  })

  it('un release de OTRA clave no demora el acquire', async () => {
    global.fetch = jest.fn(() => new Promise(() => {})) // nunca termina
    axios.post.mockResolvedValue({ data: { status: true } })
    LockService.refLocks.set('R1', 'p1')

    LockService.releaseRef('R1')
    await LockService.acquireRef('p1', 'project_properties')
    expect(axios.post).toHaveBeenCalledTimes(1)
  })
})

/**
 * StepFour y EditReferenceModal sueltan con `releaseRef()` todo lo que tienen al cerrar —y
 * StepFour lo hace después de esperar la escritura en vuelo—. Si en esa ventana la persona
 * ya entró a Propiedades, el global le quitaba el lock al formulario sin que nadie se
 * enterara. El lock de propiedades tiene dueño propio (propertiesLockMixin).
 */
describe('LockService — releaseRef() global y el lock de propiedades', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
  })

  it('sin argumentos suelta todo menos project_properties', async () => {
    LockService.refLocks.set('R1', 'p1')
    LockService.refLocks.set('project_properties', 'p1')
    await LockService.releaseRef()
    expect(LockService.heldRefs()).toEqual(['project_properties'])
    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(global.fetch.mock.calls[0][0]).toBe('/api/lock/p1/ref/R1')
  })

  it('con { all: true } suelta también project_properties', async () => {
    LockService.refLocks.set('R1', 'p1')
    LockService.refLocks.set('project_properties', 'p1')
    await LockService.releaseRef(null, { all: true })
    expect(LockService.heldRefs()).toEqual([])
  })

  it('cerrar la pestaña del navegador (pagehide) suelta project_properties', async () => {
    LockService.refLocks.set('project_properties', 'p1')
    window.dispatchEvent(new Event('pagehide'))
    await Promise.resolve()
    expect(global.fetch.mock.calls.map(c => c[0])).toContain('/api/lock/p1/ref/project_properties')
  })

  it('pedirlo por nombre lo suelta', async () => {
    LockService.refLocks.set('project_properties', 'p1')
    await LockService.releaseRef('project_properties')
    expect(LockService.heldRefs()).toEqual([])
  })
})

/**
 * `project_properties` es la misma clave en todos los proyectos. En el modal de la lista se
 * cierra A y se abre B: un acquire de A todavía en vuelo no puede contestarle a B, ni el
 * lock de A contar como el de B.
 */
describe('LockService — misma clave, otro proyecto', () => {
  const KEY = 'project_properties'

  beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
  })

  it('con el acquire de A en vuelo, B espera, suelta A y pide el suyo', async () => {
    const posts = []
    let grantA
    axios.post.mockImplementation((url) => {
      posts.push(url)
      if (url.includes('/A/')) return new Promise(resolve => { grantA = () => resolve({ data: { status: true } }) })
      return Promise.resolve({ data: { status: true } })
    })
    const a = LockService.acquireRef('A', KEY)
    const b = LockService.acquireRef('B', KEY)
    await Promise.resolve()
    expect(posts).toEqual(['/api/lock/A/ref/project_properties'])

    grantA()
    await a
    const resultB = await b
    expect(posts).toEqual(['/api/lock/A/ref/project_properties', '/api/lock/B/ref/project_properties'])
    expect(global.fetch.mock.calls.map(c => c[0])).toContain('/api/lock/A/ref/project_properties')
    expect(resultB).toEqual({ success: true })
    expect([...LockService.refLocks.entries()]).toEqual([[KEY, 'B']])
  })

  it('con el lock de A tomado, pedir B suelta A y toma B', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    LockService.refLocks.set(KEY, 'A')
    const result = await LockService.acquireRef('B', KEY)
    expect(result).toEqual({ success: true })
    expect(axios.post).toHaveBeenCalledWith('/api/lock/B/ref/project_properties', {}, expect.anything())
    expect(global.fetch.mock.calls.map(c => c[0])).toEqual(['/api/lock/A/ref/project_properties'])
    expect([...LockService.refLocks.entries()]).toEqual([[KEY, 'B']])
  })

  it('el mismo proyecto sigue compartiendo un solo POST', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    await Promise.all([LockService.acquireRef('A', KEY), LockService.acquireRef('A', KEY)])
    expect(axios.post).toHaveBeenCalledTimes(1)
  })
})

/**
 * Un grant offline se convierte en lock real al reconectar. Si la persona sale del editor
 * mientras ese POST está en vuelo, `releaseRef(key)` no encuentra nada que soltar y el 200
 * deja el lock tomado. Para `project_properties` eso es hasta cerrar la página, porque el
 * `releaseRef()` global ya no la barre: los demás ven «X está editando» con X en otra parte.
 */
describe('LockService — salir con el reintento offline en vuelo', () => {
  const { store } = require('@/store')

  afterEach(() => { store.state.isOnline = true })

  it('el 200 que llega después de soltar suelta en el acto', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
    let grant
    axios.post.mockImplementation(() => new Promise(resolve => { grant = () => resolve({ data: { status: true } }) }))
    store.state.isOnline = false
    await LockService.acquireRef('p1', 'project_properties') // grant offline
    store.state.isOnline = true

    const retrying = LockService.retryOfflineRefs()
    await Promise.resolve()
    await LockService.releaseRef('project_properties') // sale con el POST en vuelo
    grant()
    await retrying

    expect(LockService.heldRefs()).toEqual([])
    expect(global.fetch.mock.calls.map(c => c[0])).toContain('/api/lock/p1/ref/project_properties')
  })

  it('salir y volver a entrar antes del 200 conserva el lock', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
    let grant
    axios.post.mockImplementationOnce(() => new Promise(resolve => { grant = () => resolve({ data: { status: true } }) }))
    axios.post.mockResolvedValue({ data: { status: true } })
    store.state.isOnline = false
    await LockService.acquireRef('p1', 'project_properties')
    store.state.isOnline = true

    const retrying = LockService.retryOfflineRefs()
    await Promise.resolve()
    await LockService.releaseRef('project_properties')
    await LockService.acquireRef('p1', 'project_properties') // vuelve a entrar y lo obtiene
    grant() // recién ahora llega el 200 del reintento viejo
    await retrying
    expect(LockService.heldRefs()).toEqual(['project_properties'])
  })

  it('salir, perder la red y volver a entrar offline antes del 200 conserva el lock', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true }))
    let grant
    axios.post.mockImplementationOnce(() => new Promise(resolve => { grant = () => resolve({ data: { status: true } }) }))
    store.state.isOnline = false
    await LockService.acquireRef('p1', 'project_properties')
    store.state.isOnline = true

    const retrying = LockService.retryOfflineRefs()
    await Promise.resolve()
    await LockService.releaseRef('project_properties') // sale con el POST en vuelo
    store.state.isOnline = false
    await LockService.acquireRef('p1', 'project_properties') // vuelve a entrar sin red
    grant()
    await retrying
    expect(LockService.heldRefs()).toEqual(['project_properties'])
  })

  it('sin salir, el reintento deja el lock tomado', async () => {
    axios.post.mockResolvedValue({ data: { status: true } })
    store.state.isOnline = false
    await LockService.acquireRef('p1', 'project_properties')
    store.state.isOnline = true
    await LockService.retryOfflineRefs()
    expect(LockService.heldRefs()).toEqual(['project_properties'])
  })
})
