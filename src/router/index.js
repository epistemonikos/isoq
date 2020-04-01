import MainPage from '@/components/MainPage'
import About from '@/components/About'
import Login from '@/components/Login'
import ForgotPassword from '@/components/ForgotPassword'
import CreateAccount from '@/components/CreateAccount'
import Organizations from '@/components/Organizations'
import ViewOrganization from '@/components/organization/viewOrganization'
import ViewList from '@/components/list/viewList'
import EditList from '@/components/list/editList'
import ViewProject from '@/components/project/viewProject'
import Browse from '@/components/Browse'

// import { Trans } from '@/plugins/Translation'

var routes = [
  {
    path: '',
    name: 'MainPage',
    component: MainPage,
    meta: {
      title: 'interactive Summaries of Quality findings'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: 'interactive Summaries of Quality findings - About',
      requiresAuth: true
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'interactive Summaries of Quality findings - Login'
    }
  },
  {
    path: '/forgot_password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: 'interactive Summaries of Quality findings - Forgot password'
    }
  },
  {
    path: '/create_an_account',
    name: 'CreateAccount',
    component: CreateAccount,
    meta: {
      title: 'interactive Summaries of Quality findings - Create an account'
    }
  },
  {
    path: '/organizations',
    name: 'Organizations',
    component: Organizations,
    meta: {
      title: 'interactive Summaries of Quality findings - Organizations',
      requiresAuth: true
    }
  },
  {
    path: '/organization/:id',
    name: 'viewOrganization',
    component: ViewOrganization,
    meta: {
      title: 'interactive Summaries of Quality findings - Organization'
    }
  },
  {
    path: '/organization/:org_id/project/:id',
    name: 'viewProject',
    component: ViewProject,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/list/:id',
    name: 'viewList',
    component: ViewList,
    meta: {
      title: 'interactive Summaries of Quality findings - List',
      requiresAuth: true
    }
  },
  {
    path: '/list/:id/edit',
    name: 'editList',
    component: EditList,
    meta: {
      title: 'interactive Summaries of Quality findings - Edit List',
      requiresAuth: true
    }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: Browse,
    meta: {
      title: 'interactive Summaries of Quality findings - Browse'
    }
  }
]

export default routes
