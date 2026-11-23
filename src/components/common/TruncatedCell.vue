<template>
  <div v-if="!long">{{ value }}</div>
  <div v-else-if="!expanded">
    <!-- En papel no hay clic (#416): la pantalla ve el resumen y «read more»; el PDF, todo. -->
    <div class="d-print-none">
      {{ summary }}...
      <p class="mb-0">
        <b-link style="font-size: 12px;" @click="expanded = true">{{ $t('common.read_more') }}</b-link>
      </p>
    </div>
    <div class="d-none d-print-block">{{ value }}</div>
  </div>
  <div v-else>
    {{ value }}
    <p class="mb-0 d-print-none">
      <b-link style="font-size: 12px;" @click="expanded = false">{{ $t('common.read_less') }}</b-link>
    </p>
  </div>
</template>

<script>
import Commons from '@/utils/commons'

/**
 * Una celda de tabla larga que se resume en pantalla y se imprime entera. Una sola regla
 * para todas las tablas que se imprimen (antes eran cuatro copias del mismo bloque, y el
 * PDF salía con «… read more» y el texto cortado).
 */
export default {
  name: 'TruncatedCell',
  props: {
    text: { type: [String, Number], default: '' }
  },
  data () {
    return { expanded: false }
  },
  computed: {
    value () {
      return this.text === null || this.text === undefined ? '' : String(this.text)
    },
    long () {
      return Commons.shouldTruncate(this.value)
    },
    summary () {
      return Commons.truncate(this.value)
    }
  }
}
</script>
