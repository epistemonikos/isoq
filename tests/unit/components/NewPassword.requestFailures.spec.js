import { shallowMount } from '@vue/test-utils'
import NewPassword from '@/components/NewPassword'

jest.mock('@/utils/Api', () => ({ post: jest.fn() }))
const Api = require('@/utils/Api')

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const mountIt = () => shallowMount(NewPassword, {
  mocks: { $t: (key) => key, $route: { params: { token: 't', username: 'ana@example.com' } }, $router: { push: jest.fn() } }
})
const visibleAlerts = (wrapper) => wrapper.findAll('b-alert')
  .filter(a => a.attributes('show') === 'true').wrappers.map(a => a.text())

describe('NewPassword — si el cambio no se envía, lo dice en el banner', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sin respuesta', async () => {
    const wrapper = mountIt()
    await wrapper.setData({ password: 'unaClaveLarga1', repassword: 'unaClaveLarga1' })
    Api.post.mockRejectedValueOnce(Object.assign(new Error('offline'), { isOfflineError: true, response: { status: 0 } }))
    wrapper.vm.changePassword()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.connection_failed')
  })

  it('un 5xx', async () => {
    const wrapper = mountIt()
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    wrapper.vm.changePassword()
    await flushPromises()
    expect(visibleAlerts(wrapper).join(' ')).toContain('common.server_failed')
  })

  // Cerrar el banner llamaba a `cleanVars`, que borra las contraseñas: está bien tras un
  // token inválido, pero tras un fallo de envío obligaría a escribirlas de nuevo para reintentar.
  it('cerrar el aviso de un fallo de envío no borra lo escrito', async () => {
    const wrapper = mountIt()
    await wrapper.setData({ password: 'unaClaveLarga1', repassword: 'unaClaveLarga1' })
    Api.post.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: {} } }))
    wrapper.vm.changePassword()
    await flushPromises()
    wrapper.vm.cleanVars()
    await flushPromises()
    expect(wrapper.vm.password).toBe('unaClaveLarga1')
    expect(visibleAlerts(wrapper)).toEqual([])
  })
})
