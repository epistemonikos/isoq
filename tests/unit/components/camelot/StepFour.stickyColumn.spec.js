import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import StepFour from '@/components/camelot/StepFour.vue'

/**
 * #405: the domain values on the left of the assessment modal can run several screens
 * (Research Conduct above all), and the column where the person assesses scrolled away
 * with them, so reading and judging meant scrolling up and down. The assessment column
 * stays in view (`.modal-sticky-column`) while the left one scrolls.
 *
 * Jest does not lay anything out: this pins WHICH column is sticky in each modal. That it
 * actually sticks is checked in the browser.
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

function stickyColumns () {
  return wrapper.findAll('.modal-sticky-column')
}

describe('StepFour.vue — the assessment column stays in view (#405)', () => {
  it.each([
    ['FA 1-4', 0],
    ['FA 5-8', 1]
  ])('%s: the whole Meta domains column is the sticky one', async (_label, stage) => {
    await openedAt(stage)

    const sticky = stickyColumns()
    expect(sticky).toHaveLength(1)
    const column = sticky.at(0)
    expect(column.text()).toContain('camelot.step_four.sections.meta_domains')
    expect(column.findComponent({ name: 'AssessmentForm' }).exists()).toBe(true)
    // The long Research Design / Conduct cards are the part that scrolls, not this one.
    const cards = column.findAllComponents({ name: 'CamelotAssessmentCard' })
    expect(cards.wrappers.every(card => card.props('metaIndex') === 0)).toBe(true)
  })

  it.each([
    ['FA 9', 2],
    ['Overall assessment', 3]
  ])('%s: the rightmost column, with the assessment form, is the sticky one', async (_label, stage) => {
    await openedAt(stage)

    const sticky = stickyColumns()
    expect(sticky).toHaveLength(1)
    const column = sticky.at(0)
    expect(column.findComponent({ name: 'AssessmentForm' }).exists()).toBe(true)
    expect(column.findAllComponents({ name: 'CamelotAssessmentCard' })).toHaveLength(0)
    expect(column.element.nextElementSibling).toBeNull()
  })
})
