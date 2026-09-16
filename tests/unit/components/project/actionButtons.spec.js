import { shallowMount, createLocalVue } from '@vue/test-utils'
import actionButtons from '@/components/project/actionButtons.vue'

const localVue = createLocalVue()

const defaultProps = {
  mode: 'view',
  preview: false,
  project: { id: 'proj1', name: 'Test Project', is_public: false },
  canWrite: true,
  ui: { publish: { showLoader: false } }
}

function createWrapper (overrideProps = {}) {
  return shallowMount(actionButtons, {
    localVue,
    propsData: { ...defaultProps, ...overrideProps },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    },
    stubs: {
      'font-awesome-icon': true,
      PublishModal: true
    }
  })
}

function findEditButton (wrapper) {
  return wrapper.findAll('b-button').filter(w => w.text().includes('actionButtons.edit'))
}

describe('actionButtons.vue', () => {
  describe('Edit button gating by canWrite', () => {
    it('is not rendered for a read-only user (canWrite: false), even in view mode', () => {
      const wrapper = createWrapper({ mode: 'view', canWrite: false })
      expect(findEditButton(wrapper).length).toBe(0)
    })

    it('is rendered for a user with write access in view mode', () => {
      const wrapper = createWrapper({ mode: 'view', canWrite: true })
      expect(findEditButton(wrapper).length).toBe(1)
    })

    it('is not rendered in preview mode regardless of canWrite', () => {
      const wrapper = createWrapper({ mode: 'view', preview: true, canWrite: true })
      expect(findEditButton(wrapper).length).toBe(0)
    })

    it('is not rendered while already in edit mode', () => {
      const wrapper = createWrapper({ mode: 'edit', canWrite: true })
      expect(findEditButton(wrapper).length).toBe(0)
    })
  })

  describe('Export/Print buttons remain available to read-only users', () => {
    it('shows the export dropdown and print button when canWrite is false', () => {
      const wrapper = createWrapper({ mode: 'view', canWrite: false })
      expect(wrapper.find('#export-button').exists()).toBe(true)
      expect(wrapper.text()).toContain('actionButtons.print_save_pdf')
    })
  })
})
