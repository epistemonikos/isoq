<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>Browse public iSoQ tables</h2>
      </div>
    </b-container>
    <b-container fluid>
      <p>Review authors using the iSoQ tool can choose to publish some or all of their interactive Summary of Qualitative Findings table to the database below. The GRADE-CERQual project group does not currate this database, therefore we cannot attest to whether or not the GRADE-CERQual approach was applied appropriately and in line with our <a href="https://implementationscience.biomedcentral.com/articles/supplements/volume-13-supplement-1" target="_blank">guidance</a>.</p>
    </b-container>
    <div class="container-fluid">
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
        bordered
        head-variant="light"
        :fields="table_settings.fields"
        :items="public_tables"
        :per-page="table_settings.per_page"
        :current-page="table_settings.current_page"
        :filter="table_settings.filter"
        :sort-by.sync="table_settings.sortBy"
        :sort-desc.sync="table_settings.sortDesc"
        :busy="table_settings.isBusy">
        <template v-slot:cell(name)="data">
          <b-link :to="{ name: 'previewContentSoQf', params: { org_id: data.item.organization, isoqf_id: data.item.id, token: 'public' }}">{{data.item.name}}</b-link>
        </template>
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
        fields: [
          {
            key: 'name',
            sortable: true
          },
          {
            key: 'last_update',
            label: 'Last Modification',
            formatter: value => {
              const _date = new Date(value)
              const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }
              return _date.toLocaleDateString(undefined, options)
            }
          }
        ],
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
      axios.get('/api/browse')
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
