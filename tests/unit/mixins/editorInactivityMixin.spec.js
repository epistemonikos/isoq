import { shallowMount, createLocalVue } from '@vue/test-utils'
import editorInactivityMixin from '@/mixins/editorInactivityMixin'

const localVue = createLocalVue()

const WARN_AFTER = 25 * 60 * 1000
const GRACE = 5 * 60 * 1000
const WATCH_TICK = 15000

const Host = {
  mixins: [editorInactivityMixin],
  template: '<div />',
  data () { return { expired: 0, warned: 0 } },
  methods: {
    onInactivityExpired () { this.expired++ },
    onInactivityWarning () { this.warned++ }
  }
}

const BASE = new Date('2026-08-24T10:00:00Z').getTime()

/**
 * Los timers falsos se encienden DESPUÉS de montar y ANTES de armar el reloj: el mixin
 * toma `Date.now()` como base en `startInactivityWatch`, así que armarlo con el reloj real
 * dejaría `lastActivityAt` en otra época que los `advanceTimersByTime`. Y no van en
 * `beforeEach` porque los timers modernos de Jest 27 falsean `process.nextTick`, del que
 * depende flushPromises (ver Criteria.refLock.spec.js).
 */
function watching () {
  const wrapper = shallowMount(Host, { localVue })
  jest.useFakeTimers('modern')
  jest.setSystemTime(BASE)
  wrapper.vm.startInactivityWatch()
  return wrapper
}

/**
 * Con los timers `modern` de Jest 27, `advanceTimersByTime` ya mueve `Date.now()`: sumarle
 * un `setSystemTime` encima avanzaría el doble. Los tests de throttling de más abajo sí
 * usan `setSystemTime` a mano, pero para lo contrario — saltar el reloj SIN disparar los
 * timers, que es exactamente lo que hace una pestaña oculta.
 */
function advance (wrapper, ms) {
  jest.advanceTimersByTime(ms)
}

afterEach(() => { jest.useRealTimers() })

describe('editorInactivityMixin — fase de vigilancia', () => {
  it('a los 24 minutos todavía no avisa', () => {
    const wrapper = watching()
    advance(wrapper, 24 * 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(false)
    expect(wrapper.vm.warned).toBe(0)
    wrapper.destroy()
  })

  it('a los 25 minutos aparece el aviso con los 5 minutos completos', () => {
    const wrapper = watching()
    advance(wrapper, WARN_AFTER)
    expect(wrapper.vm.inactivityWarning).toBe(true)
    expect(wrapper.vm.inactivitySecondsLeft).toBe(300)
    expect(wrapper.vm.warned).toBe(1)
    expect(wrapper.vm.expired).toBe(0)
    wrapper.destroy()
  })

  it('un movimiento del mouse reinicia la cuenta', () => {
    const wrapper = watching()
    advance(wrapper, 24 * 60 * 1000)
    window.dispatchEvent(new Event('mousemove'))
    advance(wrapper, 24 * 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(false)
    wrapper.destroy()
  })
})

describe('editorInactivityMixin — cuenta regresiva', () => {
  it('descuenta y expira exactamente una vez', () => {
    const wrapper = watching()
    advance(wrapper, WARN_AFTER)

    advance(wrapper, 60 * 1000)
    expect(wrapper.vm.inactivitySecondsLeft).toBe(240)

    advance(wrapper, GRACE)
    expect(wrapper.vm.expired).toBe(1)

    // El reloj se apagó antes de avisar: sin eso volvería a disparar sobre un editor
    // que `onInactivityExpired` ya cerró.
    advance(wrapper, 10 * 60 * 1000)
    expect(wrapper.vm.expired).toBe(1)
    wrapper.destroy()
  })

  // Decisión de producto: tipear es trabajar; un roce del mouse no es una respuesta.
  it('con el aviso a la vista, tipear lo cancela y mover el mouse no', () => {
    const wrapper = watching()
    advance(wrapper, WARN_AFTER)
    expect(wrapper.vm.inactivityWarning).toBe(true)

    window.dispatchEvent(new Event('mousemove'))
    advance(wrapper, 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(true)
    expect(wrapper.vm.inactivitySecondsLeft).toBe(240)

    window.dispatchEvent(new Event('keydown'))
    expect(wrapper.vm.inactivityWarning).toBe(false)
    advance(wrapper, 24 * 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(false)
    wrapper.destroy()
  })

  it('"Sigo trabajando" devuelve los 25 minutos completos', () => {
    const wrapper = watching()
    advance(wrapper, WARN_AFTER)
    wrapper.vm.keepWorkingOnInactivity()
    expect(wrapper.vm.inactivityWarning).toBe(false)

    advance(wrapper, 24 * 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(false)
    advance(wrapper, 2 * 60 * 1000)
    expect(wrapper.vm.inactivityWarning).toBe(true)
    wrapper.destroy()
  })
})

/**
 * El corazón del diseño. Chrome baja setInterval a ~1 disparo por minuto en pestañas
 * ocultas, así que la cuenta NO puede acumular ticks: tiene que restar timestamps.
 */
describe('editorInactivityMixin — resistencia al throttling', () => {
  it('UN solo tick tardío alcanza para entrar en aviso', () => {
    const wrapper = watching()
    // La pestaña estuvo oculta media hora y sólo llega un tick.
    jest.setSystemTime(BASE + 31 * 60 * 1000)
    jest.advanceTimersByTime(WATCH_TICK)

    // Un contador que descontara 1 s por tick habría necesitado 1500 ticks para esto:
    // si alguien reintroduce la acumulación, este test se pone rojo.
    expect(wrapper.vm.inactivityWarning).toBe(true)
    wrapper.destroy()
  })

  it('UN solo tick tardío alcanza para expirar', () => {
    const wrapper = watching()
    jest.setSystemTime(BASE + 31 * 60 * 1000)
    jest.advanceTimersByTime(WATCH_TICK)
    expect(wrapper.vm.inactivityWarning).toBe(true)

    // La gracia se cuenta desde que apareció el aviso, no desde el instante teórico.
    jest.setSystemTime(Date.now() + GRACE + 1000)
    jest.advanceTimersByTime(1000)
    expect(wrapper.vm.expired).toBe(1)
    wrapper.destroy()
  })

  it('volver al frente recalcula sin esperar el próximo tick', () => {
    const wrapper = watching()
    jest.setSystemTime(BASE + 26 * 60 * 1000)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    // Sin avanzar un solo timer.
    expect(wrapper.vm.inactivityWarning).toBe(true)
    wrapper.destroy()
  })

  it('no recalcula si la pestaña se está escondiendo', () => {
    const wrapper = watching()
    jest.setSystemTime(BASE + 26 * 60 * 1000)
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(wrapper.vm.inactivityWarning).toBe(false)
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    wrapper.destroy()
  })
})

describe('editorInactivityMixin — ciclo de vida', () => {
  it('armar dos veces no deja dos intervalos vivos', () => {
    const wrapper = watching()
    wrapper.vm.startInactivityWatch()
    advance(wrapper, WARN_AFTER + GRACE)
    // Con dos intervalos, el segundo dispararía sobre un editor ya cerrado.
    expect(wrapper.vm.expired).toBe(1)
    wrapper.destroy()
  })

  it('stopInactivityWatch es idempotente y esconde el aviso', () => {
    const wrapper = watching()
    advance(wrapper, WARN_AFTER)
    expect(wrapper.vm.inactivityWarning).toBe(true)

    wrapper.vm.stopInactivityWatch()
    wrapper.vm.stopInactivityWatch()
    expect(wrapper.vm.inactivityWarning).toBe(false)

    advance(wrapper, 40 * 60 * 1000)
    expect(wrapper.vm.expired).toBe(0)
    wrapper.destroy()
  })

  it('destruir el componente corta el reloj', () => {
    const wrapper = watching()
    wrapper.destroy()
    advance(wrapper, WARN_AFTER + GRACE)
    expect(wrapper.vm.expired).toBe(0)
  })

  it('la actividad después de desarmar no revive nada', () => {
    const wrapper = watching()
    wrapper.vm.stopInactivityWatch()
    window.dispatchEvent(new Event('keydown'))
    advance(wrapper, WARN_AFTER + GRACE)
    expect(wrapper.vm.expired).toBe(0)
    wrapper.destroy()
  })

  it('un anfitrión sin onInactivityWarning no rompe', () => {
    const Bare = {
      mixins: [editorInactivityMixin],
      template: '<div />',
      data () { return { expired: 0 } },
      methods: { onInactivityExpired () { this.expired++ } }
    }
    const wrapper = shallowMount(Bare, { localVue })
    jest.useFakeTimers('modern')
    jest.setSystemTime(BASE)
    wrapper.vm.startInactivityWatch()
    // El guard `typeof === 'function'` es lo que se prueba: sin él, entrar en aviso
    // tiraría al invocar un onInactivityWarning inexistente.
    jest.advanceTimersByTime(WARN_AFTER)
    jest.advanceTimersByTime(GRACE)
    expect(wrapper.vm.expired).toBe(1)
    wrapper.destroy()
  })
})
