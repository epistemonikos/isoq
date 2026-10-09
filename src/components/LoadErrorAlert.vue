<template>
  <!-- Lo que no se pudo cargar de una vista con varias cargas. Una carga fallida se veía como
       otra cosa: una tabla vacía, un proyecto sin referencias, un exportable incompleto. -->
  <b-alert v-if="parts.length" show variant="warning" class="mt-3 d-print-none" data-test="load-error">
    {{ $t('project.load_error_parts', { parts: parts.map(part => $t('project.load_part.' + part)).join(', ') }) }}
    <span v-if="parts.includes('categories')"> {{ $t('project.load_error_numbering') }}</span>
    <b-button size="sm" variant="outline-warning" class="ml-2" data-test="load-error-retry" @click="$emit('retry')">
      {{ $t('common.retry') }}
    </b-button>
  </b-alert>
</template>

<script>
/**
 * El formato es el que aprobó el usuario para la tabla de findings: `b-alert` con Reintentar.
 * Sin grupos, la numeración de los findings cambia (la regla del «#» depende de las
 * categorías), así que eso se dice aparte.
 */
export default {
  name: 'LoadErrorAlert',
  props: {
    // Claves de `project.load_part.*` que no cargaron.
    parts: {
      type: Array,
      default: () => []
    }
  }
}
</script>
