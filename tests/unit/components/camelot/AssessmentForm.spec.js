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
        $bvModal
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
})
