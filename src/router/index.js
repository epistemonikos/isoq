import { isGdprEnabled } from '@/constants/gdpr'

const MainPage = () => import(/* webpackChunkName: "home" */ '@/components/MainPage')
const AdminPanel = () => import(/* webpackChunkName: "admin" */ '@/components/admin/AdminPanel.vue')
const About = () => import(/* webpackChunkName: "about" */ '@/components/About')
const Login = () => import(/* webpackChunkName: "login" */ '@/components/Login')
const ForgotPassword = () => import(/* webpackChunkName: "forgotpassword" */ '@/components/ForgotPassword')
const CreateAccount = () => import(/* webpackChunkName: "createaccount" */ '@/components/CreateAccount')
const Profile = () => import(/* webpackChunkName: "profile" */ '@/components/profile/viewProfile')
const Organizations = () => import(/* webpackChunkName: "organizations" */ '@/components/Organizations')
const ViewOrganization = () => import(/* webpackChunkName: "vieworganization" */ '@/components/organization/viewOrganization')
const EditList = () => import(/* webpackChunkName: "editlist" */ '@/components/list/editList')
const ViewProject = () => import(/* webpackChunkName: "viewproject" */ '@/components/project/viewProject')
const Browse = () => import(/* webpackChunkName: "browse" */ '@/components/Browse')
const NewPassword = () => import(/* webpackChunkName: "newpassword" */ '@/components/NewPassword')
const CheckEmail = () => import(/* webpackChunkName: "checkemail" */ '@/components/CheckEmail')
const VerifyEmail = () => import(/* webpackChunkName: "verifyemail" */ '@/components/VerifyEmail')
const previewContentSoQf = () => import(/* webpackChunkName: "previewcontentsoqf" */ '@/components/previewContent/previewContentSoQf')
const previewWorksheet = () => import(/* webpackChunkName: "previewworksheet" */ '@/components/previewContent/previewContentWorksheet')
const Help = () => import(/* webpackChunkName: "help" */ '@/components/Help')
const WhatsNew = () => import(/* webpackChunkName: "whatsnew" */ '@/components/WhatsNew')
const PrivacyAndTerms = () => import(/* webpackChunkName: "privacyandterms" */ '@/components/PrivacyAndTerms')

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
    path: '/privacy-and-terms',
    name: 'PrivacyAndTerms',
    component: PrivacyAndTerms,
    meta: {
      title: 'Privacy and Terms - Interactive Summary of Qualitative Findings'
    },
    // Con ENABLE_GDPR apagado la ruta se redirige, no se elimina.
    //
    // Eliminarla dejaría las tres URLs legadas de abajo apuntando a un nombre
    // inexistente, y vue-router responde a eso con una pantalla en blanco y un
    // error de consola. Como las tres redirigen por NOMBRE hacia acá, este
    // único beforeEnter cubre las cuatro URLs con una salida limpia.
    beforeEnter: (to, from, next) => {
      next(isGdprEnabled() ? undefined : { name: 'MainPage' })
    }
  },
  // Las tres URLs de abajo las publica master vía new-gdpr. Si alguien las
  // comparte, tienen que seguir funcionando cuando develop llegue a producción.
  {
    path: '/terms-and-conditions',
    redirect: { name: 'PrivacyAndTerms', query: { tab: 'terms' } }
  },
  {
    path: '/privacy-policy',
    redirect: { name: 'PrivacyAndTerms', query: { tab: 'privacy' } }
  },
  {
    path: '/intellectual-property',
    redirect: { name: 'PrivacyAndTerms', query: { tab: 'property' } }
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
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: {
      title: 'Profile - Interactive Summary of Qualitative Findings',
      requiresAuth: true
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
    path: '/accounts/check_email',
    name: 'checkEmail',
    component: CheckEmail,
    meta: {
      title: 'Check your email - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/accounts/verify_email/:token',
    name: 'verifyEmail',
    component: VerifyEmail,
    meta: {
      title: 'Verify email - Interactive Summary of Qualitative Findings'
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
    path: '/shared/:token',
    name: 'sharedContent',
    component: previewContentSoQf,
    meta: {
      title: 'iSoQ Shared - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/preview/worksheet/:id/:projectId/:token',
    name: 'previewWorksheet',
    component: previewWorksheet,
    meta: {
      title: 'Worksheet Preview - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/whats-new',
    name: 'WhatsNew',
    component: WhatsNew,
    meta: {
      title: 'Whats new - Interactive Summary of Qualitative Findings'
    }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPanel,
    meta: {
      title: 'Admin - iSoQ',
      requiresAuth: true,
      requiresAdmin: true
    }
  }
]

export default routes
