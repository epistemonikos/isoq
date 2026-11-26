<template>
  <b-alert
    v-if="messageKey"
    show
    :variant="status === 'released_idle' ? 'info' : 'warning'"
    class="mb-3"
    role="status"
    data-testid="properties-lock-alert">
    <span>{{ $t(messageKey, { user: lockedBy }) }}</span>
    <b-button
      v-if="status === 'released_idle'"
      size="sm"
      variant="outline-primary"
      class="ml-2"
      data-testid="properties-lock-resume"
      @click="$emit('resume')">
      {{ $t('lock.properties_resume') }}
    </b-button>
  </b-alert>
</template>

<script>
import { propertiesLockMessageKey } from '@/utils/propertiesLock'

/** Cartel del lock de Propiedades. Presentacional: el estado lo lleva propertiesLockMixin. */
export default {
  name: 'PropertiesLockAlert',
  props: {
    status: { type: String, required: true },
    lockedBy: { type: String, default: null }
  },
  computed: {
    messageKey () {
      return propertiesLockMessageKey(this.status, this.lockedBy)
    }
  }
}
</script>
