import { shallowMount, createLocalVue } from '@vue/test-utils'
import organizationForm from '@/components/organization/organizationForm.vue'
import Project from '@/utils/project'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/utils/project', () => ({
  update: jest.fn(),
  create: jest.fn(),
  validEmail: jest.fn(() => true),
  validUrl: jest.fn(() => true)
}))

const localVue = createLocalVue()

function createWrapper (overrideProps = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(organizationForm, {
    localVue,
    propsData: {
      formData: { id: 'proj1', use_camelot: true },
      canEdit: true,
      ...overrideProps
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $notify
    },
    stubs: { videoHelp: true }
  })
  return { wrapper, $notify }
}

describe('organizationForm.vue — executeSave() error handling', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows the permissions-revoked toast on a 403, not the generic error message', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockRejectedValue({ response: { status: 403, data: { message: 'Forbidden' } } })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.error).toHaveBeenCalledWith('lock.permissions_revoked')
    expect($notify.error).toHaveBeenCalledTimes(1)
  })

  // Dentro del proyecto viewProject reclama `permission-denied` y lo avisa él: un segundo
  // toast con el mismo texto sería el mismo evento dos veces.
  it('calla el 403 que ya avisó la pantalla dueña (permissionDeniedAnnounced)', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockRejectedValue({
      response: { status: 403, data: { message: 'Forbidden' } }, permissionDeniedAnnounced: true
    })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.error).not.toHaveBeenCalled()
  })

  // Sin conexión el alta no se encola: Api.js ya disparó `offline-write-blocked` y
  // OfflineIndicator lo avisa. El `data.message` del error es un texto interno de Api.js.
  it('sin conexión no suma un toast con el texto interno de Api.js', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockRejectedValue({
      isOfflineError: true,
      response: { status: 0, data: { message: 'No internet connection and no cached data available for /isoqf_projects', offline: true } }
    })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.error).not.toHaveBeenCalled()
  })

  it('still shows the generic message-based error for a non-403 failure (regression)', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockRejectedValue({ response: { status: 500, data: { message: 'Server error' } } })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.error).toHaveBeenCalledWith('Server error')
  })

  it('still shows success on a normal save (regression)', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockResolvedValue({ data: { status: true } })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.success).toHaveBeenCalledWith('project.notifications.project_updated')
    expect($notify.error).not.toHaveBeenCalled()
  })
})
