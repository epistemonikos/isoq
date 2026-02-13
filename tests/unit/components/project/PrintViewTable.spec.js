
import { shallowMount, createLocalVue } from '@vue/test-utils'
import PrintViewTable from '@/components/project/PrintViewTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('PrintViewTable.vue', () => {
  let propsData
  let mocks

  beforeEach(() => {
    mocks = {
      $t: (key) => key,
      $route: { params: { token: 'public' } }
    }
    propsData = {
      references: [
        { id: 'ref1', content: 'Author 2020' }
      ],
      dataPrintVersion: [
        { is_category: true, name: 'Category 1', id: 'cat1' },
        { 
          id: 'find1', 
          name: 'Finding 1', 
          isoqf_id: '1', 
          ref_list: 'Author 2020',
          cerqual_option: 'High',
          cerqual_explanation: 'Exp',
          references: ['ref1'],
          evidence_profile: {
            cerqual: { option: 0, explanation: 'Exp' },
            methodological_limitations: { option: 0, explanation: '' },
            coherence: { option: 0, explanation: '' },
            adequacy: { option: 0, explanation: '' },
            relevance: { option: 0, explanation: '' }
          }
        }
      ],
      categories: { options: [{ id: 'cat1', text: 'Category 1' }] },
      printableItems: ['cat1', 'find1'],
      hasPermission: true,
      project: { public_type: 'fully' }
    }
  })

  it('renders category headers correctly', () => {
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    const categoryCell = wrapper.find('.text-center.text-uppercase')
    expect(categoryCell.exists()).toBe(true)
    expect(categoryCell.text()).toBe('Category 1')
  })

  it('renders links to worksheet when isPublic is true', () => {
    propsData.isPublic = true
    propsData.token = 'public-token'
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    const link = wrapper.find('b-link-stub')
    expect(link.exists()).toBe(true)
    expect(link.props().to.name).toBe('previewWorksheet')
    expect(link.props().to.params.id).toBe('find1')
    expect(link.props().to.params.token).toBe('public-token')
  })

  it('renders plain text (no links) when public_type is minimally', () => {
    propsData.isPublic = true
    propsData.project.public_type = 'minimally'
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    const link = wrapper.find('b-link-stub')
    expect(link.exists()).toBe(false)
    expect(wrapper.text()).toContain('Finding 1')
  })

  it('hides Evidence Profile table when public_type is minimally', () => {
    propsData.isPublic = true
    propsData.project.public_type = 'minimally'
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    expect(wrapper.text()).not.toContain('table_head.evidence_profile')
    // It should not find the second table
    const tables = wrapper.findAll('b-table-simple-stub')
    expect(tables.length).toBe(1) // Only the SOQF table
  })

  it('hides Evidence Profile table when onlySummary is true', () => {
    propsData.onlySummary = true
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    expect(wrapper.text()).not.toContain('table_head.evidence_profile')
    const tables = wrapper.findAll('b-table-simple-stub')
    expect(tables.length).toBe(1)
  })

  it('renders plain text instead of links in workspace mode (isPublic false)', () => {
    propsData.isPublic = false
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    const link = wrapper.find('b-link-stub')
    expect(link.exists()).toBe(false)
    expect(wrapper.text()).toContain('Finding 1')
  })

  it('hides items not in printableItems', () => {
    propsData.printableItems = ['cat1'] // find1 is NOT printable
    const wrapper = shallowMount(PrintViewTable, { localVue, propsData, mocks })
    
    const rows = wrapper.findAll('b-tr-stub')
    // Row 0 is header, Row 1 is cat1, Row 2 is find1
    expect(rows.at(2).classes()).toContain('d-print-none')
  })
})
