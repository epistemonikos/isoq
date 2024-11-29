<template>
  <div id="app" class="h-100">
    <main-menu/>
    <accessibility v-if="$route.name !== 'MainPage'"/>
    <router-view class="h-100"/>
  </div>
</template>

<script>
const Menu = () => import(/* webpackChunkName: "menu" */ '@/components/Menu')
const Accessibility = () => import(/* webpackChunkName: "accessibility" */ '@/components/Accessibility')

export default {
  name: 'App',
  components: {
    'main-menu': Menu,
    'accessibility': Accessibility
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
