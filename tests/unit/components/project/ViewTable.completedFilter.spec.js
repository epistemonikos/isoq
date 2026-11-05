import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ViewTable from '@/components/project/ViewTable.vue'

jest.mock('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const base = {
  notes: '', sort: 1, category: null, category_name: '', raw_ref: [], ref_list: '',
  cerqual_option: '', filter_cerqual: '', cerqual_explanation: '', explanation: 'without_explanation',
  status: 'unfinished', references: []
}

const lists = [
  { ...base, id: 'l1', name: 'Alpha finding', sort: 1, status: 'completed', explanation: 'with_explanation', cerqual_option: 'High', filter_cerqual: 'hc', cerqual_explanation: 'Because', references: ['r1'] },
  // High confidence and explained, but without references: not complete.
  { ...base, id: 'l2', name: 'Beta finding no studies', sort: 2, explanation: 'with_explanation', cerqual_option: 'High', filter_cerqual: 'hc', cerqual_explanation: 'Because' }
]

describe('ViewTable — the completed filter', () => {
  const mountTable = () => {
    return mount(ViewTable, {
      localVue,
      propsData: {
        lists,
        list_categories: { options: [], selected: null },
        fields: { with_categories: [], without_categories: [] },
        project: { id: 'proj1' },
        references: [],
        refs: [],
        isBusy: false,
        mode: 'view',
        canEdit: false
      },
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'proj1', org_id: 'org1' } },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs: { videoHelp: true }
    })
  }

  it('the completed filter of the iSoQ table matches complete findings', async () => {
    const wrapper = mountTable()
    expect(wrapper.text()).toContain('Beta finding no studies')

    wrapper.vm.tableFilter('completed', 2)
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Alpha finding')
    expect(wrapper.text()).not.toContain('Beta finding no studies')
    wrapper.destroy()
  })

  it('free text never matches the internal status codes', async () => {
    const wrapper = mountTable()

    for (const typed of ['com', 'ed', 'un', 'fin']) {
      wrapper.vm.table_settings.filter = typed
      await wrapper.vm.$nextTick()
      await wrapper.vm.$nextTick()
      // 'fin' is in both names; the others are only in the status codes.
      const expected = typed === 'fin'
      expect(wrapper.text().includes('Alpha finding')).toBe(expected)
      expect(wrapper.text().includes('Beta finding')).toBe(expected)
    }
    wrapper.destroy()
  })

  it('free text still matches the name, case-insensitively', async () => {
    const wrapper = mountTable()
    wrapper.vm.table_settings.filter = 'NO STUDIES'
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Beta finding no studies')
    expect(wrapper.text()).not.toContain('Alpha finding')
    wrapper.destroy()
  })
})
