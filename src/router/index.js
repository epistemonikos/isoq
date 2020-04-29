import MainPage from '@/components/MainPage'
import About from '@/components/About'
import Login from '@/components/Login'
import ForgotPassword from '@/components/ForgotPassword'
import CreateAccount from '@/components/CreateAccount'
import Organizations from '@/components/Organizations'
import ViewOrganization from '@/components/organization/viewOrganization'
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
      title: 'interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: 'About - interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login - interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/forgot_password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: 'Forgot password - interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/create_an_account',
    name: 'CreateAccount',
    component: CreateAccount,
    meta: {
      title: 'Create an account - interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: Browse,
    meta: {
      title: 'Browse - interactive Summaries of Qualitative Findings'
    }
  },
  {
    path: '/workspace/:id',
    name: 'viewOrganization',
    component: ViewOrganization,
    meta: {
      title: 'Workspace - interactive Summaries of Qualitative Findings',
      requiresAuth: true
    }
  },
  {
    path: '/workspaces',
    name: 'Organizations',
    component: Organizations,
    meta: {
      title: 'Workspaces - interactive Summaries of Qualitative Findings',
      requiresAuth: true
    }
  },
  {
    path: '/workspace/:org_id/isoqf/:id',
    name: 'viewProject',
    component: ViewProject,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/worksheet/:id/edit',
    name: 'editList',
    component: EditList,
    meta: {
      title: 'Edit iSoQf - interactive Summaries of Qualitative Findings',
      requiresAuth: true
    }
  }
]

export default routes
