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

  describe('Published state follows the canonical rule, not the stored is_public', () => {
    const publishButton = (wrapper) => wrapper.findAll('b-button').wrappers
      .find(w => ['actionButtons.publish', 'actionButtons.published'].includes(w.text()))

    it('shows Published for public_type fully even if is_public is stale false', () => {
      const wrapper = createWrapper({
        mode: 'edit',
        project: { id: 'proj1', public_type: 'fully', private: true, is_public: false }
      })
      expect(publishButton(wrapper).text()).toBe('actionButtons.published')
    })

    it('shows Publish for public_type private even if is_public is stale true', () => {
      const wrapper = createWrapper({
        mode: 'edit',
        project: { id: 'proj1', public_type: 'private', is_public: true }
      })
      expect(publishButton(wrapper).text()).toBe('actionButtons.publish')
    })
  })
})
