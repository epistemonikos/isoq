<template>
  <div>
    <b-navbar toggleable="lg" type="dark" variant="info">
      <b-navbar-brand :to="{name: 'MainPage'}">iSoF Qualy</b-navbar-brand>

      <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

      <b-collapse id="nav-collapse" is-nav>
        <b-navbar-nav class="ml-auto">
          <b-nav-item :to="$i18nRoute({ name: 'About'})">{{ $t("About") }}</b-nav-item>
          <b-nav-item :to="$i18nRoute({ name: 'Organizations'})">{{ $t("Organizations") }}</b-nav-item>
          <b-nav-item>{{ $t("Browser") }}</b-nav-item>
          <b-nav-item :to="$i18nRoute({ name: 'Login'})">{{ $t("Login") }}</b-nav-item>
          <switch-language/>
        </b-navbar-nav>
      </b-collapse>
    </b-navbar>
  </div>
</template>

<script>
import SwitchLanguage from './LanguageSelector'

export default {
  components: { SwitchLanguage }
}
</script>

<style>

</style>
