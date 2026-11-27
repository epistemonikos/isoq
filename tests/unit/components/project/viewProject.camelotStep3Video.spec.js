import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

// #422 / #426: los íconos de los Pasos 3 y 4 CAMELOT abren cada uno su propio video; My Data no cambia.

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
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

const mountWith = async (useCamelot) => {
  Api.get.mockImplementation((url) => Promise.resolve({
    data: url === '/isoqf_references' ? [{ id: 'r1', authors: [], publication_year: '2020' }] : []
  }))
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: { tab: 'My-Data', step: '3' } },
      $router: { push: jest.fn().mockResolvedValue(), replace: jest.fn().mockResolvedValue(), resolve: jest.fn(() => ({ href: '#' })) },
      $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
  await flushPromises()
  await wrapper.setData({ project: { ...wrapper.vm.project, use_camelot: useCamelot } })
  return wrapper
}

const addDataVideoId = wrapper => wrapper.find('videohelp-stub[txt="modals.add_data_title"]').attributes('urlid')
// Íconos de los títulos de los pasos (h4 > videohelp), en orden: Paso 3, Paso 4.
const stepVideoIds = wrapper => wrapper.findAll('h4 > videohelp-stub').wrappers.map(w => w.attributes('urlid'))

describe('viewProject.vue — videos de ayuda de los Pasos 3 y 4 CAMELOT (#422, #426)', () => {
  it('con CAMELOT, el Paso 3 y el Paso 4 abren cada uno su video (#426)', async () => {
    const wrapper = await mountWith(true)
    expect(stepVideoIds(wrapper)).toEqual(['1250351037', '1250454397'])
    wrapper.destroy()
  })

  it('el video general de My Data no cambia, con o sin CAMELOT', async () => {
    for (const camelot of [true, false]) {
      const wrapper = await mountWith(camelot)
      expect(addDataVideoId(wrapper)).toBe('449265292')
      wrapper.destroy()
    }
  })

  it('sin CAMELOT, los videos de CAMELOT no aparecen', async () => {
    const wrapper = await mountWith(false)
    const ids = wrapper.findAll('videohelp-stub').wrappers.map(w => w.attributes('urlid'))
    expect(ids).not.toContain('1250351037')
    expect(ids).not.toContain('1250454397')
    wrapper.destroy()
  })
})
