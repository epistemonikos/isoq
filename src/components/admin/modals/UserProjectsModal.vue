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
    </b-table>
  </b-modal>
</template>

<script>
import Api from '@/utils/Api'
import { formatServerDate } from '@/utils/serverDate'

// Proyectos de un usuario —propios y donde colabora— para el panel. Sólo lectura: un admin no
// es miembro de esos proyectos, así que no se enlazan.
export default {
  props: {
    user: { type: Object, default: null }
  },
  data () {
    return {
      isLoading: false,
      error: '',
      projects: []
    }
  },
  computed: {
    fullName () {
      if (!this.user) return ''
      return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ') || this.user.username
    },
    fields () {
      return [
        { key: 'name', label: this.$t('admin.col_project_name'), sortable: true },
        { key: 'role', label: this.$t('admin.col_project_role'), sortable: true },
        { key: 'is_public', label: this.$t('admin.col_project_status'), sortable: true },
        { key: 'created_at', label: this.$t('admin.col_created_at'), sortable: true, formatter: formatServerDate },
        { key: 'last_update', label: this.$t('admin.col_project_last_update'), sortable: true, formatter: this.formatEpochMs },
        { key: 'published_at', label: this.$t('admin.col_project_published_at'), sortable: true, formatter: formatServerDate }
      ]
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
      try {
        const response = await Api.get(`/admin/users/${this.user.id}/projects`, { scope: 'all' })
        this.projects = response.data || []
      } catch (err) {
        this.error = this.$t('admin.error_load_projects')
      } finally {
        this.isLoading = false
      }
    },
    // `last_update` lo sella el servidor en milisegundos epoch, no como fecha.
    formatEpochMs (value) {
      return value ? new Date(value).toLocaleString() : ''
    }
  }
}
</script>
