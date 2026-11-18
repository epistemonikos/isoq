import pendingEditsMixin, { requestPendingEditsFlush, FLUSH_PENDING_EDITS } from '@/mixins/pendingEditsMixin'

/**
 * Pedir el flush no alcanzaba: quien se va necesita saber CUÁNDO terminó de escribirse.
 *
 * Medido en navegador: al cambiar de etapa, el PATCH salía y el servidor lo rechazaba con
 * 409 `lock_not_held`. El guardado había arrancado, pero la navegación soltaba el ref-lock
 * de la celda que se abandona mientras el PATCH viajaba, y llegaba sin permiso. El dato se
 * perdía igual que antes, ahora con un error de por medio.
 *
 * Así que el canal devuelve una promesa: los editores que sepan cuándo terminaron la
 * declaran, y el anfitrión puede esperarla antes de soltar el lock. Quien no declare nada
 * —hay varios que sólo escriben y siguen— no cambia de comportamiento.
 */
describe('requestPendingEditsFlush — esperar a que lo pendiente se escriba', () => {
  const handlers = []

  const escuchar = (fn) => {
    const h = (event) => {
      const detail = event.detail
      const r = fn(detail.scope)
      if (r && typeof r.then === 'function' && Array.isArray(detail.pending)) detail.pending.push(r)
    }
    handlers.push(h)
    window.addEventListener(FLUSH_PENDING_EDITS, h)
  }

  afterEach(() => {
    while (handlers.length) window.removeEventListener(FLUSH_PENDING_EDITS, handlers.pop())
  })

  it('devuelve una promesa que no resuelve hasta que el editor terminó', async () => {
    let resolver
    let escrito = false
    escuchar(() => new Promise(r => { resolver = () => { escrito = true; r() } }))

    const espera = requestPendingEditsFlush('R1')
    expect(escrito).toBe(false)

    resolver()
    await espera

    expect(escrito).toBe(true)
  })

  it('espera a todos los editores, no al primero', async () => {
    const terminados = []
    const lento = new Promise(r => setTimeout(() => { terminados.push('lento'); r() }, 20))
    escuchar(() => { terminados.push('rapido'); return Promise.resolve() })
    escuchar(() => lento)

    await requestPendingEditsFlush('R1')

    expect(terminados).toEqual(['rapido', 'lento'])
  })

  it('un editor que falla no deja colgado al que se va', async () => {
    escuchar(() => Promise.reject(new Error('409')))

    await expect(requestPendingEditsFlush('R1')).resolves.toBeDefined()
  })

  it('sigue resolviendo cuando nadie declara nada', async () => {
    escuchar(() => undefined)

    await expect(requestPendingEditsFlush('R1')).resolves.toBeDefined()
  })

  // El mixin es quien recoge lo que el componente devuelve: los editores no tienen que
  // conocer el detalle del evento.
  it('el mixin recoge la promesa que devuelve flushPendingEdits del componente', async () => {
    let terminado = false
    const vm = {
      flushPendingEdits: () => new Promise(r => setTimeout(() => { terminado = true; r() }, 5)),
      handlePendingEditsFlush: pendingEditsMixin.methods.handlePendingEditsFlush
    }
    const h = (e) => vm.handlePendingEditsFlush(e)
    handlers.push(h)
    window.addEventListener(FLUSH_PENDING_EDITS, h)

    await requestPendingEditsFlush('R1')

    expect(terminado).toBe(true)
  })
})
