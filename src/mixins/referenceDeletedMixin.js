import { REFERENCE_DELETED_EVENT } from '@/utils/referenceDeleted'

/**
 * Cierra el editor de un estudio cuando otra persona lo borra en el Paso 1.
 *
 * El editor queda inútil: el servidor ya no acepta escrituras sobre ese estudio y la fila
 * va a desaparecer en cuanto la vista se refresque. Dejarlo abierto en solo lectura —lo
 * que hace con un lock perdido— invitaría a esperar algo que no va a pasar. El aviso con
 * quién lo borró lo muestra `OfflineIndicator`, una sola vez para toda la app.
 *
 * El componente provee las dos mitades que el mixin no puede saber:
 *   referenceDeletedOpenStudy()  — el `ref_id` del estudio abierto ahora, o null
 *   closeForDeletedReference()   — cerrar el editor sin guardar
 *
 * Al cerrar, cada editor corre además su limpieza de `@hidden` a mano cuando la pestaña
 * está oculta: ahí `hidden` no llega —depende de `transitionend`, que no corre en segundo
 * plano (medido en StepFour)— y el editor seguiría contando como abierto, con el refresco
 * de la vista retenido detrás. Es justo el caso de este aviso: le llega a quien no está
 * mirando.
 */
export default {
  mounted () {
    window.addEventListener(REFERENCE_DELETED_EVENT, this.onReferenceDeletedForEditor)
  },
  beforeDestroy () {
    window.removeEventListener(REFERENCE_DELETED_EVENT, this.onReferenceDeletedForEditor)
  },
  methods: {
    onReferenceDeletedForEditor (event) {
      const detail = (event && event.detail) || {}
      if (!detail.refId || typeof this.referenceDeletedOpenStudy !== 'function') return
      if (this.referenceDeletedOpenStudy() !== detail.refId) return
      this.closeForDeletedReference(detail)
    },
    /** True si `hidden` no va a llegar por sí solo (ver arriba). */
    hiddenWontArrive () {
      return typeof document !== 'undefined' && document.visibilityState === 'hidden'
    }
  }
}
