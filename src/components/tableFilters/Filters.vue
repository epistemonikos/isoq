<template>
  <b-card
    class="my-3"
    bg-variant="light">
    <b-row>
      <b-col
        cols="12"
        sm="6">
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
        sm="6">
        <b-form-group label="Per page" >
          <b-form-select
            v-model="tableSettings.perPage"
            :options="tableSettings.pageOptions"></b-form-select>
        </b-form-group>
      </b-col>
    </b-row>
  </b-card>
</template>

<script>
export default {
  name: 'bCardFilters',
  props: {
    tableSettings: Object
  },
  data () {
    return {
      options: []
    }
  }
}
</script>
