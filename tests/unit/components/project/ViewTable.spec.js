import { shallowMount, createLocalVue } from '@vue/test-utils'
import ViewTable from '@/components/project/ViewTable.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api')

const localVue = createLocalVue()

const defaultProps = {
  lists: [
    {
      id: 'list1',
      name: 'Finding One',
      notes: '',
      sort: 1,
      references: ['ref1'],
      category: null,
      category_name: '',
      cerqual_option: '',
      cerqual_explanation: '',
      raw_ref: ['ref1'],
      filter_cerqual: '',
      evidence_profile: {
        methodological_limitations: { notes: '' },
        coherence: { notes: '' },
        adequacy: { notes: '' },
        relevance: { notes: '' },
        cerqual: { option: null, notes: '' }
      }
    }
  ],
  list_categories: { options: [], selected: null },
  fields: {
    with_categories: [],
    without_categories: []
  },
  project: { id: 'proj1', is_public: false, private: true },
  references: [],
  refs: [],
  isBusy: false,
  mode: 'edit'
}

function createWrapper (overrideProps = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(ViewTable, {
    localVue,
    propsData: { ...defaultProps, ...overrideProps },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify
    },
    stubs: { videoHelp: true }
  })
  return { wrapper, $notify }
}

describe('ViewTable.vue', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('updateFinding', () => {
    it('shows success toast after a successful patch', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      const { wrapper, $notify } = createWrapper()

      await wrapper.vm.updateFinding({ finding_id: 'find1', name: 'Updated name', notes: '' })
      await wrapper.vm.$nextTick()

      expect(Api.patch).toHaveBeenCalledWith('/isoqf_findings/find1', expect.any(Object))
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    })

    it('shows error toast when patch fails', async () => {
      Api.patch.mockRejectedValue(new Error('network error'))
      const { wrapper, $notify } = createWrapper()

      await wrapper.vm.updateFinding({ finding_id: 'find1', name: 'Updated name', notes: '' })
      await wrapper.vm.$nextTick()

      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    })

    it('emits get-lists on success', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      const { wrapper } = createWrapper()

      await wrapper.vm.updateFinding({ finding_id: 'find1', name: 'Name', notes: '' })
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('get-lists')).toBeTruthy()
    })
  })

  describe('updateFindingReferences', () => {
    it('shows success toast after a successful patch', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      const { wrapper, $notify } = createWrapper()
      await wrapper.setData({ finding: { id: 'find1' } })

      await wrapper.vm.updateFindingReferences(['ref1', 'ref2'])
      await wrapper.vm.$nextTick()

      expect(Api.patch).toHaveBeenCalledWith('/isoqf_findings/find1', expect.any(Object))
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    })

    it('shows error toast when patch fails', async () => {
      Api.patch.mockRejectedValue(new Error('network error'))
      const { wrapper, $notify } = createWrapper()
      await wrapper.setData({ finding: { id: 'find1' } })

      await wrapper.vm.updateFindingReferences(['ref1'])
      await wrapper.vm.$nextTick()

      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    })

    it('cleans references list on success', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      const { wrapper } = createWrapper()
      await wrapper.setData({
        finding: { id: 'find1' },
        selected_references: ['ref1'],
        original_references: ['ref1']
      })

      await wrapper.vm.updateFindingReferences(['ref1'])
      await wrapper.vm.$nextTick()

      expect(wrapper.vm.selected_references).toEqual([])
      expect(wrapper.vm.original_references).toEqual([])
    })
  })

  describe('confirmRemoveList', () => {
    it('shows success toast after a successful delete', async () => {
      Api.post.mockResolvedValue({ data: {} })
      const { wrapper, $notify } = createWrapper()
      await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, id: 'list1' } })

      await wrapper.vm.confirmRemoveList()
      await wrapper.vm.$nextTick()

      expect(Api.post).toHaveBeenCalledWith('/finding/remove', expect.objectContaining({ finding_id: 'list1' }))
      expect($notify.success).toHaveBeenCalledWith('notifications.deleted')
    })

    it('shows error toast when delete fails', async () => {
      Api.post.mockRejectedValue(new Error('network error'))
      const { wrapper, $notify } = createWrapper()
      await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, id: 'list1' } })

      await wrapper.vm.confirmRemoveList()
      await wrapper.vm.$nextTick()

      expect($notify.error).toHaveBeenCalledWith('notifications.delete_error')
    })

    it('emits get-project on success', async () => {
      Api.post.mockResolvedValue({ data: {} })
      const { wrapper } = createWrapper()
      await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, id: 'list1' } })

      await wrapper.vm.confirmRemoveList()
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('get-project')).toBeTruthy()
    })

    it('does nothing when editFindingName.id is not set', async () => {
      const { wrapper, $notify } = createWrapper()
      await wrapper.setData({ editFindingName: { ...wrapper.vm.editFindingName, id: null } })

      await wrapper.vm.confirmRemoveList()

      expect(Api.post).not.toHaveBeenCalled()
      expect($notify.success).not.toHaveBeenCalled()
      expect($notify.error).not.toHaveBeenCalled()
    })
  })
})
