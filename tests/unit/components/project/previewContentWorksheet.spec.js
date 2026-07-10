
import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'
import { exportToWord } from '@/services/wordExportService'

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// Mock Api utility
jest.mock('@/utils/Api', () => ({
  get: jest.fn(() => Promise.resolve({ data: [] }))
}))

jest.mock('@/services/wordExportService', () => ({
  exportToWord: jest.fn().mockResolvedValue(undefined)
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

  describe('exportToWord', () => {
    const baseData = {
      evidence_profile: [{ concern: 'no_concern' }],
      characteristics_studies: { fields: [], items: [] },
      meth_assessments: { items: [] },
      extracted_data: { fields: {}, items: [] },
      references: [{ id: 'r1' }],
      list: { references: [], license_type: 'CC-BY' }
    }

    it('uses the camelot strategy and array-shaped evidenceProfile when project.use_camelot is true', async () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks,
        data () {
          return {
            project: { public_type: 'fully', id: 'p1', sharedToken: 'token', use_camelot: true, name: 'My Project' },
            ...baseData
          }
        }
      })

      await wrapper.vm.exportToWord()

      expect(exportToWord).toHaveBeenCalledTimes(1)
      const [project, data, options] = exportToWord.mock.calls[0]
      expect(project.use_camelot).toBe(true)
      expect(options.strategy).toBe('camelot')
      expect(options.filename).toBe('My Project.docx')
      expect(data.evidenceProfile).toEqual([{ concern: 'no_concern' }])
      expect(data.characteristicStudies).toBe(wrapper.vm.characteristics_studies)
      expect(data.license).toBeDefined()
    })

    it('uses the worksheet strategy and object-shaped evidenceProfile when project.use_camelot is false', async () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks,
        data () {
          return {
            project: { public_type: 'fully', id: 'p1', sharedToken: 'token', use_camelot: false, name: 'My Project' },
            ...baseData
          }
        }
      })

      await wrapper.vm.exportToWord()

      expect(exportToWord).toHaveBeenCalledTimes(1)
      const [, data, options] = exportToWord.mock.calls[0]
      expect(options.strategy).toBe('worksheet')
      expect(data.evidenceProfile).toEqual({ concern: 'no_concern' })
      expect(data.characteristicsStudies).toBe(wrapper.vm.characteristics_studies)
    })
  })
})
