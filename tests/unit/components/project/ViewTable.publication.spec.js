import { mount, createLocalVue } from '@vue/test-utils'
import ViewTable from '@/components/project/ViewTable.vue'
import Api from '@/utils/Api'
import { fetchPublicationState } from '@/utils/publicationState'

jest.mock('@/utils/Api')
jest.mock('@/utils/publicationState')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn().mockResolvedValue({}),
  isRefHeld: jest.fn().mockReturnValue(true)
}))

const localVue = createLocalVue()
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

const complete = id => ({ id, name: id, references: ['r1'], cerqual: { option: 1, explanation: 'x' } })
const publicProject = { id: 'proj1', public_type: 'fully' }

const Modal = {
  template: '<div class="modal-stub"><slot /></div>',
  methods: { show () { this.$emit('shown-called') }, hide () {} }
}

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = mount(ViewTable, {
    localVue,
    propsData: {
      lists: [{ id: 'list1', name: 'F1', references: ['r1'], category: null, evidence_profile: {} }],
      list_categories: { options: [], selected: null },
      fields: { with_categories: [], without_categories: [] },
      project: { id: 'proj1', is_public: true, private: false },
      references: [{ id: 'r1' }],
      refs: [],
      isBusy: false,
      mode: 'edit',
      canEdit: true
    },
    mocks: { $t: key => key, $route: { params: { id: 'proj1', org_id: 'org1' } }, $notify },
    stubs: {
      'b-modal': Modal,
      'b-table': true, 'b-alert': true, 'b-button': true, 'b-form-checkbox': true,
      'b-form-group': true, 'b-form-input': true, 'b-form-select': true, 'b-form-textarea': true,
      'b-row': true, 'b-col': true, 'b-container': true, 'b-link': true, 'b-form-select-option': true,
      'font-awesome-icon': true, videoHelp: true, i18n: true
    }
  })
  return { wrapper, $notify }
}

const text = (wrapper, id) => wrapper.find(`#${id}`).text()

describe('ViewTable publication warnings', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [{ id: 'finding1', name: 'F1' }] })
  })

  describe('deleting a finding', () => {
    const open = async wrapper => {
      await wrapper.vm.removeModalFinding({ index: 0, item: { id: 'list1' } })
      await flush()
      await wrapper.vm.$nextTick()
    }

    test('says the project reverts when no other finding would stay visible', async () => {
      fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1')] })
      const { wrapper } = createWrapper()
      await open(wrapper)
      expect(text(wrapper, 'remove-finding')).toContain('soqf_table.delete_warning_revert')
      wrapper.destroy()
    })

    test('gives the simple warning when another finding stays visible', async () => {
      fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1'), complete('list2')] })
      const { wrapper } = createWrapper()
      await open(wrapper)
      const t = text(wrapper, 'remove-finding')
      expect(t).not.toContain('soqf_table.delete_warning_revert')
      expect(t).toContain('soqf_table.delete_warning')
      wrapper.destroy()
    })

    test('notifies and does not open the modal when the re-read fails', async () => {
      fetchPublicationState.mockRejectedValue(new Error('down'))
      const { wrapper, $notify } = createWrapper()
      const show = jest.fn()
      wrapper.vm.$refs['remove-finding'].show = show
      await open(wrapper)
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
      expect(show).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('removing every reference of a finding', () => {
    const removeAll = async wrapper => {
      await wrapper.setData({ selected_list_index: 0, selected_references: [], original_references: ['r1'] })
      const event = { preventDefault: jest.fn() }
      wrapper.vm.checkReferencesBeforeSaving(event)
      await flush()
      await wrapper.vm.$nextTick()
      return event
    }

    test('the revert warning shows when it is the last visible finding', async () => {
      fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1')] })
      const { wrapper } = createWrapper()
      const show = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
      await removeAll(wrapper)
      expect(show).toHaveBeenCalled()
      expect(text(wrapper, 'modal-private-project-warning')).toContain('soqf_table.remove_all_revert')
      wrapper.destroy()
    })

    test('the finding-hidden warning shows when another finding stays visible', async () => {
      fetchPublicationState.mockResolvedValue({ project: publicProject, lists: [complete('list1'), complete('list2')] })
      const { wrapper } = createWrapper()
      const priv = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
      const hidden = jest.spyOn(wrapper.vm.$refs['modal-no-references-warning'], 'show')
      await removeAll(wrapper)
      expect(hidden).toHaveBeenCalled()
      expect(priv).not.toHaveBeenCalled()
      expect(text(wrapper, 'modal-no-references-warning')).toContain('soqf_table.remove_all_unpublish')
      wrapper.destroy()
    })

    test('a private project saves without any warning', async () => {
      fetchPublicationState.mockResolvedValue({ project: { id: 'proj1', public_type: 'private' }, lists: [complete('list1')] })
      const { wrapper } = createWrapper()
      const save = jest.spyOn(wrapper.vm, 'saveReferencesList').mockImplementation(() => {})
      wrapper.vm.$refs['modal-references-list'] = { hide: jest.fn() }
      const priv = jest.spyOn(wrapper.vm.$refs['modal-private-project-warning'], 'show')
      await removeAll(wrapper)
      expect(save).toHaveBeenCalled()
      expect(priv).not.toHaveBeenCalled()
      wrapper.destroy()
    })

    test('a failed re-read notifies and saves nothing', async () => {
      fetchPublicationState.mockRejectedValue(new Error('down'))
      const { wrapper, $notify } = createWrapper()
      const save = jest.spyOn(wrapper.vm, 'saveReferencesList').mockImplementation(() => {})
      await removeAll(wrapper)
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
      expect(save).not.toHaveBeenCalled()
      expect(wrapper.vm.pendingSaveReferences).toBe(false)
      wrapper.destroy()
    })
  })
})
