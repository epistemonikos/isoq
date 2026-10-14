/**
 * Mantiene la posición de scroll mientras una recarga repinta la pantalla.
 *
 * El problema que resuelve no es "el scroll se mueve", es que el navegador lo
 * **clampea**. Cuando `b-table` entra en `busy` reemplaza el `tbody` completo por
 * el slot `table-busy`: diez filas altas se vuelven una fila con spinner y el
 * documento se acorta de verdad. Un `scrollTo(0, 2340)` contra un documento que
 * ahora mide 900px no falla ni avisa: aterriza en el máximo posible y se pierde.
 *
 * De ahí la estrategia: no restaurar una vez, sino **insistir** durante unos
 * frames hasta que el contenido vuelve y la posición pedida existe otra vez. Los
 * intentos contra el documento corto no hacen nada y no molestan; el frame en que
 * las filas reaparecen es el que acierta.
 *
 * Por qué reintentar en vez de esperar la recarga: en `editList.getList()` no hay
 * una promesa que esperar. Su `.then` dispara siete cascadas (`getProject`,
 * `getAllReferences`, `getFinding`, …) y ninguna devuelve la suya, así que no
 * existe el momento "ya terminó de repintarse" al que enganchar la restauración.
 * Un solo `$nextTick` llegaría antes que todas.
 *
 * Uso: llamar `holdScrollPosition()` justo antes de disparar la recarga. Desde
 * `mounted` es no-op (`scrollY` es 0 y no hay nada que sostener), así que los call
 * sites no necesitan condicionarlo.
 */

// Cuánto tiempo insistimos. Mide sólo el repintado, no la red: cuando el hold
// arranca, el `.then` del PATCH ya consumió la latencia. 600ms cubre de sobra un
// repintado de tabla; pasado eso, seguir peleando con el layout es peor que
// aceptar dónde quedamos.
const DEFAULT_BUDGET_MS = 600

// El hold tiene que ceder ante el usuario: si mientras restauramos la posición la
// persona decide scrollear por su cuenta, pelearle es peor que el bug original.
//
// Sólo intención inequívoca de scrollear. Los tres candidatos que quedaron fuera,
// con su motivo, porque los tres parecen razonables hasta que se los piensa:
//   `scroll`    — lo dispara nuestro propio `scrollTo`: el hold se cancelaría a sí
//                 mismo en el primer frame.
//   `mousedown` — el flujo real es guardar y clickear "editar" en la fila
//                 siguiente; ese click cancelaría el hold justo cuando hace falta.
//   `keydown`   — cubriría flechas y PageDown, pero también a quien tabula entre
//                 campos sin querer moverse. Filtrar por tecla es complejidad que
//                 no se paga: después de guardar nadie navega con el teclado.
const INTENT_EVENTS = ['wheel', 'touchmove']

export default {
  created () {
    // En `$_` y no en `data()`: es bookkeeping interno, nadie lo renderiza, y
    // hacerlo reactivo sólo agregaría trabajo al observer en cada frame.
    this.$_scrollHold = null
  },
  beforeDestroy () {
    // Un rAF en vuelo sobre un componente destruido tocaría `window` en nombre de
    // una vista que ya no existe.
    this.cancelScrollHold()
  },
  methods: {
    /**
     * Congela `window.scrollY` en su valor actual durante `budgetMs`.
     * No-op si ya estamos en el tope o si el entorno no tiene rAF (jsdom sin mock).
     */
    holdScrollPosition (budgetMs = DEFAULT_BUDGET_MS) {
      if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') return
      // Dos recargas encadenadas no deben dejar dos rAF compitiendo por la misma
      // ventana: el hold nuevo reemplaza al viejo.
      this.cancelScrollHold()

      const target = window.pageYOffset || window.scrollY || 0
      if (!target) return

      const deadline = Date.now() + budgetMs
      const state = { rafId: null, cancelled: false, teardown: null }

      const onIntent = () => this.cancelScrollHold()
      INTENT_EVENTS.forEach((name) => {
        window.addEventListener(name, onIntent, { passive: true, capture: true })
      })
      state.teardown = () => {
        INTENT_EVENTS.forEach((name) => {
          window.removeEventListener(name, onIntent, true)
        })
      }
      this.$_scrollHold = state

      const tick = () => {
        if (state.cancelled) return
        // Si ya estamos donde queremos, no reescribimos: un `scrollTo` redundante
        // cancelaría un smooth scroll legítimo que estuviera en curso.
        if ((window.pageYOffset || window.scrollY || 0) !== target) {
          window.scrollTo(0, target)
        }
        if (Date.now() >= deadline) {
          this.cancelScrollHold()
          return
        }
        state.rafId = window.requestAnimationFrame(tick)
      }
      state.rafId = window.requestAnimationFrame(tick)
    },
    /** Corta un hold en curso. Idempotente: se la puede llamar sin hold activo. */
    cancelScrollHold () {
      const state = this.$_scrollHold
      if (!state) return
      state.cancelled = true
      if (state.rafId && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(state.rafId)
      }
      if (state.teardown) state.teardown()
      this.$_scrollHold = null
    }
  }
}
