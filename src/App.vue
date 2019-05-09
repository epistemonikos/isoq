<template>
  <div id="app">
    <main-menu/>
    <router-view/>
  </div>
</template>

<script>
import Menu from './components/Menu'

export default {
  name: 'App',
  components: {
    'main-menu': Menu
  }
}
</script>

<style lang="scss">
  @import "./assets/styles/main.scss";
</style>
