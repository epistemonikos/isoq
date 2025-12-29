// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import axios from 'axios'
import Router from 'vue-router'
import App from './App'

import { store } from './store'
import routes from './router/index'
import VueBootstrap from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faComments, faArrowsAlt, faCaretDown, faUsers, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { i18n } from './plugins/i18n'
import { Trans } from './plugins/Translation'

library.add(faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faComments, faArrowsAlt, faCaretDown, faUsers, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.prototype.$http = axios

/*
const token = localStorage.getItem('user-token')
if (token) {
  Vue.prototype.$http.defaults.headers.common['Authorization'] = token
}
*/

Vue.use(Router)
Vue.use(VueBootstrap)
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
  store.dispatch('getLogginInfo', {})
  store.state.promise.then(() => {
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
