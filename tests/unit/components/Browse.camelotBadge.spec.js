import { mount, createLocalVue } from '@vue/test-utils'
import Browse from '@/components/Browse.vue'
import BootstrapVue from 'bootstrap-vue'
const Api = require('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({ get: jest.fn().mockResolvedValue({ data: [] }) }))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// En Browse no había forma de distinguir un proyecto CAMELOT de uno que no lo es.
// Se marca igual que en el workspace (viewOrganization.vue): el logo junto al nombre.
describe('Browse — marca los proyectos CAMELOT', () => {
  beforeEach(() => jest.clearAllMocks())

  const mountIt = () => mount(Browse, {
    localVue,
    mocks: { $t: (k) => k },
    stubs: { 'b-link': { template: '<a><slot /></a>' } }
  })

  it('el logo aparece sólo en la fila del proyecto CAMELOT', async () => {
    Api.get.mockResolvedValueOnce({
      data: [
        { id: 'a', name: 'Con CAMELOT', use_camelot: true, last_update: 0 },
        { id: 'b', name: 'Sin CAMELOT', use_camelot: false, last_update: 0 },
        { id: 'c', name: 'Sin campo', last_update: 0 }
      ]
    })
    const wrapper = mountIt()
    for (let i = 0; i < 3; i++) await flushPromises()

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    const byName = name => rows.wrappers.find(r => r.text().includes(name))
    expect(byName('Con CAMELOT').find('[data-test="browse-camelot-badge"]').exists()).toBe(true)
    expect(byName('Sin CAMELOT').find('[data-test="browse-camelot-badge"]').exists()).toBe(false)
    expect(byName('Sin campo').find('[data-test="browse-camelot-badge"]').exists()).toBe(false)
    wrapper.destroy()
  })
})
