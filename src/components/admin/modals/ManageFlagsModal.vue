<template>
  <b-modal
    ref="modal"
    :title="$t('admin.manage_flags_title', { name: fullName })"
    :ok-title="$t('common.save')"
    ok-variant="primary"
    cancel-variant="outline-secondary"
    :ok-disabled="isLoading"
    @ok.prevent="confirm"
    @show="initFlags"
    @hidden="reset"
  >
    <div v-if="user">
      <b-form-checkbox
        v-model="flags.support"
        class="mb-2"
        :disabled="isLoading"
      >
        {{ $t('admin.flag_support') }}
      </b-form-checkbox>
      <b-form-checkbox
        v-model="flags.superadmin"
        class="mb-2"
        :disabled="isLoading || isSelf"
      >
        {{ $t('admin.flag_superadmin') }}
      </b-form-checkbox>
      <b-form-checkbox
        v-model="flags.business_manager"
        class="mb-2"
        :disabled="isLoading"
      >
        {{ $t('admin.flag_business_manager') }}
      </b-form-checkbox>
    </div>
    <b-alert variant="danger" :show="!!error">{{ error }}</b-alert>
    <b-spinner v-if="isLoading" small />
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  props: {
    user: { type: Object, default: null },
    currentUserId: { type: String, default: null }
  },
  data () {
    return {
      isLoading: false,
      error: '',
      flags: { support: false, superadmin: false, business_manager: false },
      original: {}
    }
  },
  computed: {
    fullName () {
      if (!this.user) return ''
      return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username
    },
    isSelf () {
      return this.user && this.currentUserId && this.user.id === this.currentUserId
    }
  },
  methods: {
    show () {
      this.$refs.modal.show()
    },
    initFlags () {
      if (!this.user) return
      this.flags = {
        support: !!this.user.support,
        superadmin: !!this.user.superadmin,
        business_manager: !!this.user.business_manager
      }
      this.original = { ...this.flags }
      this.error = ''
    },
    reset () {
      this.isLoading = false
      this.error = ''
    },
    buildPayload () {
      const payload = {}
      const keys = ['support', 'superadmin', 'business_manager']
      keys.forEach(k => {
        if (this.flags[k] !== this.original[k]) payload[k] = this.flags[k]
      })
      return payload
    },
    async confirm () {
      const payload = this.buildPayload()
      if (Object.keys(payload).length === 0) {
        this.$refs.modal.hide()
        return
      }
      this.isLoading = true
      this.error = ''
      try {
        await Api.patch(`/admin/users/${this.user.id}/flags`, payload)
        this.$emit('flags-updated', this.user.id, { ...this.flags })
        this.$refs.modal.hide()
      } catch (err) {
        const data = err.response && err.response.data
        if (data && data.message && data.message.toLowerCase().includes('own')) {
          this.error = this.$t('admin.error_self_action')
        } else if (err.response && err.response.status === 403) {
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
