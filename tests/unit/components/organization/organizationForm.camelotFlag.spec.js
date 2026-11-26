import { shallowMount, createLocalVue } from '@vue/test-utils'
import organizationForm from '@/components/organization/organizationForm.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

/**
 * ENABLE_CAMELOT off: an installation launches with the classic methodology only and enables
 * CAMELOT later. Only the entry point is turned off (choosing CAMELOT on creation or switching a
 * project to CAMELOT); a project that is already CAMELOT still shows as such, because the rest of
 * the app decides by `project.use_camelot`.
 */
describe('organizationForm.vue — ENABLE_CAMELOT flag', () => {
  const originalFlag = process.env.ENABLE_CAMELOT

  afterEach(() => {
    process.env.ENABLE_CAMELOT = originalFlag
  })

  function mount (formData) {
    const propsData = { canEdit: true }
    if (formData) propsData.formData = formData
    return shallowMount(organizationForm, {
      localVue: createLocalVue(),
      propsData,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'p1', org_id: 'o1' }, query: {} },
        $router: { push: jest.fn() },
        $notify: { success: jest.fn(), error: jest.fn() }
      },
      stubs: { videoHelp: true }
    })
  }

  it('on: shows the methodology selector', () => {
    process.env.ENABLE_CAMELOT = 'on'
    const wrapper = mount({ name: 'Project' })
    expect(wrapper.find('#input-project-use-camelot').exists()).toBe(true)
  })

  it('off: hides the methodology selector', () => {
    process.env.ENABLE_CAMELOT = 'off'
    const wrapper = mount({ name: 'Project', use_camelot: false })
    expect(wrapper.find('#input-project-use-camelot').exists()).toBe(false)
  })

  it('off: a new project starts without CAMELOT', () => {
    process.env.ENABLE_CAMELOT = 'off'
    const wrapper = mount()
    expect(wrapper.vm.formData.use_camelot).toBe(false)
  })

  it('on: a new project starts with CAMELOT, as before', () => {
    process.env.ENABLE_CAMELOT = 'on'
    const wrapper = mount()
    expect(wrapper.vm.formData.use_camelot).toBe(true)
  })
})
