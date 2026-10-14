<template>
  <b-modal
    ref="modal"
    :title="$t('admin.force_logout_title')"
    ok-variant="warning"
    :ok-title="$t('admin.force_logout')"
    cancel-variant="outline-secondary"
    :ok-disabled="isLoading"
    @ok.prevent="confirm"
    @hidden="reset"
  >
    <p v-if="user">{{ $t('admin.force_logout_confirm', { name: fullName }) }}</p>
    <b-alert variant="success" :show="!!successMessage">{{ successMessage }}</b-alert>
    <b-alert variant="danger" :show="!!error">{{ error }}</b-alert>
    <b-spinner v-if="isLoading" small />
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  props: {
    user: { type: Object, default: null }
  },
  data () {
    return {
      isLoading: false,
      error: '',
      successMessage: ''
    }
  },
  computed: {
    fullName () {
      if (!this.user) return ''
      return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username
    }
  },
  methods: {
    show () {
      this.reset()
      this.$refs.modal.show()
    },
    reset () {
      this.isLoading = false
      this.error = ''
      this.successMessage = ''
    },
    async confirm () {
      this.isLoading = true
      this.error = ''
      this.successMessage = ''
      try {
        const response = await Api.delete(`/admin/users/${this.user.id}/sessions`)
        const count = response.data && response.data.tokens_deleted != null ? response.data.tokens_deleted : 0
        this.successMessage = this.$t('admin.force_logout_success', { count })
        this.$emit('logged-out', this.user.id)
        this.$refs.modal.hide()
      } catch (err) {
        const data = err.response && err.response.data
        const msg = (data && data.message || '').toLowerCase()
        if (msg.includes('own') || msg.includes('yourself')) {
          this.error = this.$t('admin.error_self_action')
        } else {
          this.error = this.$t('notifications.save_error')
        }
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>
