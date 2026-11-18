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

/**
 * Del lado del anfitrión: pide a los editores de `scope` que persistan lo pendiente, y
 * devuelve una promesa que resuelve cuando terminaron de escribir.
 *
 * Esperar no es un lujo: quien se va suele soltar el ref-lock justo después, y un PATCH
 * disparado pero todavía en vuelo llega sin permiso. Medido en navegador al cambiar de
 * etapa en el Paso 4: el servidor contestaba 409 `lock_not_held` y el dato se perdía igual
 * que si nunca se hubiera pedido el flush.
 *
 * Los editores declaran su escritura devolviéndola desde `flushPendingEdits`; el que no
 * devuelve nada —hay varios que escriben y siguen— no cambia de comportamiento, y la
 * promesa resuelve igual. Nunca rechaza: un editor que falla no puede dejar clavado al que
 * se está yendo, y su error ya viaja por el canal de conflicto.
 */
export function requestPendingEditsFlush (scope) {
  if (typeof window === 'undefined') return Promise.resolve([])
  const detail = { scope: scope || null, pending: [] }
  window.dispatchEvent(new CustomEvent(FLUSH_PENDING_EDITS, { detail }))
  return Promise.all(detail.pending.map(p => Promise.resolve(p).catch(() => null)))
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
      const detail = (event && event.detail) || {}
      if (typeof this.flushPendingEdits !== 'function') return
      const escritura = this.flushPendingEdits(detail.scope || null)
      // El componente no tiene por qué conocer el evento: si devolvió algo esperable, lo
      // anota acá para que el anfitrión pueda aguantar el lock hasta que termine.
      if (escritura && typeof escritura.then === 'function' && Array.isArray(detail.pending)) {
        detail.pending.push(escritura)
      }
    }
  }
}
