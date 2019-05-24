<template>
  <div class="mt-4">
    <b-container>
      <h2 class="mb-5">Organizations</h2>
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
              <b-link :to="{name: 'viewOrganization', params: {id: org.id}}">view our iSoQF</b-link>
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
      organizations: [
        {id: 1, name: 'Epistemonikos', description: 'We bring scientific evidence closer to everyone making health decisions.', image: 'https://www.epistemonikos.cl/wp-content/uploads/2018/06/web-banner-produc-03.png'},
        {id: 2, name: 'Organization Test', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.', image: 'https://picsum.photos/200/200/?image=39'},
        {id: 3, name: 'org 03', description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Vel quia omnis eligendi asperiores dignissimos aspernatur praesentium rerum labore aut eaque odio similique ipsa excepturi voluptate, a tempore aperiam quis autem?', image: 'https://picsum.photos/200/200/?image=41'},
        {id: 4, name: 'org 04', description: '', image: 'https://picsum.photos/200/200/?image=40'},
        {id: 5, name: 'org 05', description: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.', image: ''}
      ]
    }
  }
}
</script>

<style>

</style>
