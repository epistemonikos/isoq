<template>
  <b-modal
    id="modal-ref-lock-conflict"
    ref="modal-ref-lock-conflict"
    :title="$t('lock.ref_conflict_title')"
    ok-only
    :ok-title="$t('lock.ref_conflict_close')"
    @ok="onClose"
    @hidden="onClose"
  >
    <p>{{ $t(conflictMessageKey, { user: lockedBy }) }}</p>
    <div v-for="(value, key) in conflictFields" :key="key" class="mb-3">
      <div class="d-flex justify-content-between align-items-center mb-1">
        <strong class="text-muted small text-uppercase">{{ key }}</strong>
        <b-button size="sm" variant="outline-secondary" @click="copyToClipboard(value)">
          <font-awesome-icon icon="copy" class="mr-1" />
          {{ $t('lock.ref_conflict_copy_field') }}
        </b-button>
      </div>
      <b-form-textarea :value="value" readonly rows="2" class="bg-light" />
    </div>
  </b-modal>
</template>

<script>
import { ITEM_METADATA_KEYS } from '@/utils/itemMetadata'

// Lo que no es texto que el usuario escribió y por tanto no tiene sentido ofrecerle para
// copiar: los identificadores de la fila, más lo que el servidor guarda dentro de ella.
const SYSTEM_KEYS = new Set(['ref_id', 'authors', '_id', 'id', ...ITEM_METADATA_KEYS])

export default {
  name: 'RefLockConflictModal',
  props: {
    lockedBy: { type: String, default: '' },
    failedData: { type: Object, default: () => ({}) },
    refId: { type: String, default: '' },
    // 'live' = the write failed just now; 'replay' = the offline queue tried it later.
    source: { type: String, default: 'live' }
  },
  computed: {
    // Same lost payload, opposite stories. Announcing "while you were offline" to
    // somebody who never lost connection sends them debugging the wrong thing.
    conflictMessageKey () {
      return this.source === 'replay'
        ? 'lock.ref_conflict_message'
        : 'lock.ref_conflict_message_live'
    },
    conflictFields () {
      return Object.fromEntries(
        Object.entries(this.failedData || {}).filter(([k]) => !SYSTEM_KEYS.has(k))
      )
    }
  },
  methods: {
    show () {
      this.$bvModal.show('modal-ref-lock-conflict')
    },
    onClose () {
      localStorage.removeItem(`conflict_ref_${this.refId}`)
      this.$emit('closed')
    },
    copyToClipboard (text) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text || '')
      }
    }
  }
}
</script>
