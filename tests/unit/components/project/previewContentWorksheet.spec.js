
import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock Api utility
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] }))
}))

describe('previewContentWorksheet.vue', () => {
  let propsData
  let mocks

  beforeEach(() => {
    jest.clearAllMocks()
    mocks = {
      $t: (key) => key,
      $route: { params: { id: '1', token: 'public' } },
      $router: { push: jest.fn() }
    }
  })

  it('shows detailed data sections only when public_type is fully', async () => {
    const wrapper = shallowMount(previewContentWorksheet, { 
      localVue, 
      mocks,
      data() {
        return {
          project: { public_type: 'fully', id: 'p1', sharedToken: 'token' },
          list: { references: [] }
        }
      }
    })

    // In 'fully' mode, these sections should be present in the DOM
    expect(wrapper.find('chars-of-studies-stub').exists()).toBe(true)
    expect(wrapper.find('methodological-assessments-stub').exists()).toBe(true)
    expect(wrapper.find('extracted-data-stub').exists()).toBe(true)
  })

  it('hides detailed data sections when public_type is minimally', async () => {
    const wrapper = shallowMount(previewContentWorksheet, { 
      localVue, 
      mocks,
      data() {
        return {
          project: { public_type: 'minimally', id: 'p1', sharedToken: 'token' },
          list: { references: [] }
        }
      }
    })

    // In 'minimally' mode, these sections should NOT be rendered
    expect(wrapper.find('chars-of-studies-stub').exists()).toBe(false)
    expect(wrapper.find('methodological-assessments-stub').exists()).toBe(false)
    expect(wrapper.find('extracted-data-stub').exists()).toBe(false)
  })

  it('hides detailed data sections when public_type is partially (empty string or other)', async () => {
    const wrapper = shallowMount(previewContentWorksheet, { 
      localVue, 
      mocks,
      data() {
        return {
          project: { public_type: 'partially', id: 'p1', sharedToken: 'token' },
          list: { references: [] }
        }
      }
    })

    // In 'partially' mode, only Evidence Profile should be visible (handled by another component)
    // Detailed tables should be hidden
    expect(wrapper.find('chars-of-studies-stub').exists()).toBe(false)
    expect(wrapper.find('methodological-assessments-stub').exists()).toBe(false)
    expect(wrapper.find('extracted-data-stub').exists()).toBe(false)
  })
})
