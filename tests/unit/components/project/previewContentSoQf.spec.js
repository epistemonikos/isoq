import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentSoQf from '@/components/previewContent/previewContentSoQf.vue'
import Api from '@/utils/Api'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: {} }))
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
    await flushPromises()

    expect(wrapper.vm.project.name).toBe('Test Project')
    expect(wrapper.vm.ui.project.show_criteria).toBe(true)
  })

  it('populates references and findings from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.references).toEqual(BUNDLE.references)
    expect(wrapper.vm.findings).toEqual(BUNDLE.findings)
  })

  it('processes list_categories from bundle', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    const options = wrapper.vm.list_categories.options
    expect(options.some(o => o.id === 'cat1')).toBe(true)
    expect(options.some(o => o.id === null)).toBe(true)
  })

  it('processes lists from bundle (cerqual_option, filter_cerqual)', async () => {
    Api.get.mockResolvedValue({ data: BUNDLE })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()

    expect(wrapper.vm.lists.length).toBe(1)
    expect(wrapper.vm.lists[0].cerqual_option).toBe('High confidence')
    expect(wrapper.vm.lists[0].filter_cerqual).toBe('hc')
  })

  it('redirects to MainPage on 404 (invalid token)', async () => {
    Api.get.mockRejectedValue(new Error('404'))

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: sharedMocks })
    await flushPromises()
    await new Promise(resolve => setTimeout(resolve, 2000))

    expect(sharedMocks.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  }, 10000)

  it('does NOT call loadSharedBundle for public route (old route stays working)', () => {
    Api.get.mockResolvedValue({ data: { sharedToken: 'public', public_type: 'fully' } })

    shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })

    expect(Api.get).not.toHaveBeenCalledWith(expect.stringContaining('/shared/'))
    expect(Api.get).toHaveBeenCalledWith(
      expect.stringContaining('isoqf_projects'),
      expect.any(Object)
    )
  })

  it('redirects to MainPage for a private project loaded via the /browse route', async () => {
    Api.get.mockResolvedValue({ data: { id: 'p1', public_type: 'private' } })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })
    await flushPromises()

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  })

  it('does not treat a leftover project.sharedToken as authorization for a private project', async () => {
    // The project payload can no longer carry sharedToken (backend stopped returning it),
    // but even if a stale value were present it must not grant access on its own.
    Api.get.mockResolvedValue({ data: { id: 'p1', public_type: 'private', sharedToken: 'public' } })

    const wrapper = shallowMount(previewContentSoQf, { localVue, mocks: publicMocks })
    await flushPromises()

    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'MainPage' })
  })
})
