<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>{{ $t('browse.title') }}</h2>
      </div>
    </b-container>
    <b-container fluid>
      <i18n path="browse.desc" tag="p">
        <a href="https://implementationscience.biomedcentral.com/articles/supplements/volume-13-supplement-1" target="_blank" place="0">{{ $t('browse.guidance') }}</a>
      </i18n>
    </b-container>
    <div class="container-fluid">
      <b-row
        class="my-4">
        <b-col
          cols="12"
          sm="9">
          <b-form-group
            :label="$t('browse.search')"
            label-for="filterSearch">
            <b-form-input
              id="filterSearch"
              type="text"
              placeholder="...."
              v-model="table_settings.filter"></b-form-input>
          </b-form-group>
        </b-col>
        <b-col
          cols="12"
          sm="3">
          <b-form-group
            :label="$t('browse.tables_per_page')"
            label-for="select-tablesperpages">
            <b-form-select
              id="select-tablesperpages"
              :options="table_settings.per_page_array"
              v-model="table_settings.per_page"></b-form-select>
          </b-form-group>
        </b-col>
      </b-row>
      <!-- Antes, si fallaba la carga, `isBusy` no se apagaba y el spinner giraba para siempre. -->
      <b-alert v-if="loadError" show variant="warning" data-test="browse-load-error">
        {{ $t('browse.load_error') }}
        <b-button size="sm" variant="outline-warning" class="ml-2" data-test="browse-load-retry" @click="getPublicTables">
          {{ $t('common.retry') }}
        </b-button>
      </b-alert>
      <b-table
        striped
        bordered
        head-variant="light"
        :fields="table_settings.fields"
        :items="public_tables"
        :per-page="table_settings.per_page"
        :current-page="table_settings.current_page"
        :filter="table_settings.filter"
        :sort-by.sync="table_settings.sortBy"
        :sort-desc.sync="table_settings.sortDesc"
        :sort-compare="sortCompare"
        :busy="table_settings.isBusy">
        <template v-slot:cell(name)="data">
          <b-link :to="{ name: 'previewContentSoQf', params: { org_id: data.item.organization, isoqf_id: data.item.id, token: 'public' }}">
            {{data.item.name}}
            <img v-if="data.item.use_camelot" :src="camelotLogo" class="ml-2" width="16" height="16"
              style="vertical-align: text-bottom;" v-b-tooltip.hover="$t('project.uses_camelot')"
              data-test="browse-camelot-badge" />
          </b-link>
        </template>
        <template v-slot:cell(published_at)="data">
          <span data-test="browse-published-at">{{ formatPublishedAt(data.item.published_at) }}</span>
        </template>
        <!-- spinner -->
        <div slot="table-busy" class="text-center text-primary my-2">
          <b-spinner type="grow" variant="primary" class="align-middle"></b-spinner>
          <strong>{{ $t('browse.loading') }}</strong>
        </div>
        <!-- spinner -->
      </b-table>

      <b-pagination
      v-if="public_tables.length > table_settings.per_page"
      v-model="table_settings.current_page"
      :total-rows="public_tables.length"
      :per-page="table_settings.per_page"></b-pagination>
    </div>

  </div>
</template>

<script>
import Api from '@/utils/Api'

const DATE_OPTIONS = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }

// `published_at` arrives as a naive UTC `isoformat()` (no offset); `new Date` would read it
// as local time. Returns epoch ms, or null when absent or unreadable.
function publishedTime (value) {
  if (typeof value !== 'string' || !value) return null
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value)
  const time = Date.parse(hasZone ? value : value + 'Z')
  return Number.isNaN(time) ? null : time
}

export default {
  data () {
    return {
      loadError: false,
      camelotLogo: require('@/assets/camelot-logo.svg'),
      public_tables: [],
      table_settings: {
        fields: [
          {
            key: 'name',
            sortable: true
          },
          {
            // Only exists since 2026-10-07: older projects have none (shown as a dash).
            key: 'published_at',
            label: this.$t('browse.published'),
            sortable: true
          },
          {
            key: 'last_update',
            label: this.$t('browse.last_modification'),
            sortable: true,
            formatter: value => new Date(value).toLocaleDateString(undefined, DATE_OPTIONS)
          }
        ],
        per_page: 20,
        per_page_array: [20, 40, 60, 80, 100],
        current_page: 1,
        filter: null,
        sortBy: 'published_at',
        sortDesc: true,
        isBusy: true
      }
    }
  },
  mounted () {
    this.getPublicTables()
  },
  methods: {
    formatPublishedAt: function (value) {
      const time = publishedTime(value)
      return time === null ? '—' : new Date(time).toLocaleDateString(undefined, DATE_OPTIONS)
    },
    // b-table negates the whole comparison when sorting descending (so `sort-null-last`
    // would put them first): undated projects are pre-negated to stay last both ways.
    sortCompare: function (a, b, key, sortDesc) {
      if (key !== 'published_at') return null
      const ta = publishedTime(a.published_at)
      const tb = publishedTime(b.published_at)
      if (ta === null || tb === null) {
        if (ta === tb) return 0
        return (ta === null ? 1 : -1) * (sortDesc ? -1 : 1)
      }
      return ta - tb
    },
    getPublicTables: function () {
      this.table_settings.isBusy = true
      Api.get('/browse')
        .then((response) => {
          this.loadError = false
          this.public_tables = response.data
          this.table_settings.isBusy = false
        })
        .catch((error) => {
          console.error(error)
          this.loadError = true
          this.table_settings.isBusy = false
        })
    }
  }
}
</script>

<style>

</style>
