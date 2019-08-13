<template>
  <div class="mt-4">
    <b-container>
      <h2 class="mb-5">{{ $t("Organizations") }}</h2>
      <b-row>
        <b-card-group columns>
          <b-card
            v-for="org in organizations"
            v-bind:key="org.id"
            v-bind:title="org.name"
            v-bind:img-src="org.image || default_logo_org">
            <b-card-text>
              {{org.description}}
            </b-card-text>
            <template slot="footer">
              <b-link :to="{name: 'viewOrganization', params: {id: org.id}}">{{ $t("view our iSoQf" )}}</b-link>
            </template>
          </b-card>
        </b-card-group>
      </b-row>
    </b-container>
  </div>
</template>

<script>
export default {
  data () {
    return {
      default_logo_org: '//placehold.it/800x600',
      organizations: []
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

<style>

</style>
