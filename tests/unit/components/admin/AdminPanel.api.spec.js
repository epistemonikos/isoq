import { shallowMount, createLocalVue } from '@vue/test-utils'
import AdminPanel from '@/components/admin/AdminPanel.vue'

const localVue = createLocalVue()

const makeWrapper = () => shallowMount(AdminPanel, {
  localVue,
  mocks: { $t: key => key },
  stubs: {
    'admin-users-tab': true,
    'admin-stats-tab': true,
    'admin-audit-tab': true,
    'b-tabs': true,
    'b-tab': true
  }
})

describe('AdminPanel.vue — tab container', () => {
  it('renders without errors', () => {
    const wrapper = makeWrapper()
    expect(wrapper.exists()).toBe(true)
  })
})
