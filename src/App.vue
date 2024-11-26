<template>
  <div id="app" class="h-100">
    <main-menu/>
    <router-view class="h-100"/>
  </div>
</template>

<script>
const Menu = () => import(/* webpackChunkName: "menu" */ '@/components/Menu')

export default {
  name: 'App',
  components: {
    'main-menu': Menu
  },
  data () {
    return {
      excluded: ['viewProject', 'editList']
    }
  }
}
</script>

<style lang="scss">
  @import "./assets/styles/main.scss";
</style>
