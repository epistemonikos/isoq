/**
 * Canal "persistí lo pendiente ya", del lado del hijo.
 *
 * El problema: quien cierra el editor no es quien tiene el texto sin guardar. En el modal
 * del Paso 4 hay cuatro AssessmentForm y ocho CamelotAssessmentCard, cada uno con su propio
 * debounce de 1,5 s, y viven detrás de un `b-tabs` con `v-for` dentro de un `v-if` por
 * etapa: el padre no tiene una referencia estable a ellos. `$refs.assessmentForm` es un
 * array de cuatro en las etapas 0-1 y un vm suelto en las 2-3, y Vue 2 no limpia esos
 * arrays de forma confiable cuando cambia un `v-if`. Si el modal se cierra con un debounce
 * agendado, lo tipeado en el último segundo y medio se pierde en silencio.
 *
 * Se resuelve por difusión y no por el árbol de componentes: el mismo canal `window` por el
 * que ya viajan `ref-lock-lost`, `ref-lock-conflict` y `ref-locks-changed`.
 *
 * El `scope` (el refId del estudio) no es opcional aunque hoy nadie choque: los tabs
 * externos de viewProject se ocultan con `d-none`, no con `v-if`, así que el tab iSoQ está
 * co-montado con "My data". En cuanto un segundo editor adopte este mixin —evidenceProfileForm
 * es la extensión anunciada— una expiración flushearía los borradores del otro.
 *
 * Contrato: el componente provee `flushPendingEdits(scope)`.
 */
export const FLUSH_PENDING_EDITS = 'flush-pending-edits'

/** Del lado del anfitrión: pide a los editores de `scope` que persistan lo pendiente. */
export function requestPendingEditsFlush (scope) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(FLUSH_PENDING_EDITS, { detail: { scope: scope || null } }))
}

export default {
  mounted () {
    window.addEventListener(FLUSH_PENDING_EDITS, this.handlePendingEditsFlush)
  },
  beforeDestroy () {
    window.removeEventListener(FLUSH_PENDING_EDITS, this.handlePendingEditsFlush)
  },
  methods: {
    handlePendingEditsFlush (event) {
      const scope = (event && event.detail && event.detail.scope) || null
      if (typeof this.flushPendingEdits === 'function') this.flushPendingEdits(scope)
    }
  }
}
