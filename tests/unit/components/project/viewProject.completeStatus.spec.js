import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} }))
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  releaseRef: jest.fn()
}))
jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('viewProject — status uses the shared definition of complete', () => {
  it('a finding with name, option and explanation but no references is unfinished', async () => {
    const wrapper = shallowMount(viewProject, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { personal_organization: 'org1', id: 1 } } }
      },
      stubs: {
        'action-buttons': true, propertiesProject: true, UploadReferences: true,
        InclusionExclusioCriteria: true, crudTables: true, PrintViewTable: true, ViewTable: true,
        CamelotStepThree: true, CamelotStepFour: true, videoHelp: true,
        'back-to-top': true, 'content-guidance': true
      }
    })
    wrapper.setData({
      list_categories: { options: [{ id: null, text: 'No group', label: 'No group' }] },
      references: [{ id: 'r1' }],
      translatedCerqualConfidence: [
        { value: 'hc', text: 'High' }, { value: 'mc', text: 'Moderate' },
        { value: 'lc', text: 'Low' }, { value: 'vc', text: 'Very low' }
      ]
    })
    const cerqual = { option: 0, explanation: 'Because' }
    const data = await wrapper.vm.processLists({
      data: [
        { id: 'a', name: 'Complete', sort: 1, category: null, cerqual, references: ['r1'], evidence_profile: { cerqual } },
        { id: 'b', name: 'No refs', sort: 2, category: null, cerqual, references: [], evidence_profile: { cerqual } },
        { id: 'c', name: 'No cerqual key', sort: 3, category: null, references: ['r1'], evidence_profile: {} }
      ]
    })

    expect(data.map(l => [l.id, l.status])).toEqual([['a', 'completed'], ['b', 'unfinished'], ['c', 'unfinished']])
    wrapper.destroy()
  })
})
