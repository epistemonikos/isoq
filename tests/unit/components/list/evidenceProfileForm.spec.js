import { shallowMount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'

const localVue = createLocalVue()

jest.mock('@/utils/Api')

const makeModalData = (overrides = {}) => ({
  type: 'methodological-limitations',
  title: 'Test finding',
  isoqf_id: null,
  methodological_limitations: { option: null, explanation: '', notes: '' },
  coherence: { option: null, explanation: '', notes: '' },
  adequacy: { option: null, explanation: '', notes: '' },
  relevance: { option: null, explanation: '', notes: '' },
  cerqual: { option: null, explanation: '', notes: '' },
  ...overrides
})

const makeWrapper = (propsData = {}) => shallowMount(evidenceProfileForm, {
  localVue,
  propsData: {
    modalData: makeModalData(),
    list: { id: 'list1', organization: 'org1', project_id: 'proj1', references: [], project: { private: false } },
    ui: { showExample: false, methodological_assessments: { display_warning: false } },
    methAssessments: { items: [], fields: [] },
    findings: {},
    extractedData: { items: [], fields: [] },
    refsWithTitle: [],
    permission: true,
    ...propsData
  },
  mocks: {
    $t: key => key,
    $route: { params: { org_id: 'org1', id: 'proj1' } },
    $bvModal: { show: jest.fn(), hide: jest.fn() },
    $store: { state: { publishableLists: [] } }
  },
  stubs: {
    'b-form-group': true,
    'b-form-textarea': true,
    'b-form-radio-group': true,
    'b-form-radio': true,
    'b-form-invalid-feedback': true,
    'b-modal': true,
    'b-tabs': true,
    'b-tab': true,
    'b-button': true,
    'b-link': true,
    'b-col': true,
    'b-row': true,
    'b-container': true,
    'video-help': true,
    'edit-review-finding': true,
    'assessment-table': true,
    'camelot-characteristics-table': true,
    'table-extracted-data': true,
    'font-awesome-icon': true
  }
})

describe('evidenceProfileForm.vue', () => {
  describe('explanationStateFor method', () => {
    it('returns null when option is null', () => {
      const wrapper = makeWrapper()
      expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBe(null)
      expect(wrapper.vm.explanationStateFor('coherence')).toBe(null)
      expect(wrapper.vm.explanationStateFor('adequacy')).toBe(null)
      expect(wrapper.vm.explanationStateFor('relevance')).toBe(null)
      expect(wrapper.vm.explanationStateFor('cerqual')).toBe(null)
    })

    it('returns false when option is set but explanation is empty', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          methodological_limitations: { option: '1', explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBe(false)
    })

    it('returns false when option is set and explanation is whitespace only', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          coherence: { option: '2', explanation: '   ', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('coherence')).toBe(false)
    })

    it('returns true when option is set and explanation has content', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          adequacy: { option: '1', explanation: 'Some explanation', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('adequacy')).toBe(true)
    })

    it('returns null for option "0" (no concerns) with empty explanation', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          relevance: { option: null, explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('relevance')).toBe(null)
    })

    it('returns false for cerqual when option set and explanation empty', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          cerqual: { option: '1', explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('cerqual')).toBe(false)
    })

    it('returns true for cerqual when option set and explanation present', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          cerqual: { option: '2', explanation: 'Moderate confidence because...', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('cerqual')).toBe(true)
    })

    it('returns null when domain does not exist in selectedOptions', () => {
      const wrapper = makeWrapper()
      expect(wrapper.vm.explanationStateFor('nonexistent_domain')).toBe(null)
    })

    it('updates reactively when option changes from null to a value', async () => {
      const wrapper = makeWrapper()
      expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBe(null)
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          methodological_limitations: { option: '3', explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('methodological_limitations')).toBe(false)
    })

    it('updates reactively when explanation is filled after option selected', async () => {
      const wrapper = makeWrapper()
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          coherence: { option: '1', explanation: '', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('coherence')).toBe(false)
      await wrapper.setData({
        selectedOptions: {
          ...wrapper.vm.selectedOptions,
          coherence: { option: '1', explanation: 'Minor coherence concern explained', notes: '' }
        }
      })
      expect(wrapper.vm.explanationStateFor('coherence')).toBe(true)
    })
  })
})
