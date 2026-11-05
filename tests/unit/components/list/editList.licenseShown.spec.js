import { shallowMount, createLocalVue } from '@vue/test-utils'
import editList from '@/components/list/editList.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

jest.mock('@/utils/commons', () => ({
  parseReference: jest.fn(() => 'Author'),
  printErrors: jest.fn(),
  theLicense: jest.fn(() => 'LICENCE-TEXT'),
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

async function mountWith (project) {
  const wrapper = shallowMount(editList, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'list1' } },
      $store: { state: { user: { personal_organization: 'org1', id: 42 } } }
    },
    stubs,
    methods: { getList: jest.fn() }
  })
  await wrapper.setData({ project })
  return wrapper
}

describe('editList.vue: licence shown follows the canonical publication rule', () => {
  it('shows the licence for public_type fully even if is_public is stale false', async () => {
    const wrapper = await mountWith({ license_type: 'CC-BY', public_type: 'fully', private: true, is_public: false })
    expect(wrapper.text()).toContain('project.license_type')
    expect(wrapper.text()).toContain('LICENCE-TEXT')
  })

  it('hides the licence for public_type private even if is_public is stale true', async () => {
    const wrapper = await mountWith({ license_type: 'CC-BY', public_type: 'private', is_public: true })
    expect(wrapper.text()).not.toContain('project.license_type')
    expect(wrapper.text()).not.toContain('LICENCE-TEXT')
  })
})
