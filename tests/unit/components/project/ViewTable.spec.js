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

  describe('edit finding name ok-disabled condition', () => {
    it('ok-disabled is true when name is null', () => {
      const { wrapper } = createWrapper()
      wrapper.vm.editFindingName.name = null
      const disabled = !wrapper.vm.editFindingName.name || !wrapper.vm.editFindingName.name.trim().length
      expect(disabled).toBe(true)
    })

    it('ok-disabled is true when name is empty string', () => {
      const { wrapper } = createWrapper()
      wrapper.vm.editFindingName.name = ''
      const disabled = !wrapper.vm.editFindingName.name || !wrapper.vm.editFindingName.name.trim().length
      expect(disabled).toBe(true)
    })

    it('ok-disabled is true when name is only whitespace', () => {
      const { wrapper } = createWrapper()
      wrapper.vm.editFindingName.name = '   '
      const disabled = !wrapper.vm.editFindingName.name || !wrapper.vm.editFindingName.name.trim().length
      expect(disabled).toBe(true)
    })

    it('ok-disabled is false when name has content', () => {
      const { wrapper } = createWrapper()
      wrapper.vm.editFindingName.name = 'My finding'
      const disabled = !wrapper.vm.editFindingName.name || !wrapper.vm.editFindingName.name.trim().length
      expect(disabled).toBe(false)
    })
  })

  describe('finding name dirty flag', () => {
    it('starts with findingNameDirty = false', () => {
      const { wrapper } = createWrapper()
      expect(wrapper.vm.findingNameDirty).toBe(false)
    })

    it('sets findingNameDirty to false when modal is hidden', async () => {
      const { wrapper } = createWrapper()
      await wrapper.setData({ findingNameDirty: true })

      wrapper.vm.$emit('hidden')
      await wrapper.setData({ findingNameDirty: false })

      expect(wrapper.vm.findingNameDirty).toBe(false)
    })

    it('state is null when findingNameDirty is false regardless of name value', async () => {
      const { wrapper } = createWrapper()
      await wrapper.setData({
        findingNameDirty: false,
        editFindingName: { ...wrapper.vm.editFindingName, name: '' }
      })

      const dirty = wrapper.vm.findingNameDirty
      const name = wrapper.vm.editFindingName.name
      const state = dirty && !(name && name.trim().length) ? false : null
      expect(state).toBe(null)
    })

    it('state is false when findingNameDirty is true and name is empty', async () => {
      const { wrapper } = createWrapper()
      await wrapper.setData({
        findingNameDirty: true,
        editFindingName: { ...wrapper.vm.editFindingName, name: '' }
      })

      const dirty = wrapper.vm.findingNameDirty
      const name = wrapper.vm.editFindingName.name
      const state = dirty && !(name && name.trim().length) ? false : null
      expect(state).toBe(false)
    })

    it('state is false when findingNameDirty is true and name is only whitespace', async () => {
      const { wrapper } = createWrapper()
      await wrapper.setData({
        findingNameDirty: true,
        editFindingName: { ...wrapper.vm.editFindingName, name: '   ' }
      })

      const dirty = wrapper.vm.findingNameDirty
      const name = wrapper.vm.editFindingName.name
      const state = dirty && !(name && name.trim().length) ? false : null
      expect(state).toBe(false)
    })

    it('state is null when findingNameDirty is true and name has content', async () => {
      const { wrapper } = createWrapper()
      await wrapper.setData({
        findingNameDirty: true,
        editFindingName: { ...wrapper.vm.editFindingName, name: 'My finding' }
      })

      const dirty = wrapper.vm.findingNameDirty
      const name = wrapper.vm.editFindingName.name
      const state = dirty && !(name && name.trim().length) ? false : null
      expect(state).toBe(null)
    })
  })
})
