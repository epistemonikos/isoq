import Vue from 'vue'
import Router from 'vue-router'

import MainPage from '@/components/MainPage'
import About from '@/components/About'
import Login from '@/components/Login'
import ForgotPassword from '@/components/ForgotPassword'
import CreateAccount from '@/components/CreateAccount'

Vue.use(Router)

export const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'MainPage',
      component: MainPage,
      meta: {
        title: 'iSoF Qualy'
      }
    },
    {
      path: '/about',
      name: 'About',
      component: About,
      meta: {
        title: 'iSoF Qualy - About',
        requiresAuth: true
      }
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: {
        title: 'iSoF Qualy - Login'
      }
    },
    {
      path: '/forgot_password',
      name: 'ForgotPassword',
      component: ForgotPassword,
      meta: {
        title: 'iSoF Qualy - Forgot password'
      }
    },
    {
      path: '/create_an_account',
      name: 'CreateAccount',
      component: CreateAccount,
      meta: {
        title: 'iSoF Qualy - Create an account'
      }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('user') || false

  if (to.matched.some(record => record.meta.requiresAuth) && !loggedIn) {
    next({name: 'Login'})
  }

  next()
})
