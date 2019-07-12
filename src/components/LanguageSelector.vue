<template>
  <b-nav-item-dropdown v-bind:text="$t('Lang')" right >
    <b-dropdown-item
      v-for="lang in supportedLanguages"
      :key="lang"
      @click="changeLanguage(lang)"
      :active="isCurrentLanguage(lang)">{{lang}}</b-dropdown-item>
  </b-nav-item-dropdown>
</template>

<script>
import { Trans } from '@/plugins/Translation'

export default {
  name: 'LanguageSwitcher',
  computed: {
    supportedLanguages () {
      return Trans.supportedLanguages
    },
    currentLanguage () {
      return Trans.currentLanguage
    }
  },
  methods: {
    changeLanguage (lang) {
      const to = this.$router.resolve({ params: { lang } })
      return Trans.changeLanguage(lang).then(() => {
        this.$router.push(to.location)
      })
    },
    isCurrentLanguage (lang) {
      return lang === this.currentLanguage
    }
  }
}
</script>

<style>

</style>
