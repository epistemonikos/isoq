import { shallowMount, createLocalVue } from '@vue/test-utils'
import Browse from '@/components/Browse.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({ get: jest.fn().mockResolvedValue({ data: [] }) }))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Si fallaba `/browse`, `isBusy` nunca se apagaba: el spinner giraba para siempre.
describe('Browse — si no se pudo cargar, lo dice y suelta el spinner', () => {
  beforeEach(() => jest.clearAllMocks())

  const mountIt = () => shallowMount(Browse, { localVue, mocks: { $t: (k) => k }, stubs: { 'router-link': true } })

  it('falla: spinner apagado, aviso con Reintentar', async () => {
    Api.get.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } } }))
    const wrapper = mountIt()
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.vm.table_settings.isBusy).toBe(false)
    expect(wrapper.find('[data-test="browse-load-error"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('Reintentar vuelve a pedir y, si sale bien, el aviso se va', async () => {
    Api.get.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } } }))
    const wrapper = mountIt()
    for (let i = 0; i < 3; i++) await flushPromises()
    Api.get.mockResolvedValueOnce({ data: [{ id: 'p1', name: 'Público' }] })
    wrapper.find('[data-test="browse-load-retry"]').trigger('click')
    for (let i = 0; i < 3; i++) await flushPromises()
    expect(wrapper.find('[data-test="browse-load-error"]').exists()).toBe(false)
    expect(wrapper.vm.public_tables).toHaveLength(1)
    wrapper.destroy()
  })
})
