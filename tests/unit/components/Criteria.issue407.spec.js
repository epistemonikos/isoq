// Issue #407 — Step 2 criteria with two people, and with one person in two tabs.
//
// What was measured (2026-10-29, local, two windows):
//   - Switching to another window blurred the textarea, and 5 s later the box was released.
//     The other person saw it free, wrote, and when the first one came back their tab still
//     had the OLD text: the next keystroke saved it whole over the other person's.
//   - The save did not ask whether this tab held the box.
//   - One person, two tabs: the server keeps ONE lock per user, so when tab B released it,
//     tab A's heartbeat came back 409 `lock_expired` and A threw the person out of the box.
//
// What it must do:
//   - Someone editing a box keeps it while they look at a PDF or NVivo; the others see it
//     blocked with their name. It is released by leaving the box inside the page, leaving
//     the step, or 30 min without activity (the same rule as the modals).
//   - The same person in another tab edits freely, with no notice, starting from what the
//     other tab saved.
import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import Criteria from '@/components/Criteria.vue'
import LockService from '@/services/lockService'
import Api from '@/utils/Api'

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn(() => Promise.resolve({ success: true })),
  releaseRef: jest.fn(() => Promise.resolve()),
  refLocks: new Map()
}))

jest.mock('@/utils/Api', () => ({
  get: jest.fn(),
  patch: jest.fn(() => Promise.resolve({ data: {} }))
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper (props = {}) {
  return mount(Criteria, {
    localVue,
    attachTo: document.body,
    propsData: {
      canEdit: true,
      label: 'Inclusion criteria',
      description: 'placeholder',
      dataTxt: 'stale text',
      criteria: 'inclusion',
      ...props
    },
    mocks: {
      $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
      $route: { params: { id: 'proj1' } },
      $store: { state: { user: { first_name: 'damian', last_name: 'garrido' } } },
      $notify: { warning: jest.fn() }
    }
  })
}

const textarea = wrapper => wrapper.find('textarea')

const fire = (wrapper, type) => {
  textarea(wrapper).element.dispatchEvent(new Event(type))
  return wrapper.vm.$nextTick()
}

/** The box as the person sees it after clicking into it and the lock + read coming back. */
async function enter (wrapper) {
  await fire(wrapper, 'focus')
  await flushPromises()
  await flushPromises()
}

const serverHas = (inclusion) => Api.get.mockResolvedValue({ data: { id: 'proj1', inclusion, exclusion: '' } })

let wrapper
let pageHasFocus

beforeEach(() => {
  jest.clearAllMocks()
  LockService.acquireRef.mockResolvedValue({ success: true })
  serverHas('saved on the server')
  pageHasFocus = true
  jest.spyOn(document, 'hasFocus').mockImplementation(() => pageHasFocus)
})

afterEach(() => {
  jest.useRealTimers()
  if (wrapper) wrapper.destroy()
  wrapper = null
  document.hasFocus.mockRestore()
})

describe('Criteria.vue — looking at another window does not release the box', () => {
  it('keeps the lock when the blur comes from the page losing focus (another window, tab or app)', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    jest.useFakeTimers()

    pageHasFocus = false
    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(10 * 60 * 1000)

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('still releases it 5 s after leaving the box inside the page', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    jest.useFakeTimers()

    await fire(wrapper, 'blur')
    jest.advanceTimersByTime(5000)

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
  })

  it('coming back from the other window does not ask for the lock again', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    pageHasFocus = false
    await fire(wrapper, 'blur')

    pageHasFocus = true
    await enter(wrapper)

    expect(LockService.acquireRef).toHaveBeenCalledTimes(1)
  })
})

describe('Criteria.vue — 30 min without activity release the box', () => {
  it('holding the box arms the inactivity watch, and releasing it disarms it', async () => {
    wrapper = createWrapper()
    const start = jest.spyOn(wrapper.vm, 'startInactivityWatch')
    const stop = jest.spyOn(wrapper.vm, 'stopInactivityWatch')

    await enter(wrapper)
    expect(start).toHaveBeenCalled()

    wrapper.vm.flushAndRelease()
    await wrapper.vm.$nextTick()
    expect(stop).toHaveBeenCalled()
  })

  it('shows the countdown inside the box that holds the lock', async () => {
    wrapper = createWrapper()
    await enter(wrapper)

    wrapper.setData({ inactivityWarning: true, inactivitySecondsLeft: 300 })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('lock.inactivity_message')
  })

  it('on expiry it saves what is pending, releases, and takes the cursor out of the box', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    textarea(wrapper).element.focus()
    wrapper.vm.local_data = 'typed before lunch'
    await wrapper.vm.$nextTick()

    wrapper.vm.onInactivityExpired()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_projects/proj1', { inclusion: 'typed before lunch' })
    expect(Api.patch.mock.invocationCallOrder[0])
      .toBeLessThan(LockService.releaseRef.mock.invocationCallOrder[0])
    expect(document.activeElement).not.toBe(textarea(wrapper).element)
    expect(wrapper.vm.$notify.warning).toHaveBeenCalledWith('lock.inactivity_released')
  })
})

describe('Criteria.vue — entering the box starts from what is saved', () => {
  it('shows the text the server has, not the copy this tab loaded', async () => {
    serverHas('written in my other tab')
    wrapper = createWrapper()

    await enter(wrapper)

    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/proj1', null, { networkOnly: true })
    expect(textarea(wrapper).element.value).toBe('written in my other tab')
  })

  it('reads it again when coming back to a box this tab still holds', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    pageHasFocus = false
    await fire(wrapper, 'blur')
    serverHas('the other tab kept writing')

    pageHasFocus = true
    await enter(wrapper)

    expect(textarea(wrapper).element.value).toBe('the other tab kept writing')
  })

  it('does not save back the text it just read', async () => {
    serverHas('written in my other tab')
    wrapper = createWrapper()
    const save = jest.spyOn(wrapper.vm, 'saveCriteria')

    await enter(wrapper)

    expect(textarea(wrapper).element.value).toBe('written in my other tab')
    expect(save).not.toHaveBeenCalled()
    // The spy hides the debounced function's `flush`, which leaving the step calls.
    save.mockRestore()
  })

  it('does not overwrite what the person typed while the read was on its way', async () => {
    let answer
    Api.get.mockImplementation(() => new Promise(resolve => { answer = resolve }))
    wrapper = createWrapper()
    await fire(wrapper, 'focus')
    await flushPromises()

    wrapper.vm.local_data = 'typed right away'
    answer({ data: { id: 'proj1', inclusion: 'from the server' } })
    await flushPromises()

    expect(wrapper.vm.local_data).toBe('typed right away')
  })

  it('keeps the local text when the read fails', async () => {
    Api.get.mockRejectedValue(new Error('offline'))
    wrapper = createWrapper()

    await enter(wrapper)

    expect(textarea(wrapper).element.value).toBe('stale text')
  })

  it('does not read when the box is somebody else\'s: it stays blocked', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    wrapper = createWrapper()

    await enter(wrapper)

    expect(Api.get).not.toHaveBeenCalled()
  })
})

describe('Criteria.vue — only the tab that holds the box saves', () => {
  it('does not save text into a box this tab does not hold', async () => {
    wrapper = createWrapper()

    wrapper.vm.criteriaAction('inclusion')

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('a 409 from the server blocks the box and names who holds it', async () => {
    Api.patch.mockRejectedValueOnce({
      response: { status: 409, data: { status: false, reason: 'locked_by_other_user', locked_by: 'Ana Pérez' } }
    })
    wrapper = createWrapper()
    await enter(wrapper)

    wrapper.vm.criteriaAction('inclusion')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(textarea(wrapper).attributes('disabled')).toBeTruthy()
    expect(wrapper.text()).toContain('Ana Pérez')
    expect(wrapper.vm.lockHeld).toBe(false)
  })
})

describe('Criteria.vue — my other tab releasing the box does not throw me out', () => {
  const loseLock = (detail) => window.dispatchEvent(new CustomEvent('ref-lock-lost', { detail }))

  it('takes the lock back in silence when it expired with nobody else holding it', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    LockService.acquireRef.mockClear()

    loseLock({ refId: 'criteria::inclusion', reason: 'lock_expired', lockedBy: null })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'criteria::inclusion')
    expect(textarea(wrapper).attributes('disabled')).toBeFalsy()
    expect(wrapper.find('.lock-notice').exists()).toBe(false)
    expect(wrapper.vm.lockHeld).toBe(true)
  })

  it('if somebody else took it in between, it blocks and names them', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })

    loseLock({ refId: 'criteria::inclusion', reason: 'lock_expired', lockedBy: null })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(textarea(wrapper).attributes('disabled')).toBeTruthy()
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  it('losing it to another person is still a block, not a silent retake', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    LockService.acquireRef.mockClear()

    loseLock({ refId: 'criteria::inclusion', reason: 'locked_by_other_user', lockedBy: 'Ana Pérez' })
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(LockService.acquireRef).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Ana Pérez')
  })
})
