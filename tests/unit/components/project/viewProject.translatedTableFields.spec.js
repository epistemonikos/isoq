import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  return shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify
    },
    stubs
  })
}

// This pins the REAL path the iSoQ table renders through: ViewTable.vue receives
// its `fields` prop from this computed (see viewProject.vue template, `:fields`
// binding), not from ViewTable's own prop default — that default is dead code
// because it's always overridden here. A test that only covered the default would
// miss a real "#" column that still reads the persisted `sort` field.
describe('viewProject.vue — translatedTableFields (columna "#" real de la tabla iSoQ)', () => {
  it('usa displayNumber como key de la primera columna en with_categories', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.translatedTableFields.with_categories[0].key).toBe('displayNumber')
    wrapper.destroy()
  })

  it('usa displayNumber como key de la primera columna en without_categories', () => {
    const wrapper = createWrapper()
    expect(wrapper.vm.translatedTableFields.without_categories[0].key).toBe('displayNumber')
    wrapper.destroy()
  })
})
