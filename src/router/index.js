import MainPage from '@/components/MainPage'
import About from '@/components/About'
import Login from '@/components/Login'
import ForgotPassword from '@/components/ForgotPassword'
import CreateAccount from '@/components/CreateAccount'

const routes = [
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

export default routes
