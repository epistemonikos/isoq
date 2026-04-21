import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api')

describe('AssessmentForm.vue', () => {
  let wrapper
  const propsData = {
    selectedMeta: 0,
    modalStage: 0,
    modalIndex: 0,
    refId: 'ref1',
    assessments: {
      id: 'assess1',
      items: [
        {
          ref_id: 'ref1',
          authors: 'Author 2024',
          stages: [
            {
              key: 0,
              options: [
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' },
                { option: null, text: '', notes: '' }
              ]
            }
          ]
        }
      ]
    }
  }

  const $t = (key) => key
  const $bvModal = {
    show: jest.fn(),
    hide: jest.fn()
  }
  const $notify = {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = mount(AssessmentForm, {
      localVue,
      propsData,
      mocks: {
        $t,
        $route: {
          params: {
            org_id: 'org1',
            id: 'proj1'
          }
        },
        $bvModal,
        $notify
      },
      stubs: {
        'b-card': true,
        'b-form-group': true,
        'b-form-radio-group': true,
        'b-form-radio': true,
        'b-form-textarea': true,
        'b-button': true,
        'b-modal': true
      }
    })
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('shows warning modal when saving with an option selected but no explanation', async () => {
    await wrapper.setData({
      selected: 'B',
      text1: '' // Empty explanation
    })
    
    // Trigger save
    await wrapper.vm.save()
    
    // Should show warning modal instead of calling API immediately
    expect($bvModal.show).toHaveBeenCalledWith('warning-explanation-modal-0-0')
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('proceeds with save when "Do it later" is clicked', async () => {
    Api.patch.mockResolvedValue({ data: {} })
    
    await wrapper.setData({
      selected: 'B',
      text1: ''
    })
    
    // Simulate clicking "Do it later"
    await wrapper.vm.doItLater()
    
    expect(Api.patch).toHaveBeenCalled()
    expect($bvModal.hide).toHaveBeenCalledWith('warning-explanation-modal-0-0')
  })

  it('cancels save and focuses explanation when "Do it now" is clicked', async () => {
    // We need to mock focus on the element
    const focusSpy = jest.fn()
    document.getElementById = jest.fn().mockReturnValue({ focus: focusSpy })
    
    await wrapper.vm.doItNow()
    
    expect($bvModal.hide).toHaveBeenCalledWith('warning-explanation-modal-0-0')
    expect(focusSpy).toHaveBeenCalled()
  })

  it('saves directly if explanation is present', async () => {
    Api.patch.mockResolvedValue({ data: {} })

    await wrapper.setData({
      selected: 'B',
      text1: 'Some explanation'
    })

    await wrapper.vm.save()

    expect(Api.patch).toHaveBeenCalled()
    expect($bvModal.show).not.toHaveBeenCalledWith('warning-explanation-modal-0-0')
  })

  describe('user notifications', () => {
    it('shows success notification after successful patch', async () => {
      Api.patch.mockResolvedValue({ data: {} })
      await wrapper.setData({ selected: 'B', text1: 'Explanation' })
      await wrapper.vm.save()
      await wrapper.vm.$nextTick()
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
    })

    it('shows error notification when patch fails', async () => {
      Api.patch.mockRejectedValue(new Error('network error'))
      await wrapper.setData({ selected: 'B', text1: 'Explanation' })
      await wrapper.vm.save()
      await wrapper.vm.$nextTick()
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
    })

    it('shows success notification after successful post (new assessment)', async () => {
      const propsWithoutId = {
        ...propsData,
        assessments: { items: [{ ref_id: 'ref1', stages: [{ key: 0, options: [{ option: null, text: '' }] }] }] }
      }
      Api.post.mockResolvedValue({ data: {} })
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: propsWithoutId,
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await localWrapper.setData({ selected: 'A', text1: 'Explanation' })
      await localWrapper.vm.save()
      await localWrapper.vm.$nextTick()
      expect($notify.success).toHaveBeenCalledWith('notifications.saved')
      localWrapper.destroy()
    })

    it('shows error notification when post fails', async () => {
      const propsWithoutId = {
        ...propsData,
        assessments: { items: [{ ref_id: 'ref1', stages: [{ key: 0, options: [{ option: null, text: '' }] }] }] }
      }
      Api.post.mockRejectedValue(new Error('network error'))
      const localWrapper = mount(AssessmentForm, {
        localVue,
        propsData: propsWithoutId,
        mocks: { $t, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify }
      })
      await localWrapper.setData({ selected: 'A', text1: 'Explanation' })
      await localWrapper.vm.save()
      await localWrapper.vm.$nextTick()
      expect($notify.error).toHaveBeenCalledWith('notifications.save_error')
      localWrapper.destroy()
    })
  })

  describe('explanationState computed', () => {
    it('returns null when no option is selected', async () => {
      await wrapper.setData({ selected: null, text1: '' })
      expect(wrapper.vm.explanationState).toBe(null)
    })

    it('returns null when no option is selected even if text is present', async () => {
      await wrapper.setData({ selected: null, text1: 'Some text' })
      expect(wrapper.vm.explanationState).toBe(null)
    })

    it('returns false when option is selected and explanation is empty', async () => {
      await wrapper.setData({ selected: 'B', text1: '' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('returns false when option is selected and explanation is whitespace only', async () => {
      await wrapper.setData({ selected: 'C', text1: '   ' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('returns true when option is selected and explanation has content', async () => {
      await wrapper.setData({ selected: 'A', text1: 'My explanation' })
      expect(wrapper.vm.explanationState).toBe(true)
    })

    it('updates reactively when selected changes from null to a value', async () => {
      await wrapper.setData({ selected: null, text1: '' })
      expect(wrapper.vm.explanationState).toBe(null)
      await wrapper.setData({ selected: 'D' })
      expect(wrapper.vm.explanationState).toBe(false)
    })

    it('updates reactively when text1 is filled after selecting an option', async () => {
      await wrapper.setData({ selected: 'B', text1: '' })
      expect(wrapper.vm.explanationState).toBe(false)
      await wrapper.setData({ text1: 'Now I wrote something' })
      expect(wrapper.vm.explanationState).toBe(true)
    })
  })
})
