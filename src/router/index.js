import MainPage from '@/components/MainPage'
import About from '@/components/About'
import Login from '@/components/Login'
import ForgotPassword from '@/components/ForgotPassword'
import CreateAccount from '@/components/CreateAccount'
import Organizations from '@/components/Organizations'
import ViewOrganization from '@/components/organization/viewOrganization'
import ViewList from '@/components/list/viewList'
import EditList from '@/components/list/editList'

import { Trans } from '@/plugins/Translation'

var routes = [
  {
    path: '/:lang',
    component: {
      template: '<router-view></router-view>'
    },
    beforeEnter: Trans.routeMiddleware,
    children: [
      {
        path: '',
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
      },
      {
        path: '/organizations',
        name: 'Organizations',
        component: Organizations,
        meta: {
          title: 'iSoF Qualy - Organizations'
        }
      },
      {
        path: '/organization/:id',
        name: 'viewOrganization',
        component: ViewOrganization,
        meta: {
          title: 'iSoF Qualy - Organization'
        }
      },
      {
        path: '/list/:id',
        name: 'viewList',
        component: ViewList,
        meta: {
          title: 'iSoF Qualy - List'
        }
      },
      {
        path: '/list/:id/edit',
        name: 'editList',
        component: EditList,
        meta: {
          title: 'iSoF Qualy - Edit List'
        }
      }
    ]
  },
  {
    path: '*',
    redirect (to) {
      return Trans.getUserSupportedLang()
    }
  }
]

export default routes
