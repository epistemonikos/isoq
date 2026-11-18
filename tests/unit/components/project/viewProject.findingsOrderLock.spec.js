import { mount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const flushDeep = async () => { for (let i = 0; i < 5; i++) await flushPromises() }

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquireRef: jest.fn(),
  releaseRef: jest.fn(),
  probeRefLocks: jest.fn().mockResolvedValue({ locks: [], reachable: true, enabled: true })
}))

// El mock rinde un div: así los atributos que no son props (`disabled`) quedan a la vista.
jest.mock('vuedraggable', () => ({ render (h) { return h('div', { attrs: { 'data-testid': 'draggable' } }, this.$slots.default) } }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Un b-modal que dibuja el cuerpo y un botón Save con su `ok-disabled` real; el clic emite
// `ok` con un evento cancelable, como el de verdad.
const ModalStub = {
  props: ['okDisabled'],
  methods: { hide: jest.fn(), show: jest.fn() },
  render (h) {
    const okEvent = { defaultPrevented: false, preventDefault () { this.defaultPrevented = true } }
    return h('div', { attrs: { id: this.$attrs.id } }, [
      this.$slots.default,
      h('button', {
        attrs: { 'data-testid': `ok-${this.$attrs.id}`, disabled: this.okDisabled },
        on: { click: () => this.$emit('ok', okEvent) }
      }, 'ok')
    ])
  }
}

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true,
  'b-modal': ModalStub
}

const F1 = { id: 'l1', name: 'Finding uno', sort: 1 }
const F2 = { id: 'l2', name: 'Finding dos', sort: 2 }
const NEW = { id: 'l3', name: 'Finding nuevo', sort: 3 }

// Las afirmaciones van sobre el DOM renderizado: un estado correcto que la plantilla no
// dibuja ya pasó revisión y suite dos veces en este repositorio.
describe('viewProject.vue — modal de reordenar con el lock del orden', () => {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  let serverLists

  async function abrirModal (acquireResult) {
    LockService.acquireRef.mockResolvedValue(acquireResult)
    const wrapper = mount(viewProject, {
      localVue,
      mocks: {
        $t: (key, params) => (params && params.user ? `${key}|${params.user}` : key),
        $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { personal_organization: 'org1', id: 1 }, isOnline: true } },
        $notify,
        isOnline: true
      },
      stubs
    })
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'processLists').mockImplementation(async (response) => response.data)
    Api.get.mockImplementation((url) => Promise.resolve({ data: String(url).includes('isoqf_lists') ? serverLists.map(l => ({ ...l })) : [] }))
    // El botón de reordenar sólo existe con 2+ findings y en modo edición.
    await wrapper.setData({ lists: [F1, F2], mode: 'edit' })
    wrapper.vm.modalSortFindings()
    await wrapper.vm.onSortModalShow()
    await flushPromises()
    await wrapper.vm.$nextTick()
    return wrapper
  }

  const okButton = (wrapper) => wrapper.find('[data-testid="ok-modal-sort-findings"]')
  const alertText = (wrapper) => wrapper.find('[data-testid="findings-order-lock-alert"]').text()

  beforeEach(() => {
    jest.clearAllMocks()
    serverLists = [F1, F2]
  })

  it('al abrir pide el lock findings_order del proyecto', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'findings_order')
    wrapper.destroy()
  })

  it('con el lock: sin cartel, Save habilitado y se puede arrastrar', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(wrapper.find('[data-testid="findings-order-lock-alert"]').exists()).toBe(false)
    expect(okButton(wrapper).attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="draggable"]').attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('tomado por otra persona: cartel con su nombre, Save deshabilitado y sin arrastre', async () => {
    const wrapper = await abrirModal({ success: false, lockedBy: 'Ana Pérez', reason: 'locked_by_other_user' })
    expect(alertText(wrapper)).toBe('lock.findings_order_locked_by|Ana Pérez')
    expect(okButton(wrapper).attributes('disabled')).toBe('disabled')
    expect(wrapper.find('[data-testid="draggable"]').attributes('disabled')).toBe('disabled')
    expect(wrapper.text()).toContain('Finding uno')
    wrapper.destroy()
  })

  it('guardar escribe 1..N en el orden elegido y cierra', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.sorted_lists = [F2, F1]
    const hide = jest.spyOn(wrapper.vm.$refs['modal-sort-findings'], 'hide')

    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect(Api.patch.mock.calls).toEqual([['/isoqf_lists/l2', { sort: 1 }], ['/isoqf_lists/l1', { sort: 2 }]])
    expect(hide).toHaveBeenCalled()
    expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    wrapper.destroy()
  })

  it('si otra persona creó un finding mientras tanto: no guarda, lo agrega al final y avisa', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.sorted_lists = [F2, F1]
    serverLists = [F1, F2, NEW]
    const hide = jest.spyOn(wrapper.vm.$refs['modal-sort-findings'], 'hide')

    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(hide).not.toHaveBeenCalled()
    expect(wrapper.vm.sorted_lists.map(l => l.id)).toEqual(['l2', 'l1', 'l3'])
    expect(wrapper.find('[data-testid="findings-order-changed"]').text()).toBe('lock.findings_order_changed')
    expect(wrapper.text()).toContain('Finding nuevo')
    wrapper.destroy()
  })

  it('al volver a guardar sobre la lista ya actualizada, el aviso de lista cambiada se va', async () => {
    const wrapper = await abrirModal({ success: true })
    serverLists = [F1, F2, NEW]
    await okButton(wrapper).trigger('click')
    await flushDeep()
    expect(wrapper.find('[data-testid="findings-order-changed"]').exists()).toBe(true)

    // Segundo intento: la lista ya coincide con el servidor. Lo rechaza otra persona, y el
    // único aviso que corresponde es el del lock, no el de una lista que ya no cambió.
    Api.patch.mockRejectedValue({ response: { status: 409, data: { reason: 'locked_by_other_user', locked_by: 'Ana' } } })
    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect(wrapper.find('[data-testid="findings-order-changed"]').exists()).toBe(false)
    expect(alertText(wrapper)).toBe('lock.findings_order_lost_to|Ana')
    wrapper.destroy()
  })

  it('si otra persona borró uno: lo saca y avisa sin escribir', async () => {
    const wrapper = await abrirModal({ success: true })
    serverLists = [F2]

    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.sorted_lists.map(l => l.id)).toEqual(['l2'])
    expect(wrapper.find('[data-testid="findings-order-changed"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('un 404 entre la relectura y el PATCH no es un error: ya no está', async () => {
    const wrapper = await abrirModal({ success: true })
    Api.patch.mockImplementation((url) => (url.endsWith('l1')
      ? Promise.reject({ response: { status: 404, data: { status: 'error' } } }) // eslint-disable-line prefer-promise-reject-errors
      : Promise.resolve({ data: {} })))

    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect($notify.error).not.toHaveBeenCalled()
    expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    wrapper.destroy()
  })

  it('el 409 del servidor muestra el cartel, no un error genérico, y deja el modal abierto', async () => {
    const wrapper = await abrirModal({ success: true })
    Api.patch.mockRejectedValue({
      config: { url: '/isoqf_lists/l1', method: 'patch' },
      response: { status: 409, data: { status: false, reason: 'locked_by_other_user', locked_by: 'Ana' } }
    })
    const hide = jest.spyOn(wrapper.vm.$refs['modal-sort-findings'], 'hide')

    await okButton(wrapper).trigger('click')
    await flushDeep()

    expect(alertText(wrapper)).toBe('lock.findings_order_lost_to|Ana')
    expect($notify.error).not.toHaveBeenCalled()
    expect(hide).not.toHaveBeenCalled()
    expect(okButton(wrapper).attributes('disabled')).toBe('disabled')
    wrapper.destroy()
  })

  it('con el lock arma el reloj de inactividad; al expirar suelta, avisa y deja retomar', async () => {
    const wrapper = await abrirModal({ success: true })
    expect(wrapper.vm.lastInactivityActivityAt()).not.toBeNull()

    wrapper.vm.onInactivityExpired(Date.now())
    await wrapper.vm.$nextTick()
    expect(LockService.releaseRef).toHaveBeenCalledWith('findings_order')
    expect(alertText(wrapper)).toContain('lock.findings_order_released_idle')
    expect(okButton(wrapper).attributes('disabled')).toBe('disabled')

    await wrapper.find('[data-testid="findings-order-lock-resume"]').trigger('click')
    await flushDeep()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="findings-order-lock-alert"]').exists()).toBe(false)
    expect(okButton(wrapper).attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('al cerrar suelta el lock y apaga el reloj', async () => {
    const wrapper = await abrirModal({ success: true })
    wrapper.vm.onSortModalHidden()
    await wrapper.vm.$nextTick()
    expect(LockService.releaseRef).toHaveBeenCalledWith('findings_order')
    expect(wrapper.vm.lastInactivityActivityAt()).toBeNull()
    wrapper.destroy()
  })
})
