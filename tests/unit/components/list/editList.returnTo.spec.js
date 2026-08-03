import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => ''),
  sortFindings: jest.fn(() => [])
}))

jest.mock('@/mixins/camelotMixin', () => ({
  camelotMixin: {
    data () {
      return { camelot: { categories: [], fields: [] } }
    }
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'edit-header-list': true, 'edit-list-actions-buttons': true,
  'evidence-profile-table': true, 'table-chars-of-studies': true,
  'table-meth-assessments': true, 'table-extracted-data': true,
  'font-awesome-icon': true
}

function createWrapper () {
  const $router = { push: jest.fn() }
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $router,
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
  return { wrapper, $router }
}

// The legacy per-finding lock stored `editing` / `userEditing` on the isoqf_lists
// document. Its gate on the Edit button was removed in 5ab6054 (2021) and its
// writer in 60c0e6f (2022), leaving returnTo() as the only code still touching
// the field: a PATCH nothing reads. These guards keep it from creeping back.
describe('editList.vue — returnTo() no arrastra el flag legado de edición', () => {
  beforeEach(() => jest.clearAllMocks())

  it('navega al proyecto sin PATCHear el documento de la lista', async () => {
    const { wrapper, $router } = createWrapper()
    await wrapper.setData({
      list: { ...wrapper.vm.list, organization: 'org1', project_id: 'proj1' }
    })

    wrapper.vm.returnTo()
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    expect($router.push).toHaveBeenCalledWith({
      name: 'viewProject',
      params: { org_id: 'org1', id: 'proj1' }
    })
    wrapper.destroy()
  })

  it('navega igual cuando el documento legado trae userEditing de este usuario', async () => {
    const { wrapper, $router } = createWrapper()
    await wrapper.setData({
      list: {
        ...wrapper.vm.list,
        organization: 'org1',
        project_id: 'proj1',
        editing: true,
        userEditing: 42
      }
    })

    wrapper.vm.returnTo()
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    expect($router.push).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('no expone editingUser (el aviso "X está editando" nunca podía mostrarse)', () => {
    const { wrapper } = createWrapper()
    expect(wrapper.vm.editingUser).toBeUndefined()
    wrapper.destroy()
  })
})
