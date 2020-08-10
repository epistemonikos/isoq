<template>
  <div>
    <b-navbar id="main-navbar" toggleable="lg">
      <b-navbar-brand :to="{name: 'MainPage'}">
        <p><img :src="iconUrl" alt="GRADE-CERQual">
        interactive Summary of Qualitative Findings</p>
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="$i18nRoute({ name: 'About'})">{{ $t("About") }}</b-nav-item>
          <b-nav-item :to="$i18nRoute({ name: 'Browse'})">{{ $t("Browse") }}</b-nav-item>
          <template v-if="$store.getters.isLoggedIn">
            <b-nav-item :to="$i18nRoute({ name: 'viewOrganization', params: {id: this.$store.state.user.personal_organization }})">My Workspace</b-nav-item>
            <b-nav-item @click="logout">{{ $t('Logout') }}</b-nav-item>
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
import SwitchLanguage from './LanguageSelector'

export default {
  data () {
    return {
      iconUrl: require('../assets/cerqual-web.png')
    }
  },
  components: { SwitchLanguage },
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

<style>

</style>
