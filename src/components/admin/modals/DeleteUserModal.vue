<template>
  <b-modal
    ref="modal"
    :title="$t('admin.delete_title')"
    ok-variant="danger"
    :ok-title="$t('admin.delete')"
    cancel-variant="outline-secondary"
    :ok-disabled="isOkDisabled"
    size="lg"
    @ok.prevent="confirm"
    @show="loadProjects"
    @hidden="reset"
  >
    <div v-if="isLoading" class="text-center py-3">
      <b-spinner />
      <p class="mt-2 text-muted">{{ $t('admin.loading_projects') }}</p>
    </div>

    <template v-else>
      <p>{{ $t('admin.delete_confirm') }}</p>

      <div v-if="sharedProjects.length === 0">
        <b-alert variant="info" show>{{ $t('admin.no_shared_projects') }}</b-alert>
      </div>

      <div v-else>
        <b-alert variant="warning" show>
          <strong>{{ $t('admin.shared_projects_title') }}</strong>
          <br>{{ $t('admin.shared_projects_info') }}
        </b-alert>

        <div v-for="project in sharedProjects" :key="project.id" class="mb-3">
          <label>{{ $t('admin.transfer_owner_label', { project: project.name }) }}</label>
          <b-form-select
            v-model="transfers[project.id]"
            :options="ownerOptions(project)"
            :placeholder="$t('admin.select_owner')"
          >
            <template #first>
              <b-form-select-option :value="null" disabled>{{ $t('admin.select_owner') }}</b-form-select-option>
            </template>
          </b-form-select>
        </div>
      </div>

      <b-form-checkbox v-model="isViolation" class="mt-3">
        {{ $t('admin.delete_violation_label') }}
      </b-form-checkbox>
      <small class="form-text text-muted mb-3">{{ $t('admin.delete_violation_help') }}</small>

      <b-alert variant="danger" :show="!!error">{{ error }}</b-alert>
      <b-spinner v-if="isDeleting" small />
    </template>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'

export default {
  props: {
    user: { type: Object, default: null },
    allUsers: { type: Array, default: () => [] }
  },
  data () {
    return {
      isLoading: false,
      isDeleting: false,
      error: '',
      projects: [],
      transfers: {},
      isViolation: false
    }
  },
  computed: {
    sharedProjects () {
      return this.projects.filter(p => p.can_write.length > 0 || p.can_read.length > 0)
    },
    isOkDisabled () {
      if (this.isLoading || this.isDeleting) return true
      return this.sharedProjects.some(p => !this.transfers[p.id])
    }
  },
  methods: {
    show () {
      this.reset()
      this.$refs.modal.show()
    },
    reset () {
      this.isLoading = false
      this.isDeleting = false
      this.error = ''
      this.projects = []
      this.transfers = {}
      this.isViolation = false
    },
    async loadProjects () {
      if (!this.user) return
      this.isLoading = true
      this.error = ''
      try {
        const response = await Api.get(`/admin/users/${this.user.id}/projects`)
        this.projects = response.data || []
        const initial = {}
        this.sharedProjects.forEach(p => { initial[p.id] = null })
        this.transfers = initial
      } catch (err) {
        this.error = this.$t('admin.error_load_projects')
      } finally {
        this.isLoading = false
      }
    },
    ownerOptions (project) {
      const eligibleIds = [...new Set([...project.can_write, ...project.can_read])]
      return this.allUsers
        .filter(u => eligibleIds.includes(u.id))
        .map(u => ({
          value: u.id,
          text: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username
        }))
    },
    async confirm () {
      this.isDeleting = true
      this.error = ''
      const ownershipTransfers = {}
      this.sharedProjects.forEach(p => {
        if (this.transfers[p.id]) ownershipTransfers[p.id] = this.transfers[p.id]
      })
      // `reason: 'violation'` bloquea 90 días el re-registro con ese email. Sólo viaja
      // marcada: sin ella el cuerpo es el del borrado ordinario.
      const body = { ownership_transfers: ownershipTransfers }
      if (this.isViolation) body.reason = 'violation'
      try {
        await Api.delete(`/admin/users/${this.user.id}`, body)
        this.$emit('deleted', this.user.id)
        this.$refs.modal.hide()
      } catch (err) {
        const data = err.response && err.response.data
        if (data) {
          if (data.result === 'transfer_required') this.error = this.$t('admin.error_transfer_required')
          else if (data.result === 'invalid_transfer') this.error = this.$t('admin.error_invalid_transfer')
          else if (data.result === 'forbidden') this.error = this.$t('admin.error_self_action')
          else if (data.result === 'registration_block_unavailable') this.error = this.$t('admin.error_registration_block_unavailable')
          else this.error = this.$t('notifications.delete_error')
        } else {
          this.error = this.$t('notifications.delete_error')
        }
      } finally {
        this.isDeleting = false
      }
    }
  }
}
</script>
