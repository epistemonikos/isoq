<template>
  <div>
    <b-navbar id="main-navbar" toggleable="lg">
      <b-navbar-brand :to="{name: 'MainPage'}">
        <p><img :src="iconUrl" alt="GRADE-CERQual">
        <span class="subtitle mt-2 d-none d-sm-block">interactive Summary of Qualitative Findings</span>
        <span class="subtitle mt-2 d-block d-sm-none">iSoF</span>
      </p>
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="$i18nRoute({ name: 'About'})">{{ $t("About") }}</b-nav-item>
          <b-nav-item :to="$i18nRoute({ name: 'Browse'})">{{ $t("Browse") }}</b-nav-item>
          <b-nav-item :to="{ name: 'Help' }">Help</b-nav-item>
          <template v-if="$store.getters.isLoggedIn">
            <b-nav-item :to="$i18nRoute({ name: 'viewOrganization', params: {id: this.$store.state.user.personal_organization }})">My Workspace</b-nav-item>
            <b-nav-item-dropdown right>
              <!-- Using 'button-content' slot -->
              <template #button-content>
                {{username}}
              </template>
              <b-dropdown-item :to="$i18nRoute({ name: 'Profile'})">Change pasword</b-dropdown-item>
              <b-dropdown-item @click="logout">{{ $t('Logout') }}</b-dropdown-item>
            </b-nav-item-dropdown>
          </template>
          <template v-else>
            <b-nav-item :to="$i18nRoute({ name: 'Login'})">{{ $t("Login") }}</b-nav-item>
          </template>
          <!-- <switch-language/> -->
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
const SwitchLanguage = () => import(/* webpackChunkName: "switchlang" */ './LanguageSelector')

export default {
  data () {
    return {
      iconUrl: require('../assets/cerqual-web.png')
    }
  },
  components: { SwitchLanguage },
  computed: {
    username: function () {
      if (this.$store.state.user.first_name.length) {
        return this.$store.state.user.first_name
      }
      if (this.$store.state.user.name.length) {
        return this.$store.state.user.name
      }
      return 'User'
    }
  },
  methods: {
    logout: function () {
      this.$store.dispatch('logout')
        .then(() => {
          this.$router.push({name: 'Login'})
        })
    }
  }
}
</script>

<style scoped>
 span.subtitle {
   position: absolute;
   top: 0.7rem;
   left: 13.5rem;
 }
</style>
