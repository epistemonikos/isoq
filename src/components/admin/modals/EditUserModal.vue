<template>
  <b-modal
    ref="modal"
    :title="$t('admin.edit_user_title')"
    :ok-title="$t('common.save')"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    :ok-disabled="isLoading"
    @ok.prevent="confirm"
    @show="initForm"
    @hidden="reset"
  >
    <b-form v-if="user">
      <b-form-group :label="$t('admin.field_first_name')">
        <b-form-input v-model="form.first_name" :disabled="isLoading" />
      </b-form-group>
      <b-form-group :label="$t('admin.field_last_name')">
        <b-form-input v-model="form.last_name" :disabled="isLoading" />
      </b-form-group>
      <b-form-group :label="$t('admin.field_email')">
        <b-form-input v-model="form.username" type="email" :disabled="isLoading" />
      </b-form-group>
    </b-form>
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
      form: { first_name: '', last_name: '', username: '' },
      original: {}
    }
  },
  methods: {
    show () {
      this.$refs.modal.show()
    },
    initForm () {
      if (!this.user) return
      this.form = {
        first_name: this.user.first_name || '',
        last_name: this.user.last_name || '',
        username: this.user.username || ''
      }
      this.original = { ...this.form }
      this.error = ''
    },
    reset () {
      this.isLoading = false
      this.error = ''
    },
    buildPayload () {
      const payload = {}
      if (this.form.first_name !== this.original.first_name) payload.first_name = this.form.first_name
      if (this.form.last_name !== this.original.last_name) payload.last_name = this.form.last_name
      if (this.form.username !== this.original.username) payload.username = this.form.username
      return payload
    },
    async confirm () {
      const payload = this.buildPayload()
      if (Object.keys(payload).length === 0) {
        this.error = this.$t('admin.error_no_changes')
        return
      }
      this.isLoading = true
      this.error = ''
      try {
        await Api.patch(`/admin/users/${this.user.id}`, payload)
        this.$emit('updated', this.user.id, payload)
        this.$refs.modal.hide()
      } catch (err) {
        const data = err.response && err.response.data
        const result = data && data.result
        if (result === 'username_taken') {
          this.error = this.$t('admin.error_username_taken')
        } else if (result === 'no_changes') {
          this.error = this.$t('admin.error_no_changes')
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
