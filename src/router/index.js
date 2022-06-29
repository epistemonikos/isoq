const MainPage = () => import(/* webpackChunkName: "home" */ '@/components/MainPage')
const About = () => import(/* webpackChunkName: "about" */ '@/components/About')
const Login = () => import(/* webpackChunkName: "login" */ '@/components/Login')
const ForgotPassword = () => import(/* webpackChunkName: "forgotpassword" */ '@/components/ForgotPassword')
const CreateAccount = () => import(/* webpackChunkName: "createaccount" */ '@/components/CreateAccount')
const Organizations = () => import(/* webpackChunkName: "organizations" */ '@/components/Organizations')
const ViewOrganization = () => import(/* webpackChunkName: "vieworganization" */ '@/components/organization/viewOrganization')
const EditList = () => import(/* webpackChunkName: "editlist" */ '@/components/list/editList')
const ViewProject = () => import(/* webpackChunkName: "viewproject" */ '@/components/project/viewProject')
const Browse = () => import(/* webpackChunkName: "browse" */ '@/components/Browse')
const NewPassword = () => import(/* webpackChunkName: "newpassword" */ '@/components/NewPassword')
const previewContentSoQf = () => import(/* webpackChunkName: "previewcontentsoqf" */ '@/components/previewContent/previewContentSoQf')
const previewWorksheet = () => import(/* webpackChunkName: "previewworksheet" */ '@/components/previewContent/previewContentWorksheet')
const Help = () => import(/* webpackChunkName: "help" */ '@/components/Help')
// const fixCats = () => import(/* webpackChunkName: "fixCats" */ '@/components/fixCategories')

// import { Trans } from '@/plugins/Translation'

var routes = [
  {
    path: '',
    name: 'MainPage',
    component: MainPage,
    meta: {
      title: 'Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      title: 'About - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/help',
    name: 'Help',
    component: Help,
    meta: {
      title: 'Help - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: 'Login - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/forgot_password',
    name: 'ForgotPassword',
    component: ForgotPassword,
    meta: {
      title: 'Forgot password - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/create_an_account',
    name: 'CreateAccount',
    component: CreateAccount,
    meta: {
      title: 'Create an account - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/browse',
    name: 'Browse',
    component: Browse,
    meta: {
      title: 'Browse - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/workspace/:id',
    name: 'viewOrganization',
    component: ViewOrganization,
    meta: {
      title: 'Workspace - Interactive Summary of Qualitative Findings',
      requiresAuth: true
    }
  },
  {
    path: '/workspaces',
    name: 'Organizations',
    component: Organizations,
    meta: {
      title: 'Workspaces - Interactive Summary of Qualitative Findings',
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
  // {
  //   path: '/workspace/:org_id/fixCats',
  //   name: 'fixCats',
  //   component: fixCats,
  //   meta: {
  //     requiresAuth: true
  //   }
  // },
  {
    path: '/worksheet/:id/edit',
    name: 'editList',
    component: EditList,
    meta: {
      title: 'Edit iSoQ - Interactive Summary of Qualitative Findings',
      requiresAuth: true
    }
  },
  {
    path: '/accounts/new_password/:username/:token',
    name: 'newPassword',
    component: NewPassword,
    meta: {
      title: 'New password - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/preview/isoq/:org_id/:isoqf_id/:token',
    name: 'previewContentSoQf',
    component: previewContentSoQf,
    meta: {
      title: 'iSoQ Preview - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/preview/worksheet/:id/:token',
    name: 'previewWorksheet',
    component: previewWorksheet,
    meta: {
      title: 'Worksheet Preview - Interactive Summary of Qualitative Findings'
    }
  }
]

export default routes
