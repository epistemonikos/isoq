<template>
  <b-modal
    ref="modal"
    :title="$t('admin.reactivate_title')"
    :ok-title="$t('admin.reactivate')"
    ok-variant="success"
    cancel-variant="outline-secondary"
    :ok-disabled="isLoading"
    @ok.prevent="confirm"
    @hidden="reset"
  >
    <p v-if="user">{{ $t('admin.reactivate_confirm', { name: fullName }) }}</p>
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
      error: ''
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
    },
    async confirm () {
      this.isLoading = true
      this.error = ''
      try {
        await Api.patch(`/admin/users/${this.user.id}/activate`)
        this.$emit('activated', this.user.id)
        this.$refs.modal.hide()
      } catch (err) {
        const data = err.response && err.response.data
        if (data && data.message && data.message.toLowerCase().includes('own')) {
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
