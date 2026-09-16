<template>
  <b-alert
    v-if="visible"
    show
    variant="warning"
    class="inactivity-warning mb-3"
    role="alert"
    aria-live="assertive"
    data-testid="inactivity-warning"
  >
    <div class="d-flex align-items-center justify-content-between flex-wrap">
      <div class="mr-3">
        <font-awesome-icon icon="exclamation-triangle" class="mr-1" />
        <strong>{{ $t('lock.inactivity_title') }}</strong>
        <span class="ml-1">{{ $t('lock.inactivity_message', { countdown: countdownLabel }) }}</span>
      </div>
      <b-button
        size="sm"
        variant="warning"
        data-testid="inactivity-keep-working"
        @click="$emit('keep-working')"
      >
        {{ $t('lock.inactivity_keep_working') }}
      </b-button>
    </div>
  </b-alert>
</template>

<script>
/**
 * El aviso de que el editor está por cerrarse solo. Presentacional: los segundos los
 * cuenta el anfitrión (editorInactivityMixin) contra un plazo absoluto, acá sólo se
 * formatean.
 *
 * Es un banner y no un modal a propósito. Los modales apilados de bootstrap-vue se pelean
 * por el `overflow` del body y por la trampa de foco; un modal taparía justo el texto que
 * la persona vino a revisar; y sobre todo, un modal-dentro-de-modal no se podría reutilizar
 * en editores que no son modales, como las tablas del Paso 2.
 */
export default {
  name: 'InactivityWarning',
  props: {
    visible: { type: Boolean, default: false },
    secondsLeft: { type: Number, default: 0 }
  },
  computed: {
    countdownLabel () {
      const total = Math.max(0, Math.floor(this.secondsLeft))
      const seconds = String(total % 60).padStart(2, '0')
      return `${Math.floor(total / 60)}:${seconds}`
    }
  }
}
</script>

<style scoped>
/*
 * Pegado al tope del scroll: el cuerpo del editor del Paso 3 mide varias pantallas, y un
 * aviso puesto al principio se iría de la vista con el primer scroll — justo el caso en
 * que la persona vuelve, scrollea, y no entiende por qué se le cerró el modal. Sticky
 * funciona dentro de estos modales: es lo que ya hace `.sticky-menu` en
 * EditReferenceModal. El z-index queda sobre el contenido del modal (que no declara
 * ninguno) y por debajo de los tooltips de Bootstrap (1070).
 */
.inactivity-warning {
  position: sticky;
  top: 0;
  z-index: 1055;
}
</style>
