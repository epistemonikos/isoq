<template>
  <div>
    <!-- Selector de rango -->
    <b-row class="mb-2 align-items-end">
      <b-col md="auto">
        <label class="small text-muted mb-1 d-block">{{ $t('admin.stat_date_range') }}</label>
        <b-form-select
          v-model="selectedRange"
          :options="rangeOptions"
          size="sm"
          :disabled="isBusy"
          @change="onRangeChange"
        />
      </b-col>
      <template v-if="selectedRange === 'custom'">
        <b-col md="auto">
          <label class="small text-muted mb-1 d-block">{{ $t('admin.stat_range_from') }}</label>
          <b-form-input v-model="customFrom" type="date" size="sm" :disabled="isBusy" />
        </b-col>
        <b-col md="auto">
          <label class="small text-muted mb-1 d-block">{{ $t('admin.stat_range_to') }}</label>
          <b-form-input v-model="customTo" type="date" size="sm" :disabled="isBusy" />
        </b-col>
        <b-col md="auto" class="d-flex align-items-end">
          <b-button size="sm" variant="outline-primary" :disabled="isBusy" @click="loadStats()">
            {{ $t('admin.stat_apply') }}
          </b-button>
        </b-col>
      </template>
    </b-row>

    <p v-if="activeRange" class="text-muted small mb-3">
      {{ $t('admin.stat_active_range', { from: formatDate(activeRange.from), to: formatDate(activeRange.to) }) }}
    </p>

    <b-alert variant="danger" :show="!!loadError">{{ loadError }}</b-alert>

    <div v-if="isBusy" class="text-center my-5">
      <b-spinner />
    </div>

    <div v-if="stats">
      <!-- Usuarios — métricas históricas -->
      <h6 class="text-muted text-uppercase mb-3">{{ $t('admin.stat_section_users') }}</h6>
      <b-row class="mb-3">
        <b-col v-for="card in userHistoricalCards" :key="card.key" md="3" sm="6" class="mb-3">
          <b-card class="text-center h-100">
            <div class="display-4 font-weight-bold">{{ stats.users[card.key] }}</div>
            <div class="text-muted small mt-1">{{ $t(card.label) }}</div>
          </b-card>
        </b-col>
      </b-row>

      <!-- Usuarios — métricas del período -->
      <h6 class="text-muted text-uppercase mb-3">
        {{ $t('admin.stat_section_users') }} — {{ $t('admin.stat_section_in_range') }}
      </h6>
      <b-row class="mb-4">
        <b-col v-for="card in userPeriodCards" :key="card.key" md="3" sm="6" class="mb-3">
          <b-card class="text-center h-100 border-primary">
            <div class="display-4 font-weight-bold text-primary">{{ stats.users[card.key] }}</div>
            <div class="text-muted small mt-1">{{ $t(card.label) }}</div>
          </b-card>
        </b-col>
      </b-row>

      <!-- Proyectos — métricas históricas -->
      <h6 class="text-muted text-uppercase mb-3">{{ $t('admin.stat_section_projects') }}</h6>
      <b-row class="mb-3">
        <b-col v-for="card in projectHistoricalCards" :key="card.key" md="3" sm="6" class="mb-3">
          <b-card class="text-center h-100">
            <div class="display-4 font-weight-bold">{{ stats.projects[card.key] }}</div>
            <div class="text-muted small mt-1">{{ $t(card.label) }}</div>
          </b-card>
        </b-col>
      </b-row>

      <!-- Proyectos — métricas del período -->
      <h6 class="text-muted text-uppercase mb-3">
        {{ $t('admin.stat_section_projects') }} — {{ $t('admin.stat_section_in_range') }}
      </h6>
      <b-row>
        <b-col v-for="card in projectPeriodCards" :key="card.key" md="3" sm="6" class="mb-3">
          <b-card class="text-center h-100 border-primary">
            <div class="display-4 font-weight-bold text-primary">{{ stats.projects[card.key] }}</div>
            <div class="text-muted small mt-1">{{ $t(card.label) }}</div>
          </b-card>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import Api from '@/utils/Api'

export default {
  data () {
    return {
      stats: null,
      activeRange: null,
      isBusy: false,
      loadError: '',
      selectedRange: 'last30',
      customFrom: '',
      customTo: '',
      userHistoricalCards: [
        { key: 'total', label: 'admin.stat_total_users' },
        { key: 'active', label: 'admin.stat_active_users' },
        { key: 'inactive', label: 'admin.stat_inactive_users' },
        { key: 'email_verified', label: 'admin.stat_email_verified' }
      ],
      userPeriodCards: [
        { key: 'new_in_range', label: 'admin.stat_new_in_range' },
        { key: 'logged_in_range', label: 'admin.stat_login_in_range' }
      ],
      projectHistoricalCards: [
        { key: 'total', label: 'admin.stat_total_projects' },
        { key: 'published', label: 'admin.stat_published' }
      ],
      projectPeriodCards: [
        { key: 'new_in_range', label: 'admin.stat_projects_new_in_range' },
        { key: 'published_in_range', label: 'admin.stat_projects_published_in_range' }
      ]
    }
  },
  computed: {
    rangeOptions () {
      return [
        { value: 'last7', text: this.$t('admin.range_last7') },
        { value: 'last30', text: this.$t('admin.range_last30') },
        { value: 'this_month', text: this.$t('admin.range_this_month') },
        { value: 'prev_month', text: this.$t('admin.range_prev_month') },
        { value: 'custom', text: this.$t('admin.range_custom') }
      ]
    }
  },
  created () {
    this.loadStats()
  },
  methods: {
    buildParams () {
      const today = new Date()
      const fmt = d => d.toISOString().split('T')[0]

      if (this.selectedRange === 'last7') {
        const from = new Date(today)
        from.setDate(from.getDate() - 6)
        return { from: fmt(from), to: fmt(today) }
      }
      if (this.selectedRange === 'last30') {
        const from = new Date(today)
        from.setDate(from.getDate() - 29)
        return { from: fmt(from), to: fmt(today) }
      }
      if (this.selectedRange === 'this_month') {
        const from = new Date(today.getFullYear(), today.getMonth(), 1)
        return { from: fmt(from), to: fmt(today) }
      }
      if (this.selectedRange === 'prev_month') {
        const from = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const to = new Date(today.getFullYear(), today.getMonth(), 0)
        return { from: fmt(from), to: fmt(to) }
      }
      // custom
      const params = {}
      if (this.customFrom) params.from = this.customFrom
      if (this.customTo) params.to = this.customTo
      return params
    },
    onRangeChange () {
      if (this.selectedRange !== 'custom') {
        this.loadStats()
      }
    },
    formatDate (isoString) {
      return new Date(isoString).toLocaleDateString()
    },
    async loadStats () {
      this.isBusy = true
      this.loadError = ''
      const params = this.buildParams()
      try {
        const response = await Api.get('/admin/stats', params)
        this.stats = response.data
        this.activeRange = response.data.range || null
      } catch (err) {
        const data = err.response && err.response.data
        if (data && data.result === 'invalid_params') {
          this.loadError = this.$t('admin.error_invalid_date')
        } else {
          this.loadError = this.$t('admin.stats_load_error')
        }
      } finally {
        this.isBusy = false
      }
    }
  }
}
</script>
