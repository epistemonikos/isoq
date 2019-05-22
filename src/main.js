// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import axios from 'axios'
import Router from 'vue-router'
import App from './App'

import { store } from './store'
import routes from './router/index'
import VueBootstrap from 'bootstrap-vue'

Vue.prototype.$http = axios

const token = localStorage.getItem('user-token')
if (token) {
  Vue.prototype.$http.defaults.headers.common['Authorization'] = token
}

Vue.use(Router)
Vue.use(VueBootstrap)
Vue.config.productionTip = false

const router = new Router({
  mode: 'history',
  routes
})

router.beforeEach((to, from, next) => {
  store.dispatch('getLogginInfo', {})
  if (to.matched.some(record => record.meta.requiresAuth)) {
    next({name: 'Login'})
  } else {
    next()
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  components: { App },
  template: '<App/>'
})
