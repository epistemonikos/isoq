<template>
  <div class="mb-3">
    <b-badge
      pill
      variant="secondary"
      v-b-toggle="`${idname}`">Show filters</b-badge>
    <b-collapse
      :id="`${idname}`">
    <b-row
      align-h="end">
      <b-col
        cols="12"
        sm="6">
        <b-card
          class="my-3"
          bg-variant="light">
          <b-row>
            <b-col
              cols="12"
              sm="9">
              <b-form-group
                label="Search">
                <b-input-group>
                  <b-form-input
                    v-model="tableSettings.filter"></b-form-input>
                  <b-input-group-append>
                    <b-button
                      :disabled="!tableSettings.filter"
                      @click="tableSettings.filter = ''">Clear</b-button>
                  </b-input-group-append>
                </b-input-group>
              </b-form-group>
            </b-col>
            <b-col
              cols="12"
              sm="3">
              <b-form-group label="Per page" >
                <b-form-select
                  v-model="tableSettings.perPage"
                  :options="tableSettings.pageOptions"></b-form-select>
              </b-form-group>
            </b-col>
          </b-row>
        </b-card>
      </b-col>
    </b-row>
    </b-collapse>
  </div>
</template>

<script>
export default {
  name: 'bCardFilters',
  props: {
    tableSettings: Object,
    idname: String
  },
  data () {
    return {
      options: []
    }
  }
}
</script>
