import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentSoQf from '@/components/previewContent/previewContentSoQf.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({
  get: jest.fn()
}))

const BUNDLE = {
  project: { id: 'p1', name: 'Test Project', public_type: 'private', inclusion: '', exclusion: '' },
  lists: [
    {
      id: 'l1', isoqf_id: 1, name: 'Finding 1', sort: 1, category: null,
      notes: '', references: [], cerqual: { option: 0, explanation: 'High confidence reason' },
      evidence_profile: { cerqual: { option: 0, explanation: 'High confidence reason' } }
    }
  ],
  findings: [{ id: 'f1', list_id: 'l1' }],
  references: [{ id: 'ref1', authors: 'Smith', year: '2020', title: 'Study 1' }],
  characteristics: [],
  assessments: [],
  list_categories: [{ id: 'cat1', text: 'Category A', extra_info: '' }]
}

const sharedMocks = {
  $t: (key) => key,
  $route: { name: 'sharedContent', params: { token: 'abc123' } },
  $router: { push: jest.fn() }
}

const publicMocks = {
  $t: (key) => key,
  $route: { name: 'previewContentSoQf', params: { org_id: 'org1', isoqf_id: 'p1', token: 'public' } },
  $router: { push: jest.fn() }
}

describe('previewContentSoQf.vue — bundle mode (/shared/:token)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls GET /shared/:token (not collection endpoints) when route is sharedContent', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })

    expect(Api.get).toHaveBeenCalledWith('/shared/abc123')
    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('isoqf_projects'))
    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('isoqf_lists'))
  })

  it('populates project from bundle data', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.project.name).toBe('Test Project')
    expect(wrapper.vm.ui.project.show_criteria).toBe(true)
  })

  it('populates references and findings from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.references).toEqual(BUNDLE.references)
    expect(wrapper.vm.findings).toEqual(BUNDLE.findings)
  })

  it('processes list_categories from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    const options = wrapper.vm.list_categories.options
    expect(options.some(o => o.id === 'cat1')).toBe(true)
    expect(options.some(o => o.id === null)).toBe(true)
  })

  it('processes lists from bundle (cerqual_option, filter_cerqual)', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.lists.length).toBe(1)
    expect(wrapper.vm.lists[0].cerqual_option).toBe('High confidence')
    expect(wrapper.vm.lists[0].filter_cerqual).toBe('hc')
  })

  it('redirects to MainPage on 404 (invalid token)', async () => {
    Api.get.mockRejectedValue(new Error('404'))

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(sharedMocks.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('does NOT call loadSharedBundle for public route (old route stays working)', () => {
    Api.get.mockResolvedValue({ data: { sharedToken: 'public', public_type: 'fully' } })

    shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })

    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('/shared/'))
    expect(Api.get).toHaveBeenCalledWith(expect.stringContaining('isoqf_projects'))
  })
})
