<template>
  <div class="mt-4">
    <div class="container">
      <h1>Browse public iSoQF tables</h1>
      <b-row
        class="my-4">
        <b-col
          cols="12"
          sm="9">
          <b-form-group
            label="Search"
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
            label="Tables per pages"
            label-for="select-tablesperpages">
            <b-form-select
              id="select-tablesperpages"
              :options="table_settings.per_page_array"
              v-model="table_settings.per_page"></b-form-select>
          </b-form-group>
        </b-col>
      </b-row>
      <b-table
        striped
        :fields="table_settings.fields"
        :items="public_tables"
        :per-page="table_settings.per_page"
        :current-page="table_settings.current_page"
        :filter="table_settings.filter"
        :sort-by.sync="table_settings.sortBy"
        :sort-desc.sync="table_settings.sortDesc"
        :busy="table_settings.isBusy">
        <!-- spinner -->
        <div slot="table-busy" class="text-center text-primary my-2">
          <b-spinner type="grow" variant="primary" class="align-middle"></b-spinner>
          <strong>Loading...</strong>
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
import axios from 'axios'

export default {
  data () {
    return {
      public_tables: [],
      table_settings: {
        fields: [{key: 'name', sortable: true}, 'review_question', 'description', 'authors'],
        per_page: 20,
        per_page_array: [20, 40, 60, 80, 100],
        current_page: 1,
        filter: null,
        sortBy: 'name',
        sortDesc: false,
        isBusy: true
      }
    }
  },
  mounted () {
    this.getPublicTables()
  },
  methods: {
    getPublicTables: function () {
      axios.get('/api/isoqf_projects?private=false')
        .then((response) => {
          this.public_tables = response.data
          this.table_settings.isBusy = false
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }
}
</script>

<style>

</style>