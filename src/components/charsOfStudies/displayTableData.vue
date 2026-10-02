<template>
  <div>
    <h4 class="mt-5">{{ $t('characteristics.table_title') }}</h4>
    <p class="font-weight-light">
      {{ $t('characteristics.description') }}
    </p>
    <b-table
      sort-by="authors"
      responsive
      id="chars-of-studies-table"
      class="table-content-refs mt-3"
      v-if="local_data.fieldsObj.length > 1"
      :fields="local_data.fieldsObj"
      :items="local_data.items"
      :current-page="local_settings.currentPage"
      :per-page="local_settings.perPage"
      :busy="local_settings.isBusy">
      <template v-slot:table-busy>
        <div class="text-center text-danger my-2">
          <b-spinner class="align-middle"></b-spinner>
          <strong>{{ $t('common.loading') }}</strong>
        </div>
      </template>
    </b-table>
  </div>
</template>

<script>
export default {
  name: 'displayTableDataCharsOfStudies',
  props: {
    tableData: Object,
    tableSettings: Object
  },
  data: function () {
    return {
      local_data: {
        fields: [],
        items: [],
        authors: '',
        fieldsObj: [
          { key: 'authors', label: this.$t('references.author_year') }
        ]
      },
      local_settings: {
        currentPage: 1,
        perPage: 10,
        isBusy: false
      }
    }
  },
  mounted: function () {
    this.loadData()
  },
  methods: {
    loadData: function () {
      this.local_data = this.tableData
      this.local_settings = this.tableSettings
    }
  }
}
</script>
