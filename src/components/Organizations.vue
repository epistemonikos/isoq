<template>
  <div class="mt-4">
    <b-container>
      <h2 class="mb-5">{{ $t("Organizations") }}</h2>
      <b-row>
        <b-col
          cols="12">
          <b-table
            id="organizations"
            striped
            :fields="fields"
            :items="organizations">
            <template v-slot:cell(name)="data">
              <b-link :to="{name: 'viewOrganization', params: {id: data.item.id}}">{{ (data.item.name === 'My frameworks') ? 'My iSoQf' : data.item.name }}</b-link>
            </template>
          </b-table>
        </b-col>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      default_logo_org: '//placehold.it/800x600',
      organizations: [],
      fields: [
        { key: 'name', label: 'Name' }
      ]
    }
  },
  mounted () {
    this.getOrganizations()
  },
  methods: {
    getOrganizations: function () {
      for (let org of this.$store.state.user.orgs) {
        this.organizations.push(org)
      }
    }
  }
}
</script>

<style scoped>
</style>
