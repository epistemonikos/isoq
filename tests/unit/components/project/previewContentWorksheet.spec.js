
import { shallowMount, createLocalVue } from '@vue/test-utils'
import previewContentWorksheet from '@/components/previewContent/previewContentWorksheet.vue'
import BootstrapVue from 'bootstrap-vue'
import { exportToWord } from '@/services/wordExportService'
import Api from '@/utils/Api'

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

  describe('validateAndLoadProject — endpoint resolution', () => {
    it('calls the plain (non-shared) project endpoint when accessed via the public browse token', () => {
      shallowMount(previewContentWorksheet, {
        localVue,
        mocks: { ...mocks, $route: { params: { id: '1', projectId: 'p1', token: 'public' } } }
      })

      expect(Api.get).toHaveBeenCalledWith('/isoqf_projects', { project_id: 'p1' })
    })

    it('calls the shared-link endpoint when accessed via a real share token', () => {
      shallowMount(previewContentWorksheet, {
        localVue,
        mocks: { ...mocks, $route: { params: { id: '1', projectId: 'p1', token: 'abc123realtoken' } } }
      })

      expect(Api.get).toHaveBeenCalledWith('/api/shared/abc123realtoken/isoqf_projects', { project_id: 'p1' })
    })

    it('redirects to MainPage when accessed via the public browse token but the project is private', async () => {
      Api.get.mockResolvedValueOnce({ data: [{ id: 'p1', public_type: 'private' }] })
      const push = jest.fn()

      shallowMount(previewContentWorksheet, {
        localVue,
        mocks: { ...mocks, $route: { params: { id: '1', projectId: 'p1', token: 'public' } }, $router: { push } }
      })

      await new Promise(process.nextTick)

      expect(push).toHaveBeenCalledWith({ name: 'MainPage' })
    })

    it('does not redirect a private project when accessed via a real shared-link token', async () => {
      Api.get.mockResolvedValueOnce({ data: [{ id: 'p1', public_type: 'private' }] })
      const push = jest.fn()

      shallowMount(previewContentWorksheet, {
        localVue,
        mocks: { ...mocks, $route: { params: { id: '1', projectId: 'p1', token: 'abc123realtoken' } }, $router: { push } }
      })

      await new Promise(process.nextTick)

      expect(push).not.toHaveBeenCalledWith({ name: 'MainPage' })
    })
  })

  describe('returnLinkTarget', () => {
    it('points back to previewContentSoQf when accessed via the public browse token', () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks,
        data () {
          return { project: { organization: 'org1', id: 'proj1' } }
        }
      })

      expect(wrapper.vm.returnLinkTarget).toEqual({
        name: 'previewContentSoQf',
        params: { org_id: 'org1', isoqf_id: 'proj1', token: 'public' }
      })
    })

    it('points back to sharedContent when accessed via a real share token', () => {
      const wrapper = shallowMount(previewContentWorksheet, {
        localVue,
        mocks: { ...mocks, $route: { params: { id: '1', token: 'abc123realtoken' } } },
        data () {
          return { project: { organization: 'org1', id: 'proj1' } }
        }
      })

      expect(wrapper.vm.returnLinkTarget).toEqual({
        name: 'sharedContent',
        params: { token: 'abc123realtoken' }
      })
    })
  })

  it('shows detailed data sections only when public_type is fully', async () => {
    const wrapper = shallowMount(previewContentWorksheet, {
      localVue,
      mocks,
      data() {
        return {
          project: { public_type: 'fully', id: 'p1', sharedToken: 'token' },
          list: { references: [] },
          characteristics_studies: { fields: [{ key: 'field_1' }] },
          meth_assessments: { items: [{ ref_id: '1' }] }
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
          list: { references: [] },
          characteristics_studies: { fields: [{ key: 'field_1' }] },
          meth_assessments: { items: [{ ref_id: '1' }] }
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
          list: { references: [] },
          characteristics_studies: { fields: [{ key: 'field_1' }] },
          meth_assessments: { items: [{ ref_id: '1' }] }
        }
      }
    })

    // In 'partially' mode, only Evidence Profile should be visible (handled by another component)
    // Detailed tables should be hidden
    expect(wrapper.find('chars-of-studies-stub').exists()).toBe(false)
    expect(wrapper.find('methodological-assessments-stub').exists()).toBe(false)
    expect(wrapper.find('extracted-data-stub').exists()).toBe(false)
  })

  it('shows detailed data sections for a real shared-link token regardless of public_type', () => {
    const wrapper = shallowMount(previewContentWorksheet, {
      localVue,
      mocks: { ...mocks, $route: { params: { id: '1', token: 'abc123realtoken' } } },
      data() {
        return {
          project: { public_type: 'minimally', id: 'p1', sharedToken: 'abc123realtoken' },
          list: { references: [] },
          characteristics_studies: { fields: [{ key: 'field_1' }] },
          meth_assessments: { items: [{ ref_id: '1' }] }
        }
      }
    })

    expect(wrapper.find('chars-of-studies-stub').exists()).toBe(true)
    expect(wrapper.find('methodological-assessments-stub').exists()).toBe(true)
    expect(wrapper.find('extracted-data-stub').exists()).toBe(true)
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
      expect(data.selectOptions).toBe(wrapper.vm.select_options)
      expect(data.levelConfidence).toBe(wrapper.vm.level_confidence)
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
      expect(data.findings).toEqual([{ ...baseData.list, evidence_profile: baseData.evidence_profile[0] }])
    })

    it('produces a payload that passes the real WordExportService validation (camelot)', async () => {
      const { getWordExportService } = jest.requireActual('@/services/wordExportService')
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
      const [project, data] = exportToWord.mock.calls[0]

      expect(getWordExportService().validateExportData(project, data)).toEqual([])
    })

    it('produces a payload that passes the real WordExportService validation (worksheet, non-camelot)', async () => {
      const { getWordExportService } = jest.requireActual('@/services/wordExportService')
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
      const [project, data] = exportToWord.mock.calls[0]

      expect(getWordExportService().validateExportData(project, data)).toEqual([])
    })
  })
})
