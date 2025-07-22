<template>
  <div>
    <b-table-simple
      id="findings-print"
      ref="findings-print">
      <b-thead>
        <b-tr>
          <b-th>#</b-th>
          <b-th>Summarised review finding</b-th>
          <b-th>GRADE-CERQual assessment of confidence</b-th>
          <b-th>Explanation of GRADE-CERQual assessment</b-th>
          <b-th>References</b-th>
        </b-tr>
      </b-thead>
      <b-tbody>
        <b-tr v-for="(item, index) of local_data" :key="index">
          <template v-if="item.references.length && item.cerqual.option !== null">
            <template v-if="item.is_category">
              <b-td
                colspan="5"
                class="text-center text-uppercase font-weight-bolder"
                style="font-weight: bold; text-align: center; text-transform: uppercase;">
                {{ item.name }}
              </b-td>
            </template>
            <template v-else>
              <b-td
                style="vertical-align: top;">
                <p>{{ item.isoqf_id }}</p>
              </b-td>
              <b-td
                style="vertical-align: top;">
                <template v-if="local_project.public_type !== 'minimally'">
                  <p>
                    <b-link :to="{ name: 'previewWorksheet', params: { id: item.id, token: $route.params.token } }">{{ item.name }}</b-link>
                  </p>
                </template>
                <template v-else>
                  <p>{{ item.name }}</p>
                </template>
              </b-td>
              <b-td
                style="vertical-align: top;">
                <p>{{ item.cerqual_option }}</p>
              </b-td>
              <b-td
                style="vertical-align: top;">
                <p>{{ item.cerqual_explanation }}</p>
              </b-td>
              <b-td
                style="vertical-align: top;">
                <p class="references">{{ item.ref_list }}</p>
              </b-td>
            </template>
          </template>
        </b-tr>
      </b-tbody>
    </b-table-simple>
  </div>
</template>

<script>
export default {
  name: 'tablePrintFindings',
  props: {
    data: Array,
    project: Object
  },
  mounted: function () {
    this.loadData()
  },
  data: function () {
    return {
      local_data: []
    }
  },
  methods: {
    loadData: function () {
      this.local_data = this.data
      this.local_project = this.project
    }
  }
}
</script>
