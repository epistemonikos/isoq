// Closing the Step 4 modal after editing a cell repainted the table two or three times.
//
// Measured in the browser (2026-10-29): every getAssessments() swapped the WHOLE table for the
// one-line "loading" alert and mounted it again, even when the data was already on screen.
// And closing the modal ran getAssessments() up to three times: the cell's own save, the
// freshness poll of StepFour (its own write moves `last_update`), and viewProject's refresh,
// whose reloaded `references` array — same content, new identity — re-fired the watcher.
//
// Two fixes, one spec each:
//   1. Only the FIRST load hides the table. A reload swaps the data under a table that stays.
//   2. The `references` watcher reloads when the studies change, not when the array does.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import CamelotStepFourTable from '@/components/camelot/CamelotStepFourTable.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map()
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const REFS = [
  { id: 'ref1', authors: ['Alvarez'], publication_year: '2021' },
  { id: 'ref2', authors: ['Barros'], publication_year: '2019' }
]

const ASSESSMENT_DOC = {
  id: 'doc1',
  items: [
    { ref_id: 'ref1', stages: [] },
    { ref_id: 'ref2', stages: [] }
  ]
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0))

/** A GET that stays in flight until the test lets it go. */
function deferredGet () {
  let release
  const promise = new Promise(resolve => { release = resolve })
  Api.get.mockImplementationOnce(() => promise)
  return () => { release({ data: [ASSESSMENT_DOC] }); return flush() }
}

function createWrapper (references = REFS) {
  return shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references, canEdit: true },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

const assessmentGets = () => Api.get.mock.calls.filter(([url]) => url === '/isoqf_assessments').length
const loadingAlert = (wrapper) => wrapper.findAll('b-alert-stub').filter(a => a.text().includes('camelot.step_four.loading'))

beforeEach(() => {
  Api.get.mockReset()
  Api.get.mockResolvedValue({ data: [ASSESSMENT_DOC] })
})

describe('StepFour.vue — a reload does not tear the table down', () => {
  it('the first load shows the loading alert instead of the table', async () => {
    const release = deferredGet()
    const wrapper = createWrapper()
    await wrapper.vm.$nextTick()

    expect(loadingAlert(wrapper).length).toBe(1)
    expect(wrapper.findComponent(CamelotStepFourTable).exists()).toBe(false)

    await release()
    expect(loadingAlert(wrapper).length).toBe(0)
    expect(wrapper.findComponent(CamelotStepFourTable).exists()).toBe(true)
    wrapper.destroy()
  })

  it('a reload with the table already on screen keeps the same table mounted', async () => {
    const wrapper = createWrapper()
    await flush()
    const table = wrapper.findComponent(CamelotStepFourTable)
    expect(table.exists()).toBe(true)

    const release = deferredGet()
    wrapper.vm.getAssessments()
    await wrapper.vm.$nextTick()

    // While the GET is in flight: no alert, and not a new table but the SAME instance.
    expect(loadingAlert(wrapper).length).toBe(0)
    expect(wrapper.findComponent(CamelotStepFourTable).vm).toBe(table.vm)

    await release()
    expect(wrapper.findComponent(CamelotStepFourTable).vm).toBe(table.vm)
    wrapper.destroy()
  })

  it('a reload after a failed first load still shows the loading alert: there is nothing to keep', async () => {
    Api.get.mockReset()
    Api.get.mockRejectedValueOnce(new Error('network'))
    const wrapper = createWrapper()
    await flush()

    const release = deferredGet()
    wrapper.vm.getAssessments()
    await wrapper.vm.$nextTick()

    expect(loadingAlert(wrapper).length).toBe(1)
    await release()
    wrapper.destroy()
  })
})

describe('StepFour.vue — the references watcher reloads on new studies, not on a new array', () => {
  it('the same studies in a new array (what viewProject\'s refresh hands down) do not reload', async () => {
    const wrapper = createWrapper()
    await flush()
    const before = assessmentGets()

    await wrapper.setProps({ references: REFS.map(r => ({ ...r })) })
    await flush()

    expect(assessmentGets()).toBe(before)
    wrapper.destroy()
  })

  it('the same studies in another order do not reload either: the table sorts them itself', async () => {
    const wrapper = createWrapper()
    await flush()
    const before = assessmentGets()

    await wrapper.setProps({ references: [...REFS].reverse().map(r => ({ ...r })) })
    await flush()

    expect(assessmentGets()).toBe(before)
    wrapper.destroy()
  })

  it('a study added by somebody else reloads', async () => {
    const wrapper = createWrapper()
    await flush()
    const before = assessmentGets()

    await wrapper.setProps({ references: [...REFS, { id: 'ref3', authors: ['Castro'], publication_year: '2020' }] })
    await flush()

    expect(assessmentGets()).toBe(before + 1)
    wrapper.destroy()
  })

  it('a study removed by somebody else reloads', async () => {
    const wrapper = createWrapper()
    await flush()
    const before = assessmentGets()

    await wrapper.setProps({ references: [REFS[0]] })
    await flush()

    expect(assessmentGets()).toBe(before + 1)
    wrapper.destroy()
  })

  it('a renamed study reloads: the rows are sorted by that label when the data arrives', async () => {
    const wrapper = createWrapper()
    await flush()
    const before = assessmentGets()

    await wrapper.setProps({ references: [{ ...REFS[0], authors: ['Zamora'] }, REFS[1]] })
    await flush()

    expect(assessmentGets()).toBe(before + 1)
    wrapper.destroy()
  })
})
