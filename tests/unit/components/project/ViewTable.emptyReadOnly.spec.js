import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ViewTable from '@/components/project/ViewTable.vue'

jest.mock('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// #242: con la tabla vacía, quien sólo lee ve «No hay hallazgos» sin el enlace para
// agregar uno (abría el modal y el guardado fallaba: parecía tener permisos).
describe('ViewTable — tabla vacía según permisos', () => {
  const mountTable = (canEdit) => mount(ViewTable, {
    localVue,
    propsData: {
      lists: [],
      list_categories: { options: [], selected: null },
      fields: { with_categories: [], without_categories: [{ key: 'name' }] },
      project: { id: 'proj1' },
      references: [],
      refs: [],
      isBusy: false,
      mode: 'edit',
      canEdit
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs: { videoHelp: true }
  })

  it('quien sólo lee ve el mensaje sin el enlace para agregar', () => {
    const wrapper = mountTable(false)
    // Clave propia: `no_findings` termina en coma porque espera el enlace a continuación.
    expect(wrapper.text()).toContain('soqf_table.no_findings_readonly')
    expect(wrapper.text()).not.toContain('soqf_table.add_review_finding')
    wrapper.destroy()
  })

  it('quien edita ve el enlace y abre el alta', async () => {
    const wrapper = mountTable(true)
    const link = wrapper.findAll('a').filter(a => a.text().includes('soqf_table.add_review_finding'))
    expect(link.length).toBe(1)
    await link.at(0).trigger('click')
    expect(wrapper.emitted('add-list')).toBeTruthy()
    wrapper.destroy()
  })
})
