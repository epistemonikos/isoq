<template>
  <b-modal
    ref="modal"
    :title="$t('admin.user_projects_title', { name: fullName })"
    size="xl"
    ok-only
    ok-variant="outline-secondary"
    :ok-title="$t('common.close')"
  >
    <div v-if="isLoading" class="text-center py-3">
      <b-spinner />
    </div>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <p v-else-if="projects.length === 0" class="text-muted">{{ $t('admin.user_projects_empty') }}</p>
    <b-alert v-if="unpublishMessage" variant="success" show dismissible @dismissed="unpublishMessage = ''">
      {{ unpublishMessage }}
      <template v-if="sharedLinkRevoked">{{ $t('admin.unpublish_shared_link_revoked') }}</template>
    </b-alert>
    <b-alert v-if="ownerNotNotified" variant="warning" show>{{ $t('admin.unpublish_owner_not_notified') }}</b-alert>
    <b-alert v-if="unpublishError" variant="danger" show>{{ unpublishError }}</b-alert>
    <div v-if="pendingProject" class="border rounded p-3 mb-3" data-test="unpublish-panel">
      <p class="mb-2">{{ $t('admin.unpublish_confirm', { name: pendingProject.name }) }}</p>
      <p class="small text-muted mb-1">{{ $t('admin.unpublish_owner_notice_note') }}</p>
      <p class="small text-muted mb-2">{{ $t('admin.unpublish_audit_note') }}</p>
      <b-form-group :label="$t('admin.unpublish_reason_label')" label-for="unpublish-reason" class="mb-2">
        <b-form-select
          id="unpublish-reason"
          v-model="unpublishReason"
          :options="reasonOptions"
          :disabled="isUnpublishing"
          data-test="unpublish-reason"
        />
      </b-form-group>
      <p v-if="unpublishReason === 'personal_data'" class="small text-danger mb-2">
        {{ $t('admin.unpublish_shared_link_note') }}
      </p>
      <b-button
        variant="danger"
        size="sm"
        :disabled="!unpublishReason || isUnpublishing"
        data-test="unpublish-confirm"
        @click="confirmUnpublish"
      >
        <b-spinner v-if="isUnpublishing" small class="mr-1" />
        {{ $t('admin.unpublish') }}
      </b-button>
      <b-button
        variant="outline-secondary"
        size="sm"
        class="ml-2"
        :disabled="isUnpublishing"
        data-test="unpublish-cancel"
        @click="cancelUnpublish"
      >
        {{ $t('common.cancel') }}
      </b-button>
    </div>
    <b-table
      v-else
      :items="projects"
      :fields="fields"
      small
      striped
      responsive
    >
      <template #cell(role)="{ value }">
        <b-badge :variant="value === 'owner' ? 'primary' : 'secondary'">
          {{ $t('admin.project_role_' + value) }}
        </b-badge>
      </template>
      <template #cell(is_public)="{ value }">
        <b-badge :variant="value ? 'success' : 'light'">
          {{ value ? $t('admin.project_published') : $t('admin.project_private') }}
        </b-badge>
      </template>
      <template #cell(actions)="{ item }">
        <b-button
          v-if="item.is_public"
          variant="outline-danger"
          size="sm"
          :disabled="isUnpublishing"
          :data-test="'unpublish-' + item.id"
          @click="startUnpublish(item)"
        >
          {{ $t('admin.unpublish') }}
        </b-button>
      </template>
    </b-table>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import { formatServerDate } from '@/utils/serverDate'
import { writeErrorMessageKey } from '@/utils/writeErrors'

// Proyectos de un usuario —propios y donde colabora— para el panel. Un admin no es miembro de
// esos proyectos, así que no se enlazan. La única escritura es despublicar, sólo superadmin: el
// servidor exige un motivo de esta lista cerrada (sin texto libre, porque va a la auditoría) y
// lo registra a nombre de la persona dueña.
const UNPUBLISH_REASONS = ['personal_data', 'not_publishable', 'owner_request', 'other']
export default {
  props: {
    user: { type: Object, default: null }
  },
  data () {
    return {
      isLoading: false,
      error: '',
      projects: [],
      pendingProject: null,
      unpublishReason: '',
      isUnpublishing: false,
      unpublishError: '',
      unpublishMessage: '',
      ownerNotNotified: false,
      sharedLinkRevoked: false
    }
  },
  computed: {
    fullName () {
      if (!this.user) return ''
      return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username
    },
    canUnpublish () {
      const user = this.$store && this.$store.state && this.$store.state.user
      return !!(user && user.superadmin)
    },
    reasonOptions () {
      return [
        { value: '', text: this.$t('admin.unpublish_reason_placeholder'), disabled: true },
        ...UNPUBLISH_REASONS.map(reason => ({ value: reason, text: this.$t('admin.unpublish_reason_' + reason) }))
      ]
    },
    fields () {
      const fields = [
        { key: 'name', label: this.$t('admin.col_project_name'), sortable: true },
        { key: 'role', label: this.$t('admin.col_project_role'), sortable: true },
        { key: 'is_public', label: this.$t('admin.col_project_status'), sortable: true },
        { key: 'created_at', label: this.$t('admin.col_created_at'), sortable: true, formatter: formatServerDate },
        { key: 'last_update', label: this.$t('admin.col_project_last_update'), sortable: true, formatter: this.formatEpochMs },
        { key: 'published_at', label: this.$t('admin.col_project_published_at'), sortable: true, formatter: formatServerDate }
      ]
      if (this.canUnpublish) fields.push({ key: 'actions', label: '' })
      return fields
    }
  },
  methods: {
    show () {
      this.$refs.modal.show()
      this.load()
    },
    async load () {
      if (!this.user) return
      this.isLoading = true
      this.error = ''
      this.projects = []
      this.cancelUnpublish()
      this.unpublishMessage = ''
      this.ownerNotNotified = false
      this.sharedLinkRevoked = false
      try {
        const response = await Api.get(`/admin/users/${this.user.id}/projects`, { scope: 'all' })
        this.projects = response.data || []
      } catch (err) {
        this.error = this.$t('admin.error_load_projects')
      } finally {
        this.isLoading = false
      }
    },
    startUnpublish (project) {
      this.pendingProject = project
      this.unpublishReason = ''
      this.unpublishError = ''
      this.unpublishMessage = ''
      this.ownerNotNotified = false
      this.sharedLinkRevoked = false
    },
    cancelUnpublish () {
      this.pendingProject = null
      this.unpublishReason = ''
      this.unpublishError = ''
    },
    markPrivate (project) {
      project.is_public = false
      project.published_at = null
    },
    async confirmUnpublish () {
      const project = this.pendingProject
      if (!project || !this.unpublishReason || this.isUnpublishing) return
      this.isUnpublishing = true
      this.unpublishError = ''
      try {
        const response = await Api.post(`/admin/projects/${project.id}/unpublish`, { reason: this.unpublishReason })
        const data = (response && response.data) || {}
        this.markPrivate(project)
        this.unpublishMessage = this.$t('admin.unpublish_success', { name: project.name })
        // El despublicado se mantiene aunque el correo falle; la persona dueña no se enteraría
        // por otra vía, así que quien lo hizo tiene que saberlo.
        this.ownerNotNotified = data.owner_notified === false
        this.sharedLinkRevoked = data.shared_link_revoked === true
        this.cancelUnpublish()
      } catch (err) {
        const data = err && err.response && err.response.data
        if (data && data.result === 'not_published') {
          // Otra persona lo despublicó mientras el modal estaba abierto: el estado pedido ya es el real.
          this.markPrivate(project)
          this.cancelUnpublish()
          this.unpublishError = this.$t('admin.unpublish_already_private', { name: project.name })
        } else {
          const key = writeErrorMessageKey(err)
          if (key) this.unpublishError = this.$t(key)
        }
      } finally {
        this.isUnpublishing = false
      }
    },
    // `last_update` lo sella el servidor en milisegundos epoch, no como fecha.
    formatEpochMs (value) {
      return value ? new Date(value).toLocaleString() : ''
    }
  }
}
</script>
