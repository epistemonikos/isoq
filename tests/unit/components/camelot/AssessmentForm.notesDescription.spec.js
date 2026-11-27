import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

const opts = () => Array.from({ length: 4 }, () => ({ option: null, text: '', notes: '' }))

// #425: the Step 4 Notes field is where CAMELOT assessments are made; the evidence
// profile (GRADE-CERQual) keeps its own wording.
describe('AssessmentForm — help text of the Notes field (#425)', () => {
  it('speaks of CAMELOT assessments', () => {
    Api.get.mockResolvedValue({ data: [] })
    const wrapper = mount(AssessmentForm, {
      localVue: createLocalVue(),
      propsData: {
        selectedMeta: 0, modalStage: 0, modalIndex: 0, refId: 'ref1',
        assessments: { id: 'a1', items: [{ ref_id: 'ref1', authors: 'A 2024', stages: [{ key: 0, options: opts() }] }] }
      },
      mocks: {
        $t: k => k,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn() },
        $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
      },
      stubs: {
        'b-card': { template: '<div><slot /></div>' },
        'b-form-group': { template: '<div><slot /></div>' },
        'b-form-radio-group': true, 'b-form-radio': true, 'b-form-textarea': true,
        'b-form-invalid-feedback': true, 'b-button': true, 'b-modal': true
      }
    })
    expect(wrapper.text()).toContain('worksheet.labels.notes_description_camelot')
    wrapper.destroy()
  })
})
