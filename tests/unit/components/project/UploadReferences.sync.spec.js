import { shallowMount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

function createWrapper (propsOverrides = {}) {
  const wrapper = shallowMount(UploadReferences, {
    localVue,
    propsData: { canEdit: true, references: [], lists: [], ...propsOverrides },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
  jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Author 2020')
  return wrapper
}

// ─── syncAssessments ──────────────────────────────────────────────────────────

describe('UploadReferences.vue — syncAssessments()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('creates new assessment via POST when none exist and refs are provided', async () => {
    Api.get.mockResolvedValue({ data: [] })
    Api.post.mockResolvedValue({ data: {} })

    await wrapper.vm.syncAssessments([{ id: 'r1', authors: ['Smith'] }])

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_assessments',
      expect.objectContaining({
        organization: 'org1',
        project_id: 'proj1',
        items: expect.arrayContaining([
          expect.objectContaining({ ref_id: 'r1' })
        ])
      })
    )
  })

  it('does not POST when no assessments exist and refs is empty', async () => {
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.syncAssessments([])

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('does not PATCH when assessments exist and refs are unchanged', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'a1', items: [{ ref_id: 'r1' }] }]
    })

    await wrapper.vm.syncAssessments([{ id: 'r1' }])

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('PATCHes with new item when a reference is added', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'a1', items: [{ ref_id: 'r1' }] }]
    })

    await wrapper.vm.syncAssessments([{ id: 'r1' }, { id: 'r2' }])

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_assessments/a1',
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ ref_id: 'r1' }),
          expect.objectContaining({ ref_id: 'r2' })
        ])
      })
    )
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(2)
  })

  it('PATCHes with orphan removed when a reference is deleted', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'a1', items: [{ ref_id: 'r1' }, { ref_id: 'r2' }] }]
    })

    await wrapper.vm.syncAssessments([{ id: 'r1' }])

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(1)
    expect(patchCall.items[0].ref_id).toBe('r1')
  })

  it('new assessment item includes 4 stages with correct structure', async () => {
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.syncAssessments([{ id: 'r1', authors: ['Smith'] }])

    const postCall = Api.post.mock.calls[0][1]
    const item = postCall.items[0]
    expect(item.stages).toHaveLength(4)
    expect(item.stages[0].options).toHaveLength(4)
    expect(item.stages[2].options).toHaveLength(1)
    expect(item.stages[0].options[0]).toEqual({ option: null, text: '' })
  })

  it('does not throw when GET rejects (error caught internally)', async () => {
    Api.get.mockRejectedValue(new Error('Network error'))

    await expect(wrapper.vm.syncAssessments([{ id: 'r1' }])).resolves.not.toThrow()
  })
})

// ─── syncCharacteristics ──────────────────────────────────────────────────────

describe('UploadReferences.vue — syncCharacteristics()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper({ useCamelot: false })
  })

  afterEach(() => wrapper.destroy())

  it('creates characteristics via POST when none exist and useCamelot=true', async () => {
    wrapper = createWrapper({ useCamelot: true })
    jest.spyOn(wrapper.vm, 'parseReference').mockReturnValue('Author 2020')
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.syncCharacteristics([{ id: 'r1', authors: ['Smith'] }])

    expect(Api.post).toHaveBeenCalledWith(
      '/isoqf_characteristics/',
      expect.objectContaining({
        organization: 'org1',
        project_id: 'proj1',
        items: expect.arrayContaining([
          expect.objectContaining({ ref_id: 'r1' })
        ])
      })
    )
  })

  it('does NOT create characteristics when useCamelot=false', async () => {
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.syncCharacteristics([{ id: 'r1' }])

    expect(Api.post).not.toHaveBeenCalled()
  })

  it('does not PATCH when characteristics exist and refs unchanged', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'c1', items: [{ ref_id: 'r1' }] }]
    })

    await wrapper.vm.syncCharacteristics([{ id: 'r1' }])

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('PATCHes with new item when a reference is added', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'c1', items: [{ ref_id: 'r1' }] }]
    })

    await wrapper.vm.syncCharacteristics([{ id: 'r1' }, { id: 'r2' }])

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_characteristics/c1',
      expect.objectContaining({ items: expect.any(Array) })
    )
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(2)
  })

  it('PATCHes removing orphan when a reference is deleted', async () => {
    Api.get.mockResolvedValue({
      data: [{ id: 'c1', items: [{ ref_id: 'r1' }, { ref_id: 'r2' }] }]
    })

    await wrapper.vm.syncCharacteristics([{ id: 'r1' }])

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(1)
    expect(patchCall.items[0].ref_id).toBe('r1')
  })

  it('does not throw when GET rejects', async () => {
    Api.get.mockRejectedValue(new Error('Network error'))

    await expect(wrapper.vm.syncCharacteristics([{ id: 'r1' }])).resolves.not.toThrow()
  })
})

// ─── updateExtractedDataReferences ───────────────────────────────────────────

describe('UploadReferences.vue — updateExtractedDataReferences()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('returns without PATCH when queries array is empty', async () => {
    await wrapper.vm.updateExtractedDataReferences([], [{ id: 'r1' }])
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('skips a query response that has no data[0]', async () => {
    const queries = [{ data: [] }]
    await wrapper.vm.updateExtractedDataReferences(queries, [{ id: 'r1' }])
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('adds a new item for a reference that has no existing extracted data row', async () => {
    const queries = [{
      data: [{ id: 'ed1', items: [] }]
    }]
    const newRefs = [{ id: 'r1', authors: ['Smith'] }]

    await wrapper.vm.updateExtractedDataReferences(queries, newRefs)

    expect(Api.patch).toHaveBeenCalledWith(
      '/isoqf_extracted_data/ed1',
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ ref_id: 'r1', column_0: '' })
        ])
      })
    )
  })

  it('removes orphan item when its ref is no longer in the project', async () => {
    // Spy on the prop getter so the component template stays with empty references (avoids tooltip crash on destroy)
    jest.spyOn(wrapper.vm, 'references', 'get').mockReturnValue([{ id: 'r2' }])
    const queries = [{
      data: [{ id: 'ed1', items: [{ ref_id: 'r1' }, { ref_id: 'r2' }] }]
    }]

    await wrapper.vm.updateExtractedDataReferences(queries, [{ id: 'r2' }])

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(1)
    expect(patchCall.items[0].ref_id).toBe('r2')
  })

  it('does not PATCH when items are unchanged', async () => {
    jest.spyOn(wrapper.vm, 'references', 'get').mockReturnValue([{ id: 'r1' }])
    const queries = [{
      data: [{ id: 'ed1', items: [{ ref_id: 'r1' }] }]
    }]

    await wrapper.vm.updateExtractedDataReferences(queries, [{ id: 'r1' }])

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('removes an orphan using the fresh references param even when the references prop is still stale', async () => {
    // Simulates the real timing: CallGetReferences hasn't refreshed the prop yet,
    // so `this.references` still includes the reference that was just deleted (r1).
    // The freshly-computed param passed in by the caller already excludes it.
    jest.spyOn(wrapper.vm, 'references', 'get').mockReturnValue([{ id: 'r1' }, { id: 'r2' }])
    const queries = [{
      data: [{ id: 'ed1', items: [{ ref_id: 'r1' }, { ref_id: 'r2' }] }]
    }]

    await wrapper.vm.updateExtractedDataReferences(queries, [{ id: 'r2' }])

    expect(Api.patch).toHaveBeenCalled()
    const patchCall = Api.patch.mock.calls[0][1]
    expect(patchCall.items).toHaveLength(1)
    expect(patchCall.items[0].ref_id).toBe('r2')
  })
})

// ─── prefetchDataForExtractedDataUpdate ───────────────────────────────────────

describe('UploadReferences.vue — prefetchDataForExtractedDataUpdate()', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
  })

  afterEach(() => wrapper.destroy())

  it('returns early without calling Api when lists prop is empty', async () => {
    await wrapper.vm.prefetchDataForExtractedDataUpdate([{ id: 'r1' }])
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('calls GET findings for each list', async () => {
    await wrapper.setProps({ lists: [{ id: 'l1' }, { id: 'l2' }] })
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.prefetchDataForExtractedDataUpdate([])

    expect(Api.get).toHaveBeenCalledWith(expect.stringContaining('list_id=l1'))
    expect(Api.get).toHaveBeenCalledWith(expect.stringContaining('list_id=l2'))
  })

  it('calls GET extracted data when finding response has data[0]', async () => {
    await wrapper.setProps({ lists: [{ id: 'l1' }] })
    Api.get
      .mockResolvedValueOnce({ data: [{ id: 'f1', organization: 'org1' }] })
      .mockResolvedValueOnce({ data: [{ id: 'ed1', items: [] }] })

    await wrapper.vm.prefetchDataForExtractedDataUpdate([])

    expect(Api.get).toHaveBeenCalledWith(expect.stringContaining('/isoqf_extracted_data'))
    expect(Api.get).toHaveBeenCalledWith(expect.stringContaining('finding_id=f1'))
  })

  it('calls updateExtractedDataReferences after fetching', async () => {
    await wrapper.setProps({ lists: [{ id: 'l1' }] })
    const updateSpy = jest.spyOn(wrapper.vm, 'updateExtractedDataReferences').mockResolvedValue()
    Api.get.mockResolvedValue({ data: [] })

    await wrapper.vm.prefetchDataForExtractedDataUpdate([{ id: 'r1' }])

    expect(updateSpy).toHaveBeenCalled()
  })

  it('does not throw when API rejects', async () => {
    await wrapper.setProps({ lists: [{ id: 'l1' }] })
    Api.get.mockRejectedValue(new Error('fail'))

    await expect(
      wrapper.vm.prefetchDataForExtractedDataUpdate([])
    ).resolves.not.toThrow()
  })
})
