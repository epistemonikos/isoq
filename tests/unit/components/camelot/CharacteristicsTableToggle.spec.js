
import { mount, createLocalVue } from '@vue/test-utils'
import CharacteristicsTable from '@/components/camelot/characteristics/CharacteristicsTable.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

describe('CharacteristicsTable.vue - Toggle Concerns', () => {
  let propsData
  let mocks

  beforeEach(() => {
    propsData = {
      charsOfStudies: {
        fields: [
          { key: 'ref_id', label: 'ID' },
          { key: 'research_extractedData', label: 'Research' }
        ],
        items: [{
          ref_id: '1',
          authors: 'Author A',
          year: '2020',
          research_extractedData: 'data1',
          research_comments: 'concern1'
        }]
      }
    }
    mocks = {
      $t: (key) => key
    }
  })

  it('should HIDE concern columns by default', () => {
    const wrapper = mount(CharacteristicsTable, {
      localVue,
      propsData,
      mocks
    })

    const headers = wrapper.findAll('th').wrappers.map(w => w.text())
    // Should contain extractedData but NOT concerns initially
    expect(headers).toContain('camelot.step_four.camelot_mixin.extracted_data')
    expect(headers).not.toContain('camelot.step_four.camelot_mixin.concerns')
  })

  it('should show a toggle button with show_concerns text', () => {
    const wrapper = mount(CharacteristicsTable, {
      localVue,
      propsData,
      mocks
    })

    const toggleBtn = wrapper.find('button')
    expect(toggleBtn.exists()).toBe(true)
    expect(toggleBtn.text()).toBe('worksheet.actions.show_concerns')
  })

  it('should SHOW concern columns and change button text when toggle button is clicked', async () => {
    const wrapper = mount(CharacteristicsTable, {
      localVue,
      propsData,
      mocks
    })

    const toggleBtn = wrapper.find('button')
    await toggleBtn.trigger('click')

    expect(toggleBtn.text()).toBe('worksheet.actions.hide_concerns')
    const headers = wrapper.findAll('th').wrappers.map(w => w.text())
    expect(headers).toContain('camelot.step_four.camelot_mixin.concerns')
  })
})
