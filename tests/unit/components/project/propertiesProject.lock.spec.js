import { shallowMount } from '@vue/test-utils'
import LockService from '@/services/lockService'
import propertiesProject from '@/components/project/propertiesProject.vue'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), fetchRefLocks: jest.fn(() => Promise.resolve([])) }
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const KEY = 'project_properties'

function mountTab (propsData) {
  return shallowMount(propertiesProject, {
    propsData: { project: { id: 'p1' }, canEdit: true, active: false, refresh: jest.fn(() => Promise.resolve()), ...propsData },
    mocks: { $t: k => k, $store: { state: { user: { id: 'u-me' } } } },
    stubs: { organizationForm: true, PropertiesLockAlert: true, InactivityWarning: true }
  })
}

beforeEach(() => { jest.clearAllMocks() })

describe('pestaña Propiedades — lock', () => {
  it('montada oculta (d-none) no pide el lock', async () => {
    const w = mountTab({ active: false })
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    w.destroy()
  })

  it('al entrar a la pestaña pide el lock y habilita el formulario sólo con él', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountTab()
    await w.setProps({ active: true })
    await flushPromises()
    expect(LockService.acquireRef).toHaveBeenCalledWith('p1', KEY)
    expect(w.vm.formEditable).toBe(true)
    w.destroy()
  })

  it('denegado: formulario en solo lectura y cartel con el estado', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const w = mountTab()
    await w.setProps({ active: true })
    await flushPromises()
    expect(w.vm.formEditable).toBe(false)
    const alert = w.find('propertieslockalert-stub')
    expect(alert.attributes('status')).toBe('denied')
    expect(alert.attributes('lockedby')).toBe('Ana')
    w.destroy()
  })

  it('al salir de la pestaña suelta', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountTab()
    await w.setProps({ active: true })
    await flushPromises()
    await w.setProps({ active: false })
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    w.destroy()
  })

  it('sin permiso de edición no pide el lock', async () => {
    const w = mountTab({ canEdit: false })
    await w.setProps({ active: true })
    await flushPromises()
    expect(LockService.acquireRef).not.toHaveBeenCalled()
    w.destroy()
  })

  it('al tener el lock arma el reloj de inactividad; al expirar suelta', async () => {
    LockService.acquireRef.mockResolvedValue({ success: true })
    const w = mountTab()
    const start = jest.spyOn(w.vm, 'startInactivityWatch')
    await w.setProps({ active: true })
    await flushPromises()
    expect(start).toHaveBeenCalled()
    w.vm.onInactivityExpired()
    expect(LockService.releaseRef).toHaveBeenCalledWith(KEY)
    expect(w.vm.propertiesLock.status).toBe('released_idle')
    w.destroy()
  })

  it('el refresco que usa es el prop refresh', async () => {
    const refresh = jest.fn(() => Promise.resolve())
    const w = mountTab({ refresh })
    await w.vm.refreshBeforePropertiesLock()
    expect(refresh).toHaveBeenCalled()
    w.destroy()
  })
})
