import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ProjectFormModal from '@/components/organization/modals/ProjectFormModal.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))
jest.mock('@/utils/Api', () => ({ __esModule: true, default: { get: jest.fn() } }))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const KEY = 'project_properties'

describe('ProjectFormModal.vue', () => {
  let wrapper
  const mocks = {
    $t: (msg) => msg,
    $store: { state: { user: { id: 'u-me', personal_organization: 'org-123' } } },
    $route: { params: { id: 'org-123' } }
  }

  function mountModal (propsData) {
    wrapper = shallowMount(ProjectFormModal, {
      localVue,
      mocks,
      propsData: { project: { id: 'test-id', name: 'Test Project' }, canEditProject: true, ...propsData },
      stubs: { PropertiesLockAlert: true }
    })
    wrapper.vm.$refs['new-project'] = { hide: jest.fn(), show: jest.fn() }
    wrapper.vm.$refs['organizationForm'] = { save: jest.fn() }
  }

  beforeEach(() => { jest.clearAllMocks() })
  afterEach(() => { wrapper.destroy() })

  it('abrir un proyecto existente pide el lock de propiedades, NO el de proyecto', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    mountModal()
    wrapper.vm.show()
    await flushPromises()
    expect(LockService.acquireRef).toHaveBeenCalledWith('test-id', KEY)
    expect(wrapper.vm.canEdit).toBe(true)
  })

  it('denegado: solo lectura y cartel con el nombre', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'User A' })
    mountModal()
    wrapper.vm.show()
    await flushPromises()
    expect(wrapper.vm.canEdit).toBe(false)
    expect(wrapper.find('propertieslockalert-stub').attributes('lockedby')).toBe('User A')
  })

  it('un proyecto nuevo (sin id) no pide lock y se puede editar', async () => {
    mountModal({ project: { name: '' } })
    wrapper.vm.show()
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.vm.canEdit).toBe(true)
  })

  it('sin permiso no pide lock', async () => {
    mountModal({ canEditProject: false })
    wrapper.vm.show()
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
  })

  it('cerrar suelta el lock de propiedades y emite cancel', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    mountModal()
    wrapper.vm.show()
    await flushPromises()
    wrapper.vm.closeModalProject()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('refrescar trae el proyecto y lo emite', async () => {
    Api.get.mockResolvedValue({ data: { id: 'test-id', name: 'Nuevo' } })
    mountModal()
    await wrapper.vm.refreshBeforePropertiesLock()
    // networkOnly: una respuesta de la caché nunca muestra el cambio del otro.
    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/test-id', { organization: 'org-123' }, { networkOnly: true })
    expect(wrapper.emitted('project-refreshed')[0][0]).toEqual({ id: 'test-id', name: 'Nuevo' })
  })

  it('un refresco que llega cuando el modal ya muestra OTRO proyecto no lo pisa y rechaza', async () => {
    let answer
    Api.get.mockReturnValue(new Promise(resolve => { answer = resolve }))
    mountModal()
    const refreshing = wrapper.vm.refreshBeforePropertiesLock()
    await wrapper.setProps({ project: { id: 'otro-id', name: 'Q' } })
    answer({ data: { id: 'test-id', name: 'Viejo' } })
    await expect(refreshing).rejects.toThrow()
    expect(wrapper.emitted('project-refreshed')).toBeFalsy()
  })

  it('refrescar que falla rechaza (para que el mixin no tome el lock)', async () => {
    Api.get.mockRejectedValue(new Error('500'))
    mountModal()
    await expect(wrapper.vm.refreshBeforePropertiesLock()).rejects.toThrow('500')
  })

  it('emits project-saved when organizationForm emits modal-notification', () => {
    mountModal()
    wrapper.vm.modalNotification()
    expect(wrapper.emitted('project-saved')).toBeTruthy()
  })

  it('triggers child organizationForm save when ok is clicked', () => {
    mountModal()
    const mockEvent = { preventDefault: jest.fn() }
    wrapper.vm.save(mockEvent)
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(wrapper.vm.$refs['organizationForm'].save).toHaveBeenCalled()
  })

  // El modal de edición de la lista también publica (organizationForm → /api/publish): sin
  // la casilla de datos personales, «Guardar» no se puede pulsar.
  describe('confirmación de datos personales', () => {
    // Con el lock de propiedades tomado: lo que se mide es la casilla, no el lock.
    const mountModalHeld = (propsData) => {
      mountModal(propsData)
      wrapper.vm.propertiesLock = { status: 'held', lockedBy: null }
    }

    it('público sin confirmar: OK deshabilitado', () => {
      mountModalHeld({ project: { id: 'test-id', name: 'Test Project', public_type: 'fully' } })
      expect(wrapper.vm.okDisabled).toBe(true)
    })

    it('público confirmado: OK habilitado', () => {
      mountModalHeld({ project: { id: 'test-id', name: 'Test Project', public_type: 'fully', no_personal_data_confirmed: true } })
      expect(wrapper.vm.okDisabled).toBe(false)
    })

    it('privado: OK habilitado sin la casilla', () => {
      mountModalHeld({ project: { id: 'test-id', name: 'Test Project', public_type: 'private' } })
      expect(wrapper.vm.okDisabled).toBe(false)
    })
  })
})
