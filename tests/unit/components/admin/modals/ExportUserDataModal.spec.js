import { shallowMount, createLocalVue } from '@vue/test-utils'
import ExportUserDataModal from '@/components/admin/modals/ExportUserDataModal.vue'
import { downloadUserDataAsAdmin } from '@/services/personalDataExport'

jest.mock('@/services/personalDataExport', () => ({
  downloadUserDataAsAdmin: jest.fn(() => Promise.resolve())
}))

const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const user = { id: 'user_abc', username: 'ana@test.com', first_name: 'Ana', last_name: 'Pérez', active: false }

const makeWrapper = () => {
  const wrapper = shallowMount(ExportUserDataModal, {
    localVue,
    propsData: { user },
    mocks: { $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key },
    stubs: { 'b-modal': { template: '<div><slot /></div>' } }
  })
  wrapper.vm.$refs.modal = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

// Un superadmin entrega la copia de los datos de alguien que no puede entrar (Art. 12.3).
// Antes de generarla tiene que haber verificado que quien la pide es la titular (Art. 12.6).
describe('ExportUserDataModal.vue', () => {
  beforeEach(() => jest.clearAllMocks())

  it('nombra a la persona y pide declarar la verificación de identidad', () => {
    const wrapper = makeWrapper()
    expect(wrapper.text()).toContain('admin.export_data_intro')
    expect(wrapper.text()).toContain('Ana Pérez')
    expect(wrapper.text()).toContain('admin.export_data_identity_verified')
  })

  it('no se puede generar sin la verificación ni la contraseña', async () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.canSubmit).toBe(false)
    wrapper.setData({ identityVerified: true })
    expect(wrapper.vm.canSubmit).toBe(false)
    wrapper.setData({ password: 'x' })
    expect(wrapper.vm.canSubmit).toBe(true)

    wrapper.setData({ identityVerified: false })
    await wrapper.vm.confirm()
    expect(downloadUserDataAsAdmin).not.toHaveBeenCalled()
  })

  it('descarga la copia de esa persona con la contraseña del admin y cierra', async () => {
    const wrapper = makeWrapper()
    wrapper.setData({ identityVerified: true, password: 'clave-admin' })

    await wrapper.vm.confirm()
    await flushPromises()

    expect(downloadUserDataAsAdmin).toHaveBeenCalledWith('user_abc', 'clave-admin')
    expect(wrapper.vm.$refs.modal.hide).toHaveBeenCalled()
    expect(wrapper.emitted('exported')[0]).toEqual(['user_abc'])
  })

  it('muestra el mensaje del servidor si falla y no cierra', async () => {
    downloadUserDataAsAdmin.mockRejectedValueOnce(Object.assign(new Error('x'), { backendMessage: 'Incorrect password' }))
    const wrapper = makeWrapper()
    wrapper.setData({ identityVerified: true, password: 'mala' })

    await wrapper.vm.confirm()
    await flushPromises()

    expect(wrapper.vm.error).toBe('Incorrect password')
    expect(wrapper.vm.$refs.modal.hide).not.toHaveBeenCalled()
    expect(wrapper.vm.isLoading).toBe(false)
  })

  it('sin mensaje del servidor muestra uno genérico', async () => {
    downloadUserDataAsAdmin.mockRejectedValueOnce(Object.assign(new Error('x'), { backendMessage: null }))
    const wrapper = makeWrapper()
    wrapper.setData({ identityVerified: true, password: 'x' })

    await wrapper.vm.confirm()
    await flushPromises()

    expect(wrapper.vm.error).toBe('admin.export_data_error')
  })

  it('al cerrarse olvida la contraseña y la casilla', () => {
    const wrapper = makeWrapper()
    wrapper.setData({ identityVerified: true, password: 'clave-admin', error: 'algo' })
    wrapper.vm.reset()
    expect(wrapper.vm.password).toBe('')
    expect(wrapper.vm.identityVerified).toBe(false)
    expect(wrapper.vm.error).toBe('')
  })
})
