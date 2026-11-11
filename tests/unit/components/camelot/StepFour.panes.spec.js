import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'

/**
 * The Step 4 assessment modal fills the screen, and its body does not scroll as a whole: each
 * column scrolls on its own (`.modal-pane` inside `.step-four-panes`). The domain values on the
 * left can run several screens (Research Conduct above all), and the person reads them while
 * judging on the right, so neither side may drag the other along.
 *
 * This replaces the sticky assessment column of #405, which only kept the right side in view
 * while the whole modal scrolled.
 *
 * Jest does not lay anything out: this pins the structure the CSS relies on. That each column
 * actually scrolls by itself is checked in the browser.
 */
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/editorPresence', () => ({
  announcePresence: jest.fn(),
  clearPresence: jest.fn(),
  otherTabActiveOn: jest.fn().mockReturnValue(false)
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      isEnabled: true,
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map(),
      get refLocked () { return this.refLocks.size > 0 }
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const ITEM = { index: 0, item: { ref_id: 'R1', authors: 'Author 2020' } }

let wrapper

async function openedAt (stage) {
  wrapper = shallowMount(StepFour, {
    localVue,
    propsData: { type: 'isoqf_assessments', references: [], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Me', last_name: 'Myself' } } }
    }
  })
  await flushPromises()
  jest.spyOn(wrapper.vm.$bvModal, 'show').mockImplementation(() => {})
  wrapper.vm.openModal(stage, ITEM, 0)
  await flushPromises()
  return wrapper
}

afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
})

// The direct children of the columns row, each of which must be a pane.
function panes () {
  const row = wrapper.find('.step-four-panes')
  expect(row.exists()).toBe(true)
  const columns = row.findAll('.modal-pane').filter(column => column.element.parentElement === row.element)
  expect(columns).toHaveLength(row.element.children.length)
  return columns
}

describe('StepFour.vue — each column of the assessment modal scrolls on its own', () => {
  it('the body does not scroll as a whole: its columns do', async () => {
    await openedAt(0)

    const bodyClass = wrapper.findComponent({ name: 'BModal' }).props('bodyClass')
    expect([].concat(bodyClass).join(' ')).toContain('modal-body-panes')
  })

  it.each([
    ['FA 1-4', 0, 2],
    ['FA 5-8', 1, 2],
    ['FA 9', 2, 3],
    ['Overall assessment', 3, 4]
  ])('%s: every column is a pane of its own', async (_label, stage, count) => {
    await openedAt(stage)

    const columns = panes()
    expect(columns).toHaveLength(count)
    // The sticky column of #405 is gone: nothing is left that needs it.
    expect(wrapper.find('.modal-sticky-column').exists()).toBe(false)
  })

  it.each([
    ['FA 1-4', 0],
    ['FA 5-8', 1]
  ])('%s: Research Design or Conduct on the left, Meta domains and the form on the right', async (_label, stage) => {
    await openedAt(stage)

    const [left, right] = panes().wrappers
    expect(left.findAllComponents({ name: 'CamelotAssessmentCard' }).wrappers
      .every(card => card.props('metaIndex') === (stage === 0 ? 1 : 2))).toBe(true)
    expect(left.findComponent({ name: 'AssessmentForm' }).exists()).toBe(false)
    expect(right.text()).toContain('camelot.step_four.sections.meta_domains')
    expect(right.findComponent({ name: 'AssessmentForm' }).exists()).toBe(true)
  })

  it.each([
    ['FA 9', 2],
    ['Overall assessment', 3]
  ])('%s: the assessment form is the rightmost pane', async (_label, stage) => {
    await openedAt(stage)

    const columns = panes().wrappers
    const last = columns[columns.length - 1]
    expect(last.findComponent({ name: 'AssessmentForm' }).exists()).toBe(true)
    expect(columns.slice(0, -1).some(column => column.findComponent({ name: 'AssessmentForm' }).exists())).toBe(false)
  })
})
