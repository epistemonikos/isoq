// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import axios from 'axios'
import Router from 'vue-router'
import App from './App'
import * as Sentry from '@sentry/vue'

import { store } from './store'
import routes from './router/index'
import { needsTermsAcceptance } from './constants/terms'
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
import { faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faEyeSlash, faFilter, faFileExport, faComment, faCommentSlash, faComments, faArrowsAlt, faCaretDown, faUsers, faUser, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt, faSyncAlt, faWifi, faExclamationTriangle, faSave, faGripVertical, faInfoCircle, faCheck, faSun, faMoon, faKey, faCheckCircle, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { i18n } from './plugins/i18n'
import { Trans } from './plugins/Translation'
import NotifyPlugin from './plugins/notify'

library.add(faChevronUp, faChevronDown, faEdit, faCopy, faTrash, faPlusSquare, faGlobe, faLock, faLongArrowAltLeft, faTable, faFileUpload, faPlus, faHighlighter, faPrint, faEye, faEyeSlash, faFilter, faFileExport, faComment, faCommentSlash, faComments, faArrowsAlt, faCaretDown, faUsers, faUser, faExclamationCircle, faQuestionCircle, faLink, faSignOutAlt, faSyncAlt, faWifi, faExclamationTriangle, faSave, faGripVertical, faInfoCircle, faCheck, faSun, faMoon, faKey, faCheckCircle)

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

if (process.env.SENTRY_DSN) {
  Sentry.init({
    Vue,
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new Sentry.BrowserTracing({
        routingInstrumentation: Sentry.vueRouterInstrumentation(router)
      })
    ],
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE,
    logErrors: true
  })
}

// Manejar errores de navegación
router.onError((error) => {
  if (error && error.name !== 'NavigationDuplicated') {
    console.error('Error de navegación:', error)
  }
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
        // Términos sin aceptar (GDPR): se cierra la sesión y se manda a Login.
        // Va antes del chequeo de requiresAdmin a propósito — la obligación
        // legal no depende del rol.
        //
        // La regla vive entera en ./constants/terms; acá sólo se decide qué
        // hacer con la respuesta. El espejo de este guard está en
        // tests/unit/router.guard.spec.js (runGuardWithTerms): mantenerlos
        // sincronizados al tocar esto.
        //
        // El .finally() no es cosmético: si el logout falla (offline, 401) y
        // next() colgara del .then(), la app se quedaría en la ruta anterior
        // sin navegar ni avisar.
        if (needsTermsAcceptance(store.state.user)) {
          store.dispatch('logout')
            .catch(() => {})
            .finally(() => {
              next({
                name: 'Login',
                query: { redirect: to.fullPath }
              })
            })
          return
        }

        if (to.matched.some(record => record.meta.requiresAdmin)) {
          const u = store.state.user
          if (!u.support && !u.superadmin) {
            next({ name: 'Organizations' })
            return
          }
        }
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
