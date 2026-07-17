import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify
    },
    stubs
  })
  return { wrapper, $notify }
}

describe('viewProject.vue — createList()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('sets sort=1 when lists is empty', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'list1', name: 'Finding 1' } })
    const { wrapper } = createWrapper()
    await wrapper.setData({ lists: [], summarized_review: 'My finding' })
    jest.spyOn(wrapper.vm, 'createFinding').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateModificationTime').mockImplementation(() => {})
    wrapper.vm.createList()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_lists', expect.objectContaining({ sort: 1 }))
    wrapper.destroy()
  })

  it('sets sort=last.sort+1 when lists has items', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'list2', name: 'Finding 2' } })
    const { wrapper } = createWrapper()
    await wrapper.setData({ lists: [{ sort: 3 }, { sort: 5 }], summarized_review: 'New finding' })
    jest.spyOn(wrapper.vm, 'createFinding').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateModificationTime').mockImplementation(() => {})
    wrapper.vm.createList()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_lists', expect.objectContaining({ sort: 6 }))
    wrapper.destroy()
  })

  it('copies is_public=true from project', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'list1', name: 'F' } })
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { is_public: true }, summarized_review: 'F' })
    jest.spyOn(wrapper.vm, 'createFinding').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateModificationTime').mockImplementation(() => {})
    wrapper.vm.createList()
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_lists', expect.objectContaining({ is_public: true }))
    wrapper.destroy()
  })

  it('calls createFinding with listId and listName on success', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'list99', name: 'My List' } })
    const { wrapper } = createWrapper()
    await wrapper.setData({ summarized_review: 'My List' })
    const createFindingSpy = jest.spyOn(wrapper.vm, 'createFinding').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateModificationTime').mockImplementation(() => {})
    wrapper.vm.createList()
    await flushPromises()
    expect(createFindingSpy).toHaveBeenCalledWith('list99', 'My List')
    wrapper.destroy()
  })

  it('clears summarized_review and list_categories.selected after success', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'list1', name: 'F' } })
    const { wrapper } = createWrapper()
    await wrapper.setData({
      summarized_review: 'Something',
      list_categories: { options: [], selected: 'cat1' }
    })
    jest.spyOn(wrapper.vm, 'createFinding').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'updateModificationTime').mockImplementation(() => {})
    wrapper.vm.createList()
    await flushPromises()
    expect(wrapper.vm.summarized_review).toBe('')
    expect(wrapper.vm.list_categories.selected).toBeNull()
    wrapper.destroy()
  })

  it('shows error notification on failure', async () => {
    Api.post.mockRejectedValueOnce(new Error('network'))
    const { wrapper, $notify } = createWrapper()
    await wrapper.setData({ summarized_review: 'F' })
    wrapper.vm.createList()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.create_error')
    wrapper.destroy()
  })
})

describe('viewProject.vue — createFinding()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('posts to /isoqf_findings with full evidence_profile structure', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'finding1' } })
    const { wrapper } = createWrapper()
    jest.spyOn(wrapper.vm, 'createExtractedData').mockResolvedValue()
    wrapper.vm.createFinding('list1', 'My Finding')
    await flushPromises()
    expect(Api.post).toHaveBeenCalledWith('/isoqf_findings', expect.objectContaining({
      list_id: 'list1',
      name: 'My Finding',
      evidence_profile: expect.objectContaining({
        methodological_limitations: expect.any(Object),
        coherence: expect.any(Object),
        adequacy: expect.any(Object),
        relevance: expect.any(Object),
        cerqual: expect.any(Object)
      })
    }))
    wrapper.destroy()
  })

  it('calls createExtractedData with the new finding id', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'finding99' } })
    const { wrapper } = createWrapper()
    const spy = jest.spyOn(wrapper.vm, 'createExtractedData').mockResolvedValue()
    wrapper.vm.createFinding('list1', 'F')
    await flushPromises()
    expect(spy).toHaveBeenCalledWith('finding99')
    wrapper.destroy()
  })

  it('shows success notification on success', async () => {
    Api.post.mockResolvedValueOnce({ data: { id: 'f1' } })
    const { wrapper, $notify } = createWrapper()
    jest.spyOn(wrapper.vm, 'createExtractedData').mockResolvedValue()
    wrapper.vm.createFinding('list1', 'F')
    await flushPromises()
    expect($notify.success).toHaveBeenCalledWith('notifications.created')
    wrapper.destroy()
  })

  it('shows error notification on failure', async () => {
    Api.post.mockRejectedValueOnce(new Error('network'))
    const { wrapper, $notify } = createWrapper()
    wrapper.vm.createFinding('list1', 'F')
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.create_error')
    wrapper.destroy()
  })
})

describe('viewProject.vue — saveSortedLists()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('patches each list with incremental sort values starting at 1', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper } = createWrapper()
    jest.spyOn(wrapper.vm, 'updateFindingSort').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    wrapper.vm.sorted_lists = [{ id: 'l1' }, { id: 'l2' }, { id: 'l3' }]
    wrapper.vm.$refs['modal-sort-findings'] = { hide: jest.fn() }
    wrapper.vm.saveSortedLists()
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_lists/l1', { sort: 1 })
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_lists/l2', { sort: 2 })
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_lists/l3', { sort: 3 })
    wrapper.destroy()
  })

  it('calls updateFindingSort for each list with getList=false', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper } = createWrapper()
    const updateSpy = jest.spyOn(wrapper.vm, 'updateFindingSort').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    wrapper.vm.sorted_lists = [{ id: 'l1' }, { id: 'l2' }]
    wrapper.vm.$refs['modal-sort-findings'] = { hide: jest.fn() }
    wrapper.vm.saveSortedLists()
    await flushPromises()
    expect(updateSpy).toHaveBeenCalledWith('l1', 1, false)
    expect(updateSpy).toHaveBeenCalledWith('l2', 2, false)
    wrapper.destroy()
  })

  it('shows success notification and hides modal on Promise.all success', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    const { wrapper, $notify } = createWrapper()
    jest.spyOn(wrapper.vm, 'updateFindingSort').mockResolvedValue()
    jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    const hideMock = jest.fn()
    wrapper.vm.$refs['modal-sort-findings'] = { hide: hideMock }
    wrapper.vm.sorted_lists = [{ id: 'l1' }]
    wrapper.vm.saveSortedLists()
    await flushPromises()
    expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    expect(hideMock).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('shows error notification on failure', async () => {
    Api.patch.mockRejectedValue(new Error('network'))
    const { wrapper, $notify } = createWrapper()
    wrapper.vm.$refs['modal-sort-findings'] = { hide: jest.fn() }
    wrapper.vm.sorted_lists = [{ id: 'l1' }]
    wrapper.vm.saveSortedLists()
    await flushPromises()
    expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    wrapper.destroy()
  })
})

describe('viewProject.vue — updateFindingSort()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('GETs findings for the list and PATCHes the first one with sort values', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    Api.get.mockResolvedValueOnce({ data: [{ id: 'finding1' }] })
    Api.patch.mockResolvedValueOnce({ data: {} })
    jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    await wrapper.vm.updateFindingSort('list1', 5, false)
    expect(Api.get).toHaveBeenCalledWith('/isoqf_findings', expect.objectContaining({ list_id: 'list1' }))
    expect(Api.patch).toHaveBeenCalledWith('/isoqf_findings/finding1', {
      'isoqf_id': 5
    })
    wrapper.destroy()
  })

  it('calls getLists() when getList=true', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    Api.get.mockResolvedValueOnce({ data: [{ id: 'f1' }] })
    Api.patch.mockResolvedValueOnce({ data: {} })
    const getListsSpy = jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    await wrapper.vm.updateFindingSort('list1', 3, true)
    expect(getListsSpy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('does NOT call getLists() when getList=false', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    Api.get.mockResolvedValueOnce({ data: [{ id: 'f1' }] })
    Api.patch.mockResolvedValueOnce({ data: {} })
    const getListsSpy = jest.spyOn(wrapper.vm, 'getLists').mockResolvedValue()
    await wrapper.vm.updateFindingSort('list1', 3, false)
    expect(getListsSpy).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('viewProject.vue — route watchers', () => {
  let wrapper

  beforeEach(async () => {
    wrapper = createWrapper().wrapper
    await flushPromises()
    jest.clearAllMocks()
  })

  afterEach(() => wrapper.destroy())

  it.each([
    ['Project-Property', 0],
    ['My-Data', 1],
    ['iSoQ', 2],
    ['Guidance-on-applying-GRADE-CERQual', 3]
  ])('$route.query.tab "%s" maps tabOpened to %d', (tab, expected) => {
    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, tab)
    expect(wrapper.vm.tabOpened).toBe(expected)
  })

  it('unknown tab value does not change tabOpened', () => {
    wrapper.vm.tabOpened = 1
    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, 'unknown-tab')
    expect(wrapper.vm.tabOpened).toBe(1)
  })

  it('$route.query.step sets stepStage to parseInt(val)-1', () => {
    wrapper.vm.$options.watch['$route.query.step'].call(wrapper.vm, '3')
    expect(wrapper.vm.stepStage).toBe(2)
  })

  it('$route.query.step ignores falsy values', () => {
    wrapper.vm.stepStage = 2
    wrapper.vm.$options.watch['$route.query.step'].call(wrapper.vm, '')
    expect(wrapper.vm.stepStage).toBe(2)
  })
})

describe('viewProject.vue — processLists() cerqual resilience (infinite-spinner regression)', () => {
  beforeEach(() => jest.clearAllMocks())

  // Real-world granular-update shape: the list mirror lost its evidence_profile.cerqual
  // key, but the authoritative top-level cerqual is present. The old reader crashed on
  // list.evidence_profile.cerqual.option, leaving table_settings.isBusy stuck at true.
  const malformedList = {
    id: 'l1',
    name: 'Finding A',
    cerqual: { option: null, explanation: '' },
    references: [],
    evidence_profile: {
      methodological_limitations: { option: '1', explanation: 'x' },
      coherence: { option: '1', explanation: 'x' },
      adequacy: { option: '1', explanation: 'x' },
      relevance: { option: '0', explanation: '' }
    }
  }

  it('does not throw and turns off isBusy when evidence_profile has no cerqual key', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ table_settings: { ...wrapper.vm.table_settings, isBusy: true } })
    let result
    await expect(
      (async () => { result = await wrapper.vm.processLists({ data: [malformedList] }) })()
    ).resolves.toBeUndefined()
    expect(wrapper.vm.table_settings.isBusy).toBe(false)
    expect(result[0].status).toBe('unfinished') // cerqual.option === null → unfinished
    wrapper.destroy()
  })

  it('backfills missing evidence_profile sections so the notes v-if cannot throw', async () => {
    // Reported crash: a new finding saved only some sections granularly →
    // evidence_profile lacks adequacy/relevance → ViewTable reads adequacy.notes → TypeError.
    const partialList = {
      id: 'l2',
      name: 'Finding B',
      cerqual: { option: null, explanation: '' },
      references: [],
      evidence_profile: {
        methodological_limitations: { option: '1', explanation: 'x', notes: '' },
        coherence: { option: '0', explanation: '', notes: '' }
      }
    }
    const { wrapper } = createWrapper()
    const [processed] = await wrapper.vm.processLists({ data: [partialList] })
    for (const s of ['methodological_limitations', 'coherence', 'adequacy', 'relevance', 'cerqual']) {
      expect(processed.evidence_profile[s]).toBeDefined()
      expect(() => processed.evidence_profile[s].notes).not.toThrow()
    }
    wrapper.destroy()
  })

  it('getLists resets isBusy even when processLists rejects', async () => {
    Api.get.mockResolvedValueOnce({ data: [malformedList] })
    const { wrapper } = createWrapper()
    await wrapper.setData({ table_settings: { ...wrapper.vm.table_settings, isBusy: true } })
    jest.spyOn(wrapper.vm, 'processLists').mockRejectedValueOnce(new Error('boom'))
    jest.spyOn(wrapper.vm, 'getFindings').mockImplementation(() => {})
    wrapper.vm.getLists()
    await flushPromises()
    expect(wrapper.vm.table_settings.isBusy).toBe(false)
    wrapper.destroy()
  })
})
