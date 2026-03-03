
import { shallowMount, createLocalVue } from '@vue/test-utils'
import editListCharsOfStudies from '@/components/list/editListCharsOfStudies.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock font-awesome-icon
localVue.component('font-awesome-icon', { template: '<i></i>' })

describe('editListCharsOfStudies.vue', () => {
  let propsData

  beforeEach(() => {
    propsData = {
      ui: {
        adequacy: {
          chars_of_studies: {
            display_warning: false
          }
        }
      },
      show: {
        selected: ['cs']
      },
      mode: 'edit',
      list: {
        organization: 'org1',
        project_id: 'p1'
      },
      permission: true,
      charsOfStudies: {
        fields: [],
        items: [],
        fieldsObj: [],
        tableTop: []
      },
      refsWithTitle: [],
      showParagraph: false,
      useCamelot: false
    }
  })

  it('should show exclamation circle when display_warning is true', () => {
    propsData.ui.adequacy.chars_of_studies.display_warning = true
    const wrapper = shallowMount(editListCharsOfStudies, {
      localVue,
      propsData,
      stubs: {
        'font-awesome-icon': true,
        'b-link': true,
        'camelot-characteristics-table': true,
        'bc-filters': true,
        'back-to-top': true
      }
    })
    expect(wrapper.find('font-awesome-icon-stub[icon="exclamation-circle"]').exists()).toBe(true)
  })

  it('should show paragraph when showParagraph is true', () => {
    propsData.showParagraph = true
    const wrapper = shallowMount(editListCharsOfStudies, {
      localVue,
      propsData,
      mocks: {
        $t: (key) => key
      },
      stubs: {
        'b-link': true,
        'camelot-characteristics-table': true,
        'bc-filters': true,
        'back-to-top': true
      }
    })
    expect(wrapper.find('p.font-weight-light').exists()).toBe(true)
  })

  describe('Camelot Project', () => {
    it('should show warning icon when display_warning is true in Camelot', () => {
      propsData.useCamelot = true
      propsData.ui.adequacy.chars_of_studies.display_warning = true
      const wrapper = shallowMount(editListCharsOfStudies, {
        localVue,
        propsData,
        stubs: {
          'font-awesome-icon': true,
          'camelot-characteristics-table': true
        }
      })
      expect(wrapper.find('font-awesome-icon-stub[icon="exclamation-circle"]').exists()).toBe(true)
    })

    it('should NOT show paragraph when there is NO data and it is Camelot AND no warning', () => {
      propsData.useCamelot = true
      propsData.showParagraph = true
      propsData.ui.adequacy.chars_of_studies.display_warning = false
      const wrapper = shallowMount(editListCharsOfStudies, {
        localVue,
        propsData,
        mocks: {
          $t: (key) => key
        },
        stubs: {
          'b-link': true,
          'camelot-characteristics-table': true
        }
      })
      expect(wrapper.find('p.font-weight-light').exists()).toBe(false)
    })

    it('should show paragraph when there is missing data and it is Camelot', () => {
      propsData.useCamelot = true
      propsData.showParagraph = true
      propsData.ui.adequacy.chars_of_studies.display_warning = true
      const wrapper = shallowMount(editListCharsOfStudies, {
        localVue,
        propsData,
        mocks: {
          $t: (key) => key
        },
        stubs: {
          'b-link': true,
          'camelot-characteristics-table': true
        }
      })
      expect(wrapper.find('p.font-weight-light').exists()).toBe(true)
    })

    it('should render camelot-characteristics-table when useCamelot is true', () => {
      propsData.useCamelot = true
      const wrapper = shallowMount(editListCharsOfStudies, {
        localVue,
        propsData,
        stubs: {
          'camelot-characteristics-table': true
        }
      })
      expect(wrapper.find('camelot-characteristics-table-stub').exists()).toBe(true)
    })
  })
})
