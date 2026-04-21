// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import axios from 'axios'
import Router from 'vue-router'
import App from './App'

import { store } from './store'
import routes from './router/index'
import {
  AlertPlugin,
  BadgePlugin,
  ButtonPlugin,
  CardPlugin,
  CollapsePlugin,
  DropdownPlugin,
  EmbedPlugin,
  FormPlugin,
  FormCheckboxPlugin,
  FormFilePlugin,
  FormGroupPlugin,
  FormInputPlugin,
  FormRadioPlugin,
  FormSelectPlugin,
  FormTextareaPlugin,
  ImagePlugin,
  InputGroupPlugin,
  LayoutPlugin,
  LinkPlugin,
  ListGroupPlugin,
  ModalPlugin,
  NavPlugin,
  NavbarPlugin,
  PaginationPlugin,
  ProgressPlugin,
  SidebarPlugin,
  SpinnerPlugin,
  TabsPlugin,
  TablePlugin,
  ToastPlugin,
  TooltipPlugin
} from 'bootstrap-vue'


import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faEyeSlash, faFilter, faFileExport, faComment, faCommentSlash, faComments, faArrowsAlt, faCaretDown, faUsers, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt, faSyncAlt, faWifi, faExclamationTriangle, faSave, faGripVertical, faInfoCircle, faCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { i18n } from './plugins/i18n'
import { Trans } from './plugins/Translation'
import NotifyPlugin from './plugins/notify'

library.add(faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faEyeSlash, faFilter, faFileExport, faComment, faCommentSlash, faComments, faArrowsAlt, faCaretDown, faUsers, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt, faSyncAlt, faWifi, faExclamationTriangle, faSave, faGripVertical, faInfoCircle, faCheck)

Vue.component('font-awesome-icon', FontAwesomeIcon)

// Listeners globales para actualizar el store
window.addEventListener('online', () => { store.commit('SET_ONLINE', true) })
window.addEventListener('offline', () => { store.commit('SET_ONLINE', false) })

Vue.mixin({
  computed: {
    isOnline () {
      return store.state.isOnline
    }
  }
})

/*
const token = localStorage.getItem('user-token')
if (token) {
  Vue.prototype.$http.defaults.headers.common['Authorization'] = token
}
*/

Vue.use(Router)
Vue.use(AlertPlugin)
Vue.use(BadgePlugin)
Vue.use(ButtonPlugin)
Vue.use(CardPlugin)
Vue.use(CollapsePlugin)
Vue.use(DropdownPlugin)
Vue.use(EmbedPlugin)
Vue.use(FormPlugin)
Vue.use(FormCheckboxPlugin)
Vue.use(FormFilePlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormInputPlugin)
Vue.use(FormRadioPlugin)
Vue.use(FormSelectPlugin)
Vue.use(FormTextareaPlugin)
Vue.use(ImagePlugin)
Vue.use(InputGroupPlugin)
Vue.use(LayoutPlugin)
Vue.use(LinkPlugin)
Vue.use(ListGroupPlugin)
Vue.use(ModalPlugin)
Vue.use(NavPlugin)
Vue.use(NavbarPlugin)
Vue.use(PaginationPlugin)
Vue.use(ProgressPlugin)
Vue.use(SidebarPlugin)
Vue.use(SpinnerPlugin)
Vue.use(TabsPlugin)
Vue.use(TablePlugin)
Vue.use(ToastPlugin)
Vue.use(TooltipPlugin)
Vue.use(NotifyPlugin)

Vue.prototype.$i18nRoute = Trans.i18nRoute.bind(Trans)
Vue.config.productionTip = false

const router = new Router({
  mode: 'hash',
  routes,
  scrollBehavior: () => ({ x: 0, y: 0 })
})

// Manejar errores de navegación
router.onError((error) => {
  console.error('Error de navegación:', error)
})

// Asegurarse que el router esté listo antes de crear la instancia de Vue
router.beforeEach((to, from, next) => {
  store.dispatch('getLogginInfo').then(() => {
    return store.state.promise || Promise.resolve()
  }).then(() => {
    const nearestWithTitle = to.matched.slice().reverse().find(r => r.meta && r.meta.title)
    if (nearestWithTitle) document.title = nearestWithTitle.meta.title

    if (to.matched.some(record => record.meta.requiresAuth)) {
      if (store.getters.isLoggedIn) {
        next()
        return
      }
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  }).catch(() => {
    if (to.matched.some(record => record.meta.requiresAuth)) {
      next({
        name: 'Login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  })
})

// Esperar a que el router esté listo antes de crear la instancia de Vue
Trans.changeLanguage(Trans.getUserSupportedLang()).then(() => {
  new Vue({
    el: '#app',
    router,
    store,
    i18n,
    render: h => h(App)
  })
})

// Registro del Service Worker para PWA
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        // console.log('SW registered:', registration.scope)

        // Escuchar actualizaciones del service worker
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nueva versión disponible
                // console.log('New content available, refresh to update.')
              }
            })
          }
        })
      })
      .catch(error => {
        console.error('SW registration failed:', error)
      })
  })
}
