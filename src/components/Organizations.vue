<template>
  <div>
    <b-container fluid class="workspace-header">
      <div class="py-5">
        <h2>Workspaces</h2>
      </div>
    </b-container>
    <b-container fluid class="mt-5">
      <b-row>
        <b-col
          sm="6"
          cols="12">
          <h3>My Workspace</h3>
          <b-table
            id="my-workspace"
            striped
            bordered
            head-variant="light"
            :fields="fields"
            :items="myOrganization">
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
        if (this.$store.state.user.personal_organization === org.id) {
          org.name = this.$store.state.user.first_name + '\'s projects'
          this.myOrganization.push(org)
        }
      }
    }
  }
}
</script>

<style scoped>
</style>
