<template>
  <div>
    <h4 class="mt-5">{{ $t('meth_assessments.table_title') }}</h4>
    <p class="font-weight-light">
      {{ $t('meth_assessments.description') }}
    </p>
    <div>
      <b-table
        sort-by="authors"
        responsive
        id="methodological-table"
        v-if="local_data.fieldsObj.length > 1"
        class="table-content-refs mt-3"
        :per-page="local_settings.perPage"
        :current-page="local_settings.currentPage"
        :fields="local_data.fieldsObj"
        :items="local_data.items"
        :busy="local_settings.isBusy">
        <!-- <template
          v-slot:cell(actions)="data"
          v-if="local_data.fields.length > 2">
          <b-button
            block
            variant="outline-success"
            @click="addDataMethodological((local_settings.currentPage > 1) ? (local_settings.perPage * (local_settings.currentPage - 1)) + data.index : data.index)">
            <font-awesome-icon
              icon="edit"></font-awesome-icon>
          </b-button>
          <b-button
            block
            variant="outline-danger"
            @click="removeItemMethodological((local_settings.currentPage > 1) ? (local_settings.perPage * (local_settings.currentPage - 1)) + data.index : data.index, data.item.ref_id)">
            <font-awesome-icon
              icon="trash"></font-awesome-icon>
          </b-button>
        </template> -->
        <template v-slot:table-busy>
          <div class="text-center text-danger my-2">
            <b-spinner class="align-middle"></b-spinner>
            <strong>{{ $t('common.loading') }}</strong>
          </div>
        </template>
      </b-table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'displayMethAssessmentsTableData',
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
        perPage: 10,
        currentPage: 1,
        isBusy: false
      }
    }
  },
  mounted: function () {
    this.getData()
  },
  methods: {
    getData: function () {
      this.local_data = this.tableData
      this.local_settings = this.tableSettings
    }
  }
}
</script>
