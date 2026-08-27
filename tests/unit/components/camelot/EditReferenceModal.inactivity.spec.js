import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import EditReferenceModal from '@/components/camelot/EditReferenceModal.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

/**
 * El temporizador de inactividad cableado al editor del Paso 3.
 *
 * Lo que estos tests fijan, más allá de que el reloj arranque: el ORDEN. El `@hidden` del
 * modal suelta el lock, así que un guardado disparado después viajaría sin lock y volvería
 * 409. Persistir primero, cerrar después.
 */

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    isEnabled: true,
    acquireRef: jest.fn().mockResolvedValue({ success: true }),
    releaseRef: jest.fn(),
    refLocks: new Map()
  }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return shallowMount(EditReferenceModal, {
    localVue,
    propsData: {
      reference: { id: 'R1', authors: 'Autor 2020' },
      charsData: { id: 'chars1', items: [{ ref_id: 'R1' }], fields: [] },
      camelot: {}
    },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

/**
 * Monta y abre el editor con el lock concedido, dejando el reloj armado.
 *
 * El espía de `$bvModal.hide` se pone DESPUÉS de montar: `localVue.use(BootstrapVue)`
 * instala un `$bvModal` real que pisa el de `mocks`, así que espiar antes no sirve.
 */
async function opened () {
  const wrapper = createWrapper()
  await flushPromises()
  await wrapper.vm.onModalShown()
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  return wrapper
}

beforeEach(() => {
  jest.clearAllMocks()
  LockService.acquireRef.mockResolvedValue({ success: true })
  LockService.isEnabled = true
})
afterEach(() => { jest.useRealTimers() })

describe('EditReferenceModal — armado del temporizador', () => {
  // El bug que casi se cuela: el plan decía gatear con `canEdit`, una prop que este
  // componente NO tiene. `this.canEdit` habría sido undefined y el reloj no arrancaba.
  it('arma el reloj al conseguir el lock, sin depender de una prop canEdit', async () => {
    const wrapper = await opened()
    expect(wrapper.vm.canEdit).toBeUndefined()
    expect(wrapper.vm.$_inactivity).not.toBeNull()
    wrapper.destroy()
  })

  it('no lo arma si otro tiene el estudio', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana' })
    const wrapper = await opened()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  it('no lo arma con el control de concurrencia apagado', async () => {
    LockService.isEnabled = false
    const wrapper = await opened()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  it('lo desarma al cerrar el modal', async () => {
    const wrapper = await opened()
    wrapper.vm.resetModal()
    expect(wrapper.vm.$_inactivity).toBeNull()
    wrapper.destroy()
  })

  it('lo desarma al perder el lock: no hay nada que soltar', async () => {
    const wrapper = await opened()
    window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail: { refId: 'R1', lockedBy: 'Ana' } }))
    await flushPromises()
    expect(wrapper.vm.$_inactivity).toBeNull()
    expect(wrapper.vm.isReadOnly).toBe(true)
    wrapper.destroy()
  })
})

describe('EditReferenceModal — expiración', () => {
  it('persiste ANTES de cerrar: el @hidden suelta el lock', async () => {
    const wrapper = await opened()
    wrapper.vm.customFields = [{ key: 'k1', value: 'texto sin guardar', label: 'L' }]
    wrapper.vm.onFieldChanged()

    wrapper.vm.onInactivityExpired()
    await flushPromises()

    expect(Api.patch).toHaveBeenCalled()
    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalled()
    expect(Api.patch.mock.invocationCallOrder[0])
      .toBeLessThan(wrapper.vm.$bvModal.hide.mock.invocationCallOrder[0])
    wrapper.destroy()
  })

  it('en solo lectura no guarda, pero cierra igual', async () => {
    const wrapper = await opened()
    await wrapper.setData({ isReadOnly: true })
    wrapper.vm.onInactivityExpired()
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('avisa a la persona de que se guardó y se liberó', async () => {
    const wrapper = await opened()
    // Se espera porque el aviso vive en el `finally`, y el guardado que lo precede pasó a
    // ser asíncrono cuando el alta de columna se fue a su propio endpoint. Lo que se
    // verifica es lo mismo: que a la persona se le diga.
    await wrapper.vm.onInactivityExpired()
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.inactivity_released')
    wrapper.destroy()
  })

  // Un flush que revienta no puede dejar el modal abierto reteniendo el lock: sería el
  // peor final para un mecanismo cuyo único propósito es liberarlo.
  it('cierra igual si el guardado lanza una excepción', async () => {
    const wrapper = await opened()
    // `cancel` también hace falta: el cierre pasa por resetModal, que lo llama.
    wrapper.vm.autoSaveDebounced = { flush: () => { throw new Error('boom') }, cancel: jest.fn() }

    // El guardado es asíncrono desde que el alta de columna salió del PATCH del ítem, así
    // que la excepción llega como rechazo. La garantía es la misma —y ahora importa más,
    // porque hay una forma nueva de lanzar: el lock de columnas tomado por otra persona.
    await expect(wrapper.vm.onInactivityExpired()).rejects.toThrow('boom')
    expect(wrapper.vm.$bvModal.hide).toHaveBeenCalled()
    // Y lo que de verdad importa: el lock se soltó pese a la excepción.
    expect(LockService.releaseRef).toHaveBeenCalled()
    wrapper.destroy()
  })
})
