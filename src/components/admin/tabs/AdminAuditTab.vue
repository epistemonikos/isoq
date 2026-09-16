<template>
  <div>
    <b-row class="mb-3 align-items-end">
      <b-col md="3">
        <label class="small text-muted mb-1">{{ $t('admin.audit_filter_action') }}</label>
        <b-form-select
          v-model="filterAction"
          :options="actionOptions"
          size="sm"
          @change="onFilterChange"
        />
      </b-col>
      <b-col md="3">
        <label class="small text-muted mb-1">{{ $t('admin.audit_col_actor') }}</label>
        <b-form-input
          v-model="filterActor"
          size="sm"
          debounce="400"
          @update="onFilterChange"
        />
      </b-col>
      <b-col md="3">
        <label class="small text-muted mb-1">{{ $t('admin.audit_col_target') }}</label>
        <b-form-input
          v-model="filterTarget"
          size="sm"
          debounce="400"
          @update="onFilterChange"
        />
      </b-col>
      <b-col md="3" class="d-flex align-items-end justify-content-end">
        <label class="mb-0 mr-2 text-nowrap small">{{ $t('admin.per_page') }}</label>
        <b-form-select
          v-model="perPage"
          :options="perPageOptions"
          size="sm"
          style="width: auto"
          @change="onPerPageChange"
        />
      </b-col>
    </b-row>

    <b-alert variant="danger" :show="!!loadError">{{ loadError }}</b-alert>

    <b-table
      :items="events"
      :fields="fields"
      :busy="isBusy"
      responsive
      striped
      hover
      show-empty
      :empty-text="$t('admin.audit_no_events')"
    >
      <template #table-busy>
        <div class="text-center my-3">
          <b-spinner />
        </div>
      </template>

      <template #cell(timestamp)="{ value }">
        {{ formatDate(value) }}
      </template>

      <template #cell(action)="{ value }">
        <b-badge :variant="actionVariant(value)">
          {{ actionLabel(value) }}
        </b-badge>
      </template>

      <template #cell(details)="{ value }">
        <small class="text-muted">{{ formatDetails(value) }}</small>
      </template>
    </b-table>

    <b-row class="align-items-center mt-2">
      <b-col class="text-muted small">
        {{ pageInfo }}
      </b-col>
      <b-col>
        <b-pagination
          :value="currentPage"
          :total-rows="total"
          :per-page="perPage"
          :disabled="isBusy"
          align="right"
          class="mb-0"
          @change="goToPage"
        />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import Api from '@/utils/Api'

const ACTION_KEYS = [
  'forced_login',
  'admin_delete_user',
  'activate_user',
  'deactivate_user',
  'update_user',
  'update_flags',
  'force_logout'
]

const ACTION_VARIANTS = {
  forced_login: 'info',
  admin_delete_user: 'danger',
  activate_user: 'success',
  deactivate_user: 'warning',
  update_user: 'secondary',
  update_flags: 'primary',
  force_logout: 'warning'
}

export default {
  data () {
    return {
      events: [],
      total: 0,
      isBusy: false,
      loadError: '',
      currentPage: 1,
      perPage: 50,
      perPageOptions: [10, 25, 50, 100],
      filterAction: '',
      filterActor: '',
      filterTarget: ''
    }
  },
  computed: {
    fields () {
      return [
        { key: 'timestamp', label: this.$t('admin.audit_col_timestamp') },
        { key: 'action', label: this.$t('admin.audit_col_action') },
        { key: 'actor_username', label: this.$t('admin.audit_col_actor') },
        { key: 'target_username', label: this.$t('admin.audit_col_target') },
        { key: 'ip', label: this.$t('admin.audit_col_ip') },
        { key: 'details', label: this.$t('admin.audit_col_details') }
      ]
    },
    actionOptions () {
      const all = [{ value: '', text: this.$t('admin.audit_filter_all_actions') }]
      const specific = ACTION_KEYS.map(k => ({
        value: k,
        text: this.$t(`admin.action_${k}`)
      }))
      return [...all, ...specific]
    },
    pageInfo () {
      if (this.total === 0) return ''
      const from = (this.currentPage - 1) * this.perPage + 1
      const to = Math.min(from + this.events.length - 1, this.total)
      return this.$t('admin.page_info', { from, to, total: this.total })
    }
  },
  created () {
    this.loadEvents(1)
  },
  methods: {
    async loadEvents (page) {
      this.isBusy = true
      this.loadError = ''
      const offset = (page - 1) * this.perPage
      const params = { _limit: this.perPage, _offset: offset }
      if (this.filterAction) params.action = this.filterAction
      if (this.filterActor.trim()) params.actor_id = this.filterActor.trim()
      if (this.filterTarget.trim()) params.target_id = this.filterTarget.trim()
      try {
        const response = await Api.get('/admin/audit', params)
        const { events, total } = response.data
        this.events = events || []
        this.total = total || 0
        this.currentPage = page
      } catch (err) {
        this.loadError = this.$t('admin.audit_load_error')
      } finally {
        this.isBusy = false
      }
    },
    goToPage (page) {
      this.loadEvents(page)
    },
    onPerPageChange () {
      this.loadEvents(1)
    },
    onFilterChange () {
      this.loadEvents(1)
    },
    formatDate (timestamp) {
      if (!timestamp) return ''
      return new Date(timestamp).toLocaleString()
    },
    actionLabel (action) {
      const key = `admin.action_${action}`
      const translated = this.$t(key)
      return translated !== key ? translated : action
    },
    actionVariant (action) {
      return ACTION_VARIANTS[action] || 'secondary'
    },
    formatDetails (details) {
      if (!details || typeof details !== 'object') return ''
      if (details.fields) return details.fields.join(', ')
      if (details.tokens_deleted != null) return `${details.tokens_deleted} token(s)`
      if (details.before || details.after) {
        const keys = Object.keys(details.after || {})
        return keys.map(k => `${k}: ${(details.before || {})[k]} → ${(details.after || {})[k]}`).join(', ')
      }
      return JSON.stringify(details)
    }
  }
}
</script>
