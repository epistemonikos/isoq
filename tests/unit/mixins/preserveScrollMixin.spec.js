// Congelar la posición de scroll mientras una recarga repinta la pantalla.
//
// Síntoma reportado: al guardar la extracción de datos de un estudio la página
// salta al tope y hay que volver a bajar. Dos causas distintas — un `$router.push`
// que dispara el `scrollBehavior` global, y el clamp del navegador cuando la
// `b-table` colapsa su `tbody` en el slot `table-busy`. Este mixin resuelve la
// segunda.
//
// Lo que estos tests verifican es el PROTOCOLO DE REINTENTO, no que la
// restauración aterrice: jsdom no tiene layout, así que `window.scrollTo` no mueve
// `pageYOffset` y no hay alturas reales que colapsar. Que el scroll quede
// efectivamente donde estaba se verifica en navegador.
//
// El clamp se simula con un `pageYOffset` respaldado por una variable que el
// `scrollTo` falso NO actualiza: es exactamente lo que hace el navegador cuando le
// pedimos una posición que el documento corto no tiene. Flipearla a mano simula el
// frame en que las filas vuelven.
import { shallowMount } from '@vue/test-utils'
import preserveScrollMixin from '@/mixins/preserveScrollMixin'

const Dummy = {
  mixins: [preserveScrollMixin],
  render (h) { return h('div') }
}

describe('preserveScrollMixin', () => {
  let currentY
  let rafQueue
  let now
  let originalRaf
  let originalCancelRaf
  let originalScrollTo

  /** Corre los callbacks agendados. Los que se re-agendan caen en la tanda siguiente. */
  const runFrame = () => {
    const pending = rafQueue
    rafQueue = []
    pending.forEach((cb) => cb())
  }

  beforeEach(() => {
    currentY = 0
    rafQueue = []
    now = 1000

    originalRaf = window.requestAnimationFrame
    originalCancelRaf = window.cancelAnimationFrame
    originalScrollTo = window.scrollTo

    window.requestAnimationFrame = jest.fn((cb) => {
      rafQueue.push(cb)
      return rafQueue.length
    })
    window.cancelAnimationFrame = jest.fn()
    // Deliberadamente NO toca currentY: simula el clamp del navegador.
    window.scrollTo = jest.fn()

    Object.defineProperty(window, 'pageYOffset', {
      configurable: true,
      get: () => currentY
    })
    jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    window.requestAnimationFrame = originalRaf
    window.cancelAnimationFrame = originalCancelRaf
    window.scrollTo = originalScrollTo
    delete window.pageYOffset
    jest.restoreAllMocks()
  })

  it('insiste con el scroll mientras la posición pedida no se alcanza', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)

    wrapper.vm.holdScrollPosition()
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)

    // La tabla colapsó en el slot `table-busy`: el documento se acortó y el
    // navegador clampeó nuestra posición a lo que queda.
    currentY = 900

    // Mientras siga corto, cada frame reintenta y ninguno acierta.
    runFrame()
    runFrame()
    runFrame()

    expect(window.scrollTo).toHaveBeenCalledTimes(3)
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 2340)
    wrapper.destroy()
  })

  it('deja de reescribir el scroll cuando la posición ya coincide', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition()
    currentY = 900

    runFrame()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)

    // Las filas volvieron y el scroll por fin aterrizó: nada que reescribir.
    currentY = 2340
    window.scrollTo.mockClear()
    runFrame()
    runFrame()

    expect(window.scrollTo).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('se detiene al agotar el presupuesto de tiempo', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition(600)
    currentY = 900

    now += 700
    runFrame()

    // El frame vencido todavía intenta, pero no agenda otro.
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    expect(rafQueue).toHaveLength(0)

    runFrame()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('respeta un presupuesto mayor si se lo pide explícitamente', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition(1000)
    currentY = 900

    now += 700
    runFrame()

    expect(rafQueue).toHaveLength(1)
    wrapper.destroy()
  })

  it('cede ante el usuario: un wheel cancela el hold y suelta los listeners', () => {
    const removeSpy = jest.spyOn(window, 'removeEventListener')
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition()

    window.dispatchEvent(new Event('wheel'))

    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalledWith('wheel', expect.any(Function), true)
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function), true)

    window.scrollTo.mockClear()
    runFrame()
    expect(window.scrollTo).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('también cede ante touchmove', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition()

    window.dispatchEvent(new Event('touchmove'))

    window.scrollTo.mockClear()
    runFrame()
    expect(window.scrollTo).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('no hace nada si ya estamos en el tope', () => {
    currentY = 0
    const wrapper = shallowMount(Dummy)

    wrapper.vm.holdScrollPosition()

    // Es lo que vuelve no-op a las llamadas desde `mounted`, sin condicionarlas
    // en cada call site.
    expect(window.requestAnimationFrame).not.toHaveBeenCalled()
    expect(window.scrollTo).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('un hold nuevo reemplaza al anterior en vez de competir con él', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)

    wrapper.vm.holdScrollPosition()
    wrapper.vm.holdScrollPosition()
    currentY = 900

    expect(window.cancelAnimationFrame).toHaveBeenCalledTimes(1)
    // El primer tick quedó cancelado, así que sólo uno de los dos escribe.
    runFrame()
    expect(window.scrollTo).toHaveBeenCalledTimes(1)
    wrapper.destroy()
  })

  it('destruir el componente corta un hold en vuelo', () => {
    currentY = 2340
    const wrapper = shallowMount(Dummy)
    wrapper.vm.holdScrollPosition()

    wrapper.destroy()

    expect(window.cancelAnimationFrame).toHaveBeenCalled()
    window.scrollTo.mockClear()
    runFrame()
    expect(window.scrollTo).not.toHaveBeenCalled()
  })

  it('cancelScrollHold es idempotente', () => {
    const wrapper = shallowMount(Dummy)
    expect(() => {
      wrapper.vm.cancelScrollHold()
      wrapper.vm.cancelScrollHold()
    }).not.toThrow()
    wrapper.destroy()
  })

  it('no explota si el entorno no tiene requestAnimationFrame', () => {
    currentY = 2340
    window.requestAnimationFrame = undefined
    const wrapper = shallowMount(Dummy)

    expect(() => wrapper.vm.holdScrollPosition()).not.toThrow()
    expect(window.scrollTo).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
