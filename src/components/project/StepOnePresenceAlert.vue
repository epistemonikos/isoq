<template>
  <b-alert v-if="others.length" show variant="warning" class="d-print-none"
    data-testid="step-one-presence">
    {{ $t('presence.step_one_others') }}
  </b-alert>
</template>

<script>
import { othersOnStepOne } from '@/utils/stepOnePresence'

// #399: someone else who can edit has Step 1 open. A state of this screen, so a
// b-alert; it goes away by itself when they leave (presence expires or is removed).
export default {
  name: 'StepOnePresenceAlert',
  props: {
    presence: { type: Array, default: () => [] },
    currentUserId: { type: [String, Number], default: null }
  },
  computed: {
    others () {
      return othersOnStepOne(this.presence, this.currentUserId)
    }
  }
}
</script>
