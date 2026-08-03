
import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  put: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('vuedraggable', () => ({
  render: h => h('div')
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('viewProject.vue — offline behavior', () => {
  let wrapper
  let mockNotify
  let Api

  beforeEach(async () => {
    Api = require('@/utils/Api')
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })

    mockNotify = {
      success: jest.fn(),
      error: jest.fn(),
      warning: jest.fn()
    }

    wrapper = shallowMount(viewProject, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
        $notify: mockNotify
      },
      stubs: {
        'action-buttons': true,
        'propertiesProject': true,
        'UploadReferences': true,
        'InclusionExclusioCriteria': true,
        'crudTables': true,
        'PrintViewTable': true,
        'ViewTable': true,
        'CamelotStepThree': true,
        'CamelotStepFour': true,
        'videoHelp': true,
        'back-to-top': true,
        'content-guidance': true
      }
    })

    // Wait for mounted() to finish
    await flushPromises()
    jest.clearAllMocks()
  })

  afterEach(() => {
    wrapper.destroy()
  })

  describe('getProject()', () => {
    it('shows an offline warning when project is not cached (first time offline)', async () => {
      const offlineError = {
        isOfflineError: true,
        message: 'No internet connection and no cached data available for /isoqf_projects/proj1',
        response: { status: 0, statusText: 'Offline', data: { offline: true } },
        request: {}
      }
      Api.get.mockRejectedValueOnce(offlineError)

      await wrapper.vm.getProject()
      await flushPromises()

      expect(mockNotify.warning).toHaveBeenCalledWith('offline.projectNotCached')
    })

    it('does not show an offline warning when project loads successfully', async () => {
      Api.get.mockResolvedValueOnce({ data: { id: 'proj1', name: 'Test Project' } })

      await wrapper.vm.getProject()
      await flushPromises()

      expect(mockNotify.warning).not.toHaveBeenCalled()
    })

    it('does not show an offline warning for regular server errors (4xx, 5xx)', async () => {
      const serverError = {
        response: { status: 403, statusText: 'Forbidden', data: { message: 'Access denied' } }
      }
      Api.get.mockRejectedValueOnce(serverError)

      await wrapper.vm.getProject()
      await flushPromises()

      expect(mockNotify.warning).not.toHaveBeenCalled()
    })

    it('does not show an offline warning when project loads from cache', async () => {
      Api.get.mockResolvedValueOnce({
        data: { id: 'proj1', name: 'Cached Project' },
        fromCache: true,
        status: 200
      })

      await wrapper.vm.getProject()
      await flushPromises()

      expect(mockNotify.warning).not.toHaveBeenCalled()
    })
  })
})
