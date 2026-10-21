import { shallowMount } from '@vue/test-utils'
import ForgotPassword from '@/components/ForgotPassword'

jest.mock('@/utils/Api', () => ({ post: jest.fn() }))
const Api = require('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const mountIt = () => shallowMount(ForgotPassword, { mocks: { $t: (key) => key } })
const visibleAlerts = (wrapper) => wrapper.findAll('b-alert')
  .filter(a => a.attributes('show') === 'true').wrappers.map(a => a.text())

// El pedido de recuperación que no llegaba terminaba en `console.error`: la persona apretaba
// «Recuperar», no pasaba nada y no sabía si esperar el correo.
describe('ForgotPassword — si la solicitud no se envía, lo dice', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sin respuesta', async () => {
    const wrapper = mountIt()
    await wrapper.setData({ username: 'ana@example.com' })
    Api.post.mockRejectedValueOnce(Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } }))
    wrapper.vm.recoverPass()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.connection_failed')
    // Sigue en el formulario, con el correo escrito, para reintentar.
    expect(wrapper.vm.ui.main).toBe(true)
    expect(wrapper.vm.username).toBe('ana@example.com')
  })

  it('un 5xx', async () => {
    const wrapper = mountIt()
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    wrapper.vm.recoverPass()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.server_failed')
  })

  it('el reintento que sale bien quita el aviso', async () => {
    const wrapper = mountIt()
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    wrapper.vm.recoverPass()
    await flushPromises()
    Api.post.mockResolvedValueOnce({ data: { status: 'sent' } })
    wrapper.vm.recoverPass()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).not.toContain('common.server_failed')
  })
})
