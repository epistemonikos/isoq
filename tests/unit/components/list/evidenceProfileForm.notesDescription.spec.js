import { mount, createLocalVue } from '@vue/test-utils'
import evidenceProfileForm from '@/components/list/evidenceProfileForm.vue'
import Api from '@/utils/Api'
import en from '@/lang/en.json'

jest.mock('@/utils/Api')
jest.mock('@/services/lockService')

const localVue = createLocalVue()
const t = key => key.split('.').reduce((node, part) => (node || {})[part], en) || key

const domain = { option: null, explanation: '', notes: '' }
const modalData = () => ({
  type: 'cerqual', title: 'F', methodological_limitations: { ...domain }, coherence: { ...domain },
  adequacy: { ...domain }, relevance: { ...domain }, cerqual: { ...domain }
})

// Renders the description where the person reads it, like BootstrapVue's form-text.
const FormGroup = {
  props: ['description'],
  template: '<div><slot name="label" /><slot /><small class="form-text"><slot name="description">{{ description }}</slot></small></div>'
}

// Coherence with a choice made: the step where the Notes field shows.
async function build (project) {
  const wrapper = mountForm(project)
  await wrapper.setData({ selectedOptions: { ...modalData(), type: 'coherence', coherence: { option: '1', explanation: '', notes: '' } } })
  return wrapper
}

function mountForm (project) {
  Api.get.mockResolvedValue({ data: [] })
  return mount(evidenceProfileForm, {
    localVue,
    propsData: {
      modalData: modalData(),
      list: { id: 'list1', project_id: 'proj1', references: [], project: { private: true } },
      ui: { showExample: false, methodological_assessments: { display_warning: false, extracted_data: { display_warning: false } }, adequacy: { extracted_data: { display_warning: false }, chars_of_studies: { display_warning: false } }, relevance: { chars_of_studies: { display_warning: false } } },
      methAssessments: { items: [], fieldsObj: [] },
      findings: { id: 'finding1' },
      extractedData: { id: 'ed1', items: [], fieldsObj: [] },
      refsWithTitle: [],
      permission: true,
      evidenceProfile: [modalData()],
      selectOptions: [],
      show: {},
      modePrintFieldObject: [],
      mode: 'edit',
      charsOfStudies: { items: [], fieldsObj: [] },
      project
    },
    mocks: {
      $t: t,
      $route: { params: { org_id: 'org1', id: 'list1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $store: { state: {} },
      $notify: { error: jest.fn(), warning: jest.fn() }
    },
    stubs: {
      'b-modal': { template: '<div><slot /></div>', methods: { show () {}, hide () {} } },
      'b-form-group': FormGroup,
      'b-form-textarea': true, 'b-form-radio-group': true, 'b-form-radio': true, 'b-form-invalid-feedback': true,
      'b-tabs': { template: '<div><slot /></div>' }, 'b-tab': { template: '<div><slot /></div>' },
      'b-button': true, 'b-link': true, 'b-col': true, 'b-row': true, 'b-container': true, 'b-table': true,
      'video-help': true, videoHelp: true, 'edit-review-finding': true, 'assessment-table': true,
      'camelot-characteristics-table': true, 'table-extracted-data': true, 'font-awesome-icon': true
    }
  })
}

// #425: the evidence profile is the GRADE-CERQual assessment in every project, CAMELOT or not.
// The CAMELOT wording belongs only to the Step 4 assessment form.
describe('evidenceProfileForm — help text of the Notes field (#425)', () => {
  it.each([false, true])('speaks of GRADE-CERQual assessments, never CAMELOT (use_camelot: %s)', async (useCamelot) => {
    const wrapper = await build({ use_camelot: useCamelot })
    const texts = wrapper.findAll('.form-text').wrappers.map(w => w.text())
    expect(texts).toContain(en.worksheet.labels.notes_description)
    expect(en.worksheet.labels.notes_description).toContain('GRADE-CERQual')
    expect(texts.join(' ')).not.toContain('CAMELOT')
    wrapper.destroy()
  })
})

// #427: Relevance's Notes field carried a stray "Click here to see an example" link.
describe('evidenceProfileForm — Relevance Notes field (#427)', () => {
  it('shows only the Notes help text, with no example link', async () => {
    const wrapper = mountForm({ use_camelot: false })
    await wrapper.setData({ selectedOptions: { ...modalData(), type: 'relevance', relevance: { option: '1', explanation: '', notes: '' } } })
    const notes = wrapper.find('#input-ml-notes').element.parentElement
    expect(notes.textContent).toContain(en.worksheet.labels.notes_description)
    expect(notes.textContent).not.toContain(en.worksheet.labels.click_here_example)
    expect(notes.querySelector('a')).toBeNull()
    wrapper.destroy()
  })
})
