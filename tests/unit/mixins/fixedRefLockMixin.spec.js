import { shallowMount } from '@vue/test-utils'
import Vue from 'vue'
import LockService from '@/services/lockService'
import createFixedRefLockMixin from '@/mixins/fixedRefLockMixin'

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { acquireRef: jest.fn(), releaseRef: jest.fn(), probeRefLocks: jest.fn() }
}))

// viewProject mezcla DOS instancias de la fábrica. Lo que se fija acá es que no se pisen:
// cada una con sus nombres, su estado privado y su clave.
const Host = {
  mixins: [
    createFixedRefLockMixin({ name: 'Alpha', key: 'alpha_key' }),
    createFixedRefLockMixin({ name: 'BetaGamma', key: 'beta_key' })
  ],
  template: '<div />',
  methods: {
    alphaLockProjectId () { return 'p1' },
    betaGammaLockProjectId () { return 'p1' },
    refreshBeforeAlphaLock () { return Promise.resolve() },
    refreshBeforeBetaGammaLock () { return Promise.resolve() }
  }
}

let wrapper
beforeEach(() => {
  jest.clearAllMocks()
  LockService.acquireRef.mockResolvedValue({ success: true })
  wrapper = shallowMount(Host, { mocks: { $store: { state: Vue.observable({ user: { id: 'u' }, isOnline: true }) } } })
})
afterEach(() => wrapper.destroy())

describe('createFixedRefLockMixin — dos instancias en el mismo componente', () => {
  it('genera los nombres a partir de `name`', () => {
    expect(wrapper.vm.alphaLock).toEqual({ status: 'idle', lockedBy: null })
    expect(wrapper.vm.betaGammaLock).toEqual({ status: 'idle', lockedBy: null })
    expect(typeof wrapper.vm.enterBetaGammaLock).toBe('function')
    expect(wrapper.vm.betaGammaLockHeld).toBe(false)
  })

  it('cada una pide su propia clave', async () => {
    await wrapper.vm.enterAlphaLock()
    expect(LockService.acquireRef).toHaveBeenCalledWith('p1', 'alpha_key')
    expect(wrapper.vm.alphaLockHeld).toBe(true)
    expect(wrapper.vm.betaGammaLockHeld).toBe(false)
  })

  it('salir de una no suelta la otra', async () => {
    await wrapper.vm.enterAlphaLock()
    await wrapper.vm.enterBetaGammaLock()
    wrapper.vm.leaveAlphaLock()
    expect(LockService.releaseRef).toHaveBeenCalledTimes(1)
    expect(LockService.releaseRef).toHaveBeenCalledWith('alpha_key')
    expect(wrapper.vm.betaGammaLockHeld).toBe(true)
  })

  it('ref-lock-lost de una clave sólo afecta a su instancia', async () => {
    await wrapper.vm.enterAlphaLock()
    await wrapper.vm.enterBetaGammaLock()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: 'beta_key', lockedBy: 'Ana' } }))
    expect(wrapper.vm.betaGammaLock).toEqual({ status: 'lost', lockedBy: 'Ana' })
    expect(wrapper.vm.alphaLock.status).toBe('held')
  })

  it('expirar una no toca la otra', async () => {
    await wrapper.vm.enterAlphaLock()
    wrapper.vm.expireBetaGammaLock()
    expect(wrapper.vm.alphaLock.status).toBe('held')
    expect(wrapper.vm.betaGammaLock.status).toBe('idle')
    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('al desmontar suelta las dos', async () => {
    await wrapper.vm.enterAlphaLock()
    await wrapper.vm.enterBetaGammaLock()
    wrapper.destroy()
    expect(LockService.releaseRef).toHaveBeenCalledWith('alpha_key')
    expect(LockService.releaseRef).toHaveBeenCalledWith('beta_key')
    wrapper = shallowMount({ template: '<div />' })
  })
})
