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
  create: jest.fn()
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

  // PATCH /api/publish puede responder 200 y dejar el proyecto PRIVADO: si tras escribir ninguna
  // lista queda visible, el server lo despublica. El cuerpo viaja en `response.data.data`
  // (Project.update espacia la respuesta de axios), y el form debe mostrar lo guardado, no lo enviado.
  it('shows what the server kept when the 200 comes back private (publish gate #169)', async () => {
    const { wrapper, $notify } = createWrapper({
      formData: { id: 'proj1', public_type: 'fully', private: false, is_public: true }
    })
    Project.update.mockResolvedValue({
      data: { status: 200, data: { id: 'proj1', public_type: 'private', private: true, is_public: false } }
    })

    await wrapper.vm.executeSave({ id: 'proj1', public_type: 'fully', private: false, is_public: true })

    expect($notify.warning).toHaveBeenCalledWith('project.notifications.project_unpublished_after_save')
    expect($notify.success).not.toHaveBeenCalled()
    expect(wrapper.vm.originalFormData.public_type).toBe('private')
    expect(wrapper.emitted('update-form-data')[0][0].public_type).toBe('private')
  })

  it('a 200 that keeps the project public is a plain success (regression)', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockResolvedValue({
      data: { status: 200, data: { id: 'proj1', public_type: 'fully', private: false, is_public: true } }
    })

    await wrapper.vm.executeSave({ id: 'proj1', public_type: 'fully', private: false, is_public: true })

    expect($notify.success).toHaveBeenCalledWith('project.notifications.project_updated')
    expect($notify.warning).not.toHaveBeenCalled()
  })

  // Sin red, la cola offline responde sin cuerpo del servidor: no hay nada que comparar.
  it('a queued write without a server body is a plain success (regression)', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockResolvedValue({ data: { status: true, queued: true } })

    await wrapper.vm.executeSave({ id: 'proj1', public_type: 'fully', private: false, is_public: true })

    expect($notify.success).toHaveBeenCalledWith('project.notifications.project_updated')
    expect($notify.warning).not.toHaveBeenCalled()
  })

  // La genérica de isoqf_projects no publica (S3): el 400 trae un `message` interno; el aviso
  // tiene que decir dónde se publica, no mostrar ese texto crudo.
  it('a 400 publish_via_publish_endpoint shows the publish-button notice, not the raw server message', async () => {
    const { wrapper, $notify } = createWrapper()
    Project.update.mockRejectedValue({
      response: { status: 400, data: { reason: 'publish_via_publish_endpoint', message: 'raw server text' } }
    })

    await wrapper.vm.executeSave({ id: 'proj1', name: 'Updated name' })

    expect($notify.error).toHaveBeenCalledWith('publish.via_publish_endpoint')
    expect($notify.error).not.toHaveBeenCalledWith('raw server text')
  })
})
