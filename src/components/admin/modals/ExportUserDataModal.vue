<template>
  <b-modal
    ref="modal"
    :title="$t('admin.export_data_title')"
    ok-variant="primary"
    :ok-title="$t('admin.export_data')"
    cancel-variant="outline-secondary"
    :ok-disabled="!canSubmit || isLoading"
    @ok.prevent="confirm"
    @hidden="reset"
  >
    <!-- Para quien no puede entrar a descargar su copia (GDPR Art. 12.3). Comprobar que
         quien la pide es la titular (Art. 12.6) lo hace una persona antes: el servidor exige
         que se declare y la contraseña del admin. -->
    <p v-if="user">{{ $t('admin.export_data_intro', { name: fullName, email: user.username }) }}</p>
    <p class="small text-muted">{{ $t('admin.export_data_audit_note') }}</p>
    <b-form-checkbox v-model="identityVerified" class="mb-3">
      {{ $t('admin.export_data_identity_verified') }}
    </b-form-checkbox>
    <b-form-group :label="$t('admin.export_data_password')" label-for="admin-export-password">
      <b-form-input
        id="admin-export-password"
        v-model="password"
        type="password"
        autocomplete="current-password"
      />
    </b-form-group>
    <b-alert variant="danger" :show="!!error">{{ error }}</b-alert>
    <b-spinner v-if="isLoading" small />
  </b-modal>
</template>

<script>
import { downloadUserDataAsAdmin } from '@/services/personalDataExport'

export default {
  props: {
    user: { type: Object, default: null }
  },
  data () {
    return {
      identityVerified: false,
      password: '',
      isLoading: false,
      error: ''
    }
  },
  computed: {
    fullName () {
      if (!this.user) return ''
      return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username
    },
    canSubmit () {
      return this.identityVerified === true && !!this.password
    }
  },
  methods: {
    show () {
      this.reset()
      this.$refs.modal.show()
    },
    reset () {
      this.identityVerified = false
      this.password = ''
      this.isLoading = false
      this.error = ''
    },
    async confirm () {
      if (!this.canSubmit || this.isLoading) return
      this.isLoading = true
      this.error = ''
      try {
        await downloadUserDataAsAdmin(this.user.id, this.password)
        this.$emit('exported', this.user.id)
        this.$refs.modal.hide()
      } catch (err) {
        this.error = err.backendMessage || this.$t('admin.export_data_error')
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
