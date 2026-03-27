<template>
  <div>
    <b-navbar id="main-navbar" toggleable="lg">
      <b-navbar-brand :to="{name: 'MainPage'}">
        <p><img :src="iconUrl" :alt="$t('menu.logo_alt')">
        <span class="subtitle mt-2 d-none d-sm-block">{{ $t('menu.isoq_title') }}</span>
        <span class="subtitle mt-2 d-block d-sm-none">{{ $t('menu.isoq_short') }}</span>
      </p>
      </b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="$i18nRoute({ name: 'About'})">{{ $t("menu.about") }}</b-nav-item>
          <b-nav-item :to="$i18nRoute({ name: 'Browse'})">{{ $t("menu.browse") }}</b-nav-item>
          <b-nav-item :to="{ name: 'Help' }">{{ $t('menu.help') }}</b-nav-item>
          <template v-if="!$store.getters.isLoggedIn">
            <b-nav-item :to="{ name: 'WhatsNew' }">{{ $t('menu.whats_new') }}</b-nav-item>
          </template>
          <template v-if="$store.getters.isLoggedIn">
            <b-nav-item :to="$i18nRoute({ name: 'viewOrganization', params: {id: this.$store.state.user.personal_organization }})">{{ $t('menu.my_workspace') }}</b-nav-item>
            <b-nav-item-dropdown right>
              <!-- Using 'button-content' slot -->
              <template #button-content>
                {{username}}
              </template>
              <b-dropdown-item :to="{ name: 'WhatsNew' }">{{ $t('menu.whats_new') }}</b-dropdown-item>
              <b-dropdown-item :to="$i18nRoute({ name: 'Profile'})">{{ $t('menu.profile') }}</b-dropdown-item>
              <b-dropdown-item @click="logout">{{ $t('menu.logout') }}</b-dropdown-item>
            </b-nav-item-dropdown>
          </template>
          <template v-else>
            <b-nav-item :to="$i18nRoute({ name: 'Login'})">{{ $t("common.login") }}</b-nav-item>
          </template>
          <accessibility v-if="$route.name !== 'MainPage'" :isMenu="true"/>
          <!-- <switch-language/> -->
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
const SwitchLanguage = () => import(/* webpackChunkName: "switchlang" */ './LanguageSelector')
const Accessibility = () => import(/* webpackChunkName: "accessibility" */ '@/components/Accessibility')

export default {
  data () {
    return {
      iconUrl: require('../assets/cerqual-web.png')
    }
  },
  components: { SwitchLanguage, Accessibility },
  computed: {
    username: function () {
      if (this.$store.state.user.first_name.length) {
        return this.$store.state.user.first_name
      }
      if (this.$store.state.user.name.length) {
        return this.$store.state.user.name
      }
      return this.$t('common.user')
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
