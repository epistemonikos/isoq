import { mount, createLocalVue } from '@vue/test-utils'
import ViewOrganization from '@/components/organization/viewOrganization.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import en from '@/lang/en.json'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)
localVue.use(VueI18n)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService')

// #417: el banner anuncia CAMELOT y lleva a su sección del About.
function build () {
  const store = new Vuex.Store({ state: { user: { personal_organization: 'org-123', id: 'user-1' }, isOnline: true } })
    const wrapper = mount(ViewOrganization, {
      localVue,
      store,
      i18n: new VueI18n({ locale: 'en', messages: { en } }),
      stubs: {
        'router-link': { props: ['to'], template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>' },
        'b-table': true,
        'b-modal': true
      },
    mocks: { $route: { params: { id: 'org-123' }, query: {} }, $router: { push: jest.fn() } }
  })
  return wrapper
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

describe('viewOrganization.vue — banner de CAMELOT', () => {
  beforeEach(() => localStorage.clear())

  it('muestra el texto centrado y enlaza a About#camelot', () => {
    const wrapper = build()
    const banner = wrapper.find('[data-test="camelot-banner"]')
    expect(banner.exists()).toBe(true)
    expect(banner.classes()).toContain('text-center')
    expect(banner.text()).toContain('iSoQ now includes the option to use the CAMELOT tool')
    const link = banner.find('.router-link')
    expect(link.text()).toBe(en.organization.camelot_banner_link)
    expect(JSON.parse(link.attributes('data-to'))).toEqual({ name: 'About', hash: '#camelot' })
    wrapper.destroy()
  })

  it('se puede cerrar y queda recordado', async () => {
    const wrapper = build()
    await wrapper.find('[data-test="camelot-banner"] button.close').trigger('click')
    await flush()
    expect(wrapper.find('[data-test="camelot-banner"]').exists()).toBe(false)
    wrapper.destroy()

    const again = build()
    await flush()
    expect(again.find('[data-test="camelot-banner"]').exists()).toBe(false)
    again.destroy()
  })
})
