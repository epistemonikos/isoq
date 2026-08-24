/**
 * Un editor abierto retiene el ref-lock del estudio hasta que alguien lo cierra. Si la
 * persona se va a almorzar con el modal abierto, el estudio queda tomado para todo el
 * equipo: el latido de 30 s lo renueva indefinidamente sin importar que nadie escriba, y
 * los demás se quedan mirando un botón deshabilitado sin nadie a quien reclamarle.
 *
 * Este mixin sólo mide la inactividad y avisa antes de soltar. Deliberadamente no sabe de
 * locks ni de guardados: al llegar a cero llama al anfitrión, que es el único que sabe qué
 * tiene pendiente y qué modal cerrar. Por eso sirve igual para el Paso 3, el Paso 4 y
 * cualquier editor que venga después.
 *
 * Contrato con el anfitrión:
 *   onInactivityExpired()  — obligatorio. Persistir, cerrar, soltar; en ese orden.
 *   onInactivityWarning()  — opcional. Se llama una vez, al aparecer el aviso.
 *
 * El reloj resta timestamps, no acumula ticks. Chrome baja setInterval/setTimeout a ~1
 * disparo por minuto en pestañas ocultas después de ~5 min — el mismo throttling que ya
 * obligó a revalidar los locks en `visibilitychange` (lockService.revalidateLocks). Un
 * contador que descontara 1 s por tick mediría media hora donde pasaron cinco minutos, y
 * soltaría el lock cuando ya no lo tuviera. Con `Date.now()` la cuenta es correcta por
 * construcción: un tick perdido atrasa el repintado, nunca la decisión.
 */

// 25 + 5 = 30 min es decisión de producto. El techo no lo pone el backend: el TTL del
// lock es de 180 s pero el latido de 30 s lo renueva mientras la pestaña viva, así que
// sin esta constante el estudio queda tomado para siempre.
const WARN_AFTER_MS = 25 * 60 * 1000
const GRACE_MS = 5 * 60 * 1000

// Fase de vigilancia: 100 ticks en 25 min, cada uno una resta. 15 s es además la cadencia
// que ya usa el sondeo de locks, así que no introduce un ritmo nuevo. En el peor caso el
// aviso aparece 15 s tarde, invisible sobre un umbral de 25 minutos.
const WATCH_TICK_MS = 15000

// Fase de cuenta regresiva: un tick por segundo, y sirve SÓLO para que los dígitos se
// muevan. El disparo lo decide la comparación con `deadlineAt`.
const COUNTDOWN_TICK_MS = 1000

// Intención de estar trabajando. Sin `scroll` (lo dispara nuestro propio código) y sin
// `focus`/`visibilitychange` (volver a la pestaña no es escribir).
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart']

// Con el aviso a la vista sólo esto lo cancela. Tipear es trabajar, y cerrarle el modal
// a alguien que está escribiendo es hostil aunque el texto se guarde; pero un roce del
// mouse no es una respuesta, y extender el plazo por eso dejaría a la persona mirando
// una cuenta que no baja sin entender por qué.
const COMMITTED_ACTIVITY_EVENTS = ['keydown']

export default {
  data () {
    return {
      // Lo único que se renderiza: si el aviso está a la vista y cuánto falta.
      inactivityWarning: false,
      inactivitySecondsLeft: 0
    }
  },
  created () {
    // En `$_` y no en `data()`: `lastActivityAt` se reescribe en cada `mousemove`, unas
    // 60 veces por segundo. Reactivo, cada movimiento del mouse despertaría al observer
    // y al render de un modal de 1500 líneas.
    this.$_inactivity = null
  },
  beforeDestroy () {
    this.stopInactivityWatch()
  },
  methods: {
    /** Arma el reloj. Idempotente: rearmar reinicia el conteo desde cero. */
    startInactivityWatch () {
      if (typeof window === 'undefined') return
      // Sin esto, dos llamadas dejarían dos intervalos vivos y una segunda expiración
      // dispararía sobre un editor ya cerrado.
      this.stopInactivityWatch()

      const state = {
        lastActivityAt: Date.now(),
        deadlineAt: null,
        timer: null,
        onActivity: (event) => this.noteInactivityActivity(event),
        // Al volver al frente recalculamos en el acto en vez de esperar el próximo tick,
        // que en una pestaña throttleada puede tardar un minuto.
        onVisibility: () => {
          if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
          this.inactivityTick()
        }
      }
      ACTIVITY_EVENTS.forEach((name) => {
        window.addEventListener(name, state.onActivity, { passive: true, capture: true })
      })
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', state.onVisibility)
      }
      this.$_inactivity = state
      this.armInactivityTimer(WATCH_TICK_MS)
    },

    /** Desarma y esconde el aviso. Idempotente: se la puede llamar sin reloj armado. */
    stopInactivityWatch () {
      const state = this.$_inactivity
      this.inactivityWarning = false
      this.inactivitySecondsLeft = 0
      if (!state) return
      this.$_inactivity = null
      if (state.timer) clearInterval(state.timer)
      if (typeof window !== 'undefined') {
        ACTIVITY_EVENTS.forEach((name) => {
          window.removeEventListener(name, state.onActivity, true)
        })
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', state.onVisibility)
      }
    },

    /** Botón "Sigo trabajando": vuelve a la vigilancia con los 25 min completos. */
    keepWorkingOnInactivity () {
      const state = this.$_inactivity
      if (!state) return
      this.inactivityWarning = false
      this.inactivitySecondsLeft = 0
      state.deadlineAt = null
      state.lastActivityAt = Date.now()
      this.armInactivityTimer(WATCH_TICK_MS)
    },

    armInactivityTimer (everyMs) {
      const state = this.$_inactivity
      if (!state) return
      if (state.timer) clearInterval(state.timer)
      state.timer = setInterval(this.inactivityTick, everyMs)
    },

    noteInactivityActivity (event) {
      const state = this.$_inactivity
      if (!state) return
      if (this.inactivityWarning) {
        // Con el aviso a la vista sólo tipear cuenta; lo demás se ignora.
        const type = event && event.type
        if (!COMMITTED_ACTIVITY_EVENTS.includes(type)) return
        this.keepWorkingOnInactivity()
        return
      }
      state.lastActivityAt = Date.now()
    },

    inactivityTick () {
      const state = this.$_inactivity
      if (!state) return
      const now = Date.now()

      if (!this.inactivityWarning) {
        if (now - state.lastActivityAt < WARN_AFTER_MS) return
        // El plazo se cuenta desde AHORA, no desde el instante teórico de los 25 min: en
        // una pestaña throttleada el tick puede llegar un minuto tarde, y descontar ese
        // minuto de la gracia le robaría al usuario tiempo que no gastó.
        state.deadlineAt = now + GRACE_MS
        this.inactivityWarning = true
        this.inactivitySecondsLeft = Math.ceil(GRACE_MS / 1000)
        this.armInactivityTimer(COUNTDOWN_TICK_MS)
        if (typeof this.onInactivityWarning === 'function') this.onInactivityWarning()
        return
      }

      const remaining = state.deadlineAt - now
      this.inactivitySecondsLeft = Math.max(0, Math.ceil(remaining / 1000))
      if (remaining > 0) return

      // El reloj se apaga ANTES de avisar: `onInactivityExpired` cierra el modal, y un
      // intervalo que sobreviviera volvería a disparar sobre un editor ya cerrado.
      this.stopInactivityWatch()
      if (typeof this.onInactivityExpired === 'function') this.onInactivityExpired()
    }
  }
}
