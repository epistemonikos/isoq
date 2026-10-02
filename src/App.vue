<template>
  <div id="app" class="h-100">
    <offline-indicator/>
    <main-menu/>
    <!-- <accessibility v-if="$route.name !== 'MainPage'"/> -->
    <router-view class="h-100"/>
  </div>
</template>

<script>
const Menu = () => import(/* webpackChunkName: "menu" */ '@/components/Menu')
const OfflineIndicator = () => import(/* webpackChunkName: "offline" */ '@/components/OfflineIndicator')
// const Accessibility = () => import(/* webpackChunkName: "accessibility" */ '@/components/Accessibility')

export default {
  name: 'App',
  components: {
    'main-menu': Menu,
    'offline-indicator': OfflineIndicator
    // 'accessibility': Accessibility
  },
  data () {
    return {
      excluded: ['viewProject', 'editList'],
      _osThemeListener: null
    }
  },
  mounted () {
    this._applyTheme(this.$store.state.theme)
  },
  beforeDestroy () {
    this._removeOsListener()
  },
  watch: {
    '$store.state.theme' (theme) {
      this._applyTheme(theme)
    }
  },
  methods: {
    _applyTheme (preference) {
      this._removeOsListener()
      if (preference === 'system') {
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        const handler = (e) => {
          document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
        }
        mq.addEventListener('change', handler)
        this._osThemeListener = { mq, handler }
        document.documentElement.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
      } else {
        document.documentElement.setAttribute('data-theme', preference)
      }
    },
    _removeOsListener () {
      if (this._osThemeListener) {
        this._osThemeListener.mq.removeEventListener('change', this._osThemeListener.handler)
        this._osThemeListener = null
      }
    }
  }
}
</script>

<style lang="scss">
@import './assets/styles/main.scss';
</style>
