// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import { router } from './router'
import VueBootstrap from 'bootstrap-vue'
import { library } from '@fortawesome/fontawesome-svg-core'
import { faEdit, faClone, faTrash, faPlusSquare, faGlobe, faLock } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { i18n } from './plugins/i18n'
import { Trans } from './plugins/Translation'

library.add(faEdit, faClone, faTrash, faPlusSquare, faGlobe, faLock)

Vue.component('font-awesome-icon', FontAwesomeIcon)

Vue.use(VueBootstrap)
Vue.prototype.$i18nRoute = Trans.i18nRoute.bind(Trans)
Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  i18n,
  components: { App },
  template: '<App/>'
})
