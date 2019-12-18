<template>
  <div class="mt-4">
    <b-container>
      <h2 class="mb-5">Workspaces</h2>
      <b-row>
        <b-col
          sm="6"
          cols="12">
          <h3>My Workspace</h3>
          <b-table
            id="my-workspace"
            striped
            :fields="fields"
            :items="myOrganization">
            <template v-slot:cell(name)="data">
              <b-link :to="{ name: 'viewOrganization', params: { id: data.item.id } }">{{ data.item.name }}</b-link>
            </template>
          </b-table>
        </b-col>
        <b-col
          sm="6"
          cols="12">
          <h3>Other Workspaces</h3>
          <b-table
            id="organizations"
            striped
            :fields="fields"
            :items="otherOrganizations">
            <template v-slot:cell(name)="data">
              <b-link :to="{ name: 'viewOrganization', params: { id: data.item.id } }">{{ data.item.name }}</b-link>
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
      myOrganization: [],
      otherOrganizations: [],
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
        if (org.name === 'My frameworks' || org.name === 'My iSoQf') {
          org.name = 'My iSoQf'
          this.myOrganization.push(org)
        } else {
          this.otherOrganizations.push(org)
        }
      }
    }
  }
}
</script>

<style scoped>
</style>
