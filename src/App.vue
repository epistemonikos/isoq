<template>
  <div id="app" class="h-100">
    <offline-indicator/>
    <session-expired-modal/>
    <main-menu/>
    <!-- <accessibility v-if="$route.name !== 'MainPage'"/> -->
    <router-view class="h-100"/>
  </div>
</template>

<script>
const Menu = () => import(/* webpackChunkName: "menu" */ '@/components/Menu')
const OfflineIndicator = () => import(/* webpackChunkName: "offline" */ '@/components/OfflineIndicator')
const SessionExpiredModal = () => import(/* webpackChunkName: "session-expired" */ '@/components/SessionExpiredModal')
// const Accessibility = () => import(/* webpackChunkName: "accessibility" */ '@/components/Accessibility')

export default {
  name: 'App',
  components: {
    'main-menu': Menu,
    'offline-indicator': OfflineIndicator,
    'session-expired-modal': SessionExpiredModal
    // 'accessibility': Accessibility
  },
  data () {
    return {
      excluded: ['viewProject', 'editList']
    }
  },
  mounted () {
    this._applyTheme(this.$store.state.theme)
    this._applyFontSize(this.$store.state.fontSize)
    // Se imprime siempre en tema claro (#416). Con el oscuro, Chrome descarta los fondos
    // pero conserva el color de texto del tema: el PDF salía gris claro sobre blanco.
    // `beforeprint`/`afterprint` cubren el botón (window.print()) y Ctrl+P.
    this._onBeforePrint = () => {
      this._themeBeforePrint = document.documentElement.getAttribute('data-theme')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    this._onAfterPrint = () => {
      if (this._themeBeforePrint) document.documentElement.setAttribute('data-theme', this._themeBeforePrint)
      this._themeBeforePrint = null
    }
    window.addEventListener('beforeprint', this._onBeforePrint)
    window.addEventListener('afterprint', this._onAfterPrint)
  },
  beforeDestroy () {
    this._removeOsListener()
    window.removeEventListener('beforeprint', this._onBeforePrint)
    window.removeEventListener('afterprint', this._onAfterPrint)
  },
  watch: {
    '$store.state.theme' (theme) {
      this._applyTheme(theme)
    },
    '$store.state.fontSize' (size) {
      this._applyFontSize(size)
    }
  },
  methods: {
    _applyFontSize (size) {
      document.body.style.fontSize = size ? `${size}px` : ''
    },
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
