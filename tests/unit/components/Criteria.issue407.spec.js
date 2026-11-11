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
  it('does not save text into a box somebody else holds', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez', reason: 'locked_by_other_user' })
    wrapper = createWrapper()

    await wrapper.vm.criteriaAction('inclusion')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
  })

  // Damián, 2026-11-11, two windows: the acquire on entering lost against the other user,
  // the box was disabled with the cursor inside — Chrome keeps it there without a `blur` —
  // and the next poll enabled it again. Typing then fired no `focus`, so nobody asked for
  // the lock, the save did not go out and «Saving…» stayed on for good.
  it('typing into a free box without the lock takes it and saves', async () => {
    wrapper = createWrapper()

    await wrapper.vm.criteriaAction('inclusion')
    await flushPromises()

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'criteria::inclusion')
    expect(Api.patch).toHaveBeenCalledTimes(1)
    expect(wrapper.find('button').text()).toBe('common.save')
  })

  it('a save that cannot go out does not leave «Saving…» on', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez', reason: 'locked_by_other_user' })
    wrapper = createWrapper()

    await wrapper.vm.criteriaAction('inclusion')
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('button').text()).toBe('common.save')
    expect(wrapper.text()).toContain('Ana Pérez')
  })

  // The button read the inclusion state in both boxes: exclusion never showed its own.
  it('the exclusion box shows its own saving state', async () => {
    let resolvePatch
    Api.patch.mockReturnValueOnce(new Promise(resolve => { resolvePatch = resolve }))
    wrapper = createWrapper({ criteria: 'exclusion' })
    await enter(wrapper)

    wrapper.vm.criteriaAction('exclusion')
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').text()).toContain('common.saving')

    resolvePatch({ data: {} })
    await flushPromises()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('button').text()).toBe('common.save')
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

// Megan, 2026-11-11: User 1 edits, User 2 sees the box blocked; User 1 saves and leaves, and
// User 2 sees the box released on the next poll — but still with the OLD text. The read
// only happened on entering the box, so whoever was only looking never got the new text.
describe('#407 — releasing someone else\'s lock brings in what they wrote', () => {
  const heldByMegan = [{ ref_id: 'criteria::inclusion', user_name: 'Megan Wainwright' }]

  it('shows the text from the server as soon as the box is released', async () => {
    wrapper = createWrapper({ refLocks: heldByMegan })
    await flushPromises()
    expect(textarea(wrapper).element.disabled).toBe(true)

    serverHas('what Megan wrote')
    await wrapper.setProps({ refLocks: [] })
    await flushPromises()
    await flushPromises()

    expect(textarea(wrapper).element.disabled).toBe(false)
    expect(textarea(wrapper).element.value).toBe('what Megan wrote')
    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('does not reread on a poll that changes nothing for this box', async () => {
    wrapper = createWrapper({ refLocks: [] })
    await flushPromises()

    await wrapper.setProps({ refLocks: [] })
    await flushPromises()

    expect(Api.get).not.toHaveBeenCalled()
  })
})

// Damián, 2026-11-11: with two accounts, the box blocked and unblocked by itself
// («stutter»): the acquire said 409, and every poll unblocked it again because the lock
// carried the same display name as this user. Identity is the `user_id`, never the name
// (the same rule as `findingPresence`).
describe('#407 — somebody with my name is still somebody else', () => {
  const store = { state: { user: { id: 'u1', first_name: 'damian', last_name: 'garrido' } } }
  const withStore = (props) => mount(Criteria, {
    localVue,
    attachTo: document.body,
    propsData: { canEdit: true, label: 'L', description: 'd', dataTxt: '', criteria: 'inclusion', ...props },
    mocks: {
      $t: (key, params) => (params ? `${key}:${JSON.stringify(params)}` : key),
      $route: { params: { id: 'proj1' } },
      $store: store,
      $notify: { warning: jest.fn() }
    }
  })

  it('blocks the box when the lock is another account with the same name', async () => {
    wrapper = withStore({ refLocks: [{ ref_id: 'criteria::inclusion', user_id: 'u2', user_name: 'damian garrido' }] })
    await flushPromises()

    expect(textarea(wrapper).element.disabled).toBe(true)
  })

  it('does not block against its own lock left in another tab', async () => {
    wrapper = withStore({ refLocks: [{ ref_id: 'criteria::inclusion', user_id: 'u1', user_name: 'damian garrido' }] })
    await flushPromises()

    expect(textarea(wrapper).element.disabled).toBe(false)
  })
})

// Measured 2026-11-11 with two accounts (logs `[c407]`): user 1 held inclusion, left it,
// user 2 took it, and user 1 coming back flickered between blocked and free for good. The
// poll did carry user 2's lock, but `polledHolder` never moved from null: while this tab
// held the box it returned on the non-reactive registry check without reading `refLocks`,
// so Vue kept that null cached and later polls no longer invalidated it.
describe('#407 — a box this tab held and released still sees who takes it next', () => {
  it('blocks and names the new holder after this tab released the box', async () => {
    wrapper = createWrapper({ refLocks: [] })
    await enter(wrapper)
    LockService.refLocks.set('criteria::inclusion', 'proj1')
    await wrapper.setProps({ refLocks: [{ ref_id: 'criteria::inclusion', user_name: 'damian garrido' }] })

    LockService.refLocks.delete('criteria::inclusion')
    wrapper.vm.flushAndRelease()
    await wrapper.setProps({ refLocks: [{ ref_id: 'criteria::inclusion', user_id: 'u2', user_name: 'diaman garrido' }] })
    await flushPromises()

    expect(textarea(wrapper).element.disabled).toBe(true)
    expect(wrapper.text()).toContain('diaman garrido')
  })
})

// Damián, 2026-11-11: one person ended up holding BOTH boxes. In box A they switched to
// another window — that blur is ignored on purpose — and came back by clicking straight
// into box B. A got no further focus or blur, so nothing ever released it.
describe('#407 — coming back from another window into the other box releases this one', () => {
  it('releases it 5 s after the window comes back with the cursor somewhere else', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    jest.useFakeTimers()
    pageHasFocus = false
    await fire(wrapper, 'blur')

    pageHasFocus = true
    const elsewhere = document.createElement('textarea')
    document.body.appendChild(elsewhere)
    elsewhere.focus()
    window.dispatchEvent(new Event('focus'))
    jest.advanceTimersByTime(5000)

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
    elsewhere.remove()
  })

  it('keeps it when the window comes back with the cursor in this box', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    jest.useFakeTimers()
    pageHasFocus = false
    await fire(wrapper, 'blur')

    pageHasFocus = true
    textarea(wrapper).element.focus()
    window.dispatchEvent(new Event('focus'))
    jest.advanceTimersByTime(10 * 60 * 1000 - 1)

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})

// Measured 2026-11-11 (logs `[c407]`): going from one box to the other kept BOTH taken for
// the 5 s grace, and switching back and forth renewed it. The other person, polling every
// 15 s, kept seeing one person in both boxes. Entering the other box is leaving this one:
// the grace is for clicks around this box (selecting text, the Save button), not for that.
describe('#407 — entering the other box releases this one at once', () => {
  let other

  afterEach(() => { if (other) other.destroy(); other = null })

  it('releases inclusion as soon as exclusion is entered, saving what is pending first', async () => {
    wrapper = createWrapper()
    other = createWrapper({ criteria: 'exclusion', label: 'Exclusion criteria' })
    await enter(wrapper)
    textarea(wrapper).setValue('pending text')
    await fire(wrapper, 'blur')

    await enter(other)

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_projects/proj1', { inclusion: 'pending text' })
    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
    expect(Api.patch.mock.invocationCallOrder[0]).toBeLessThan(LockService.releaseRef.mock.invocationCallOrder[0])
  })

  it('also when this box was left by switching windows', async () => {
    wrapper = createWrapper()
    other = createWrapper({ criteria: 'exclusion', label: 'Exclusion criteria' })
    await enter(wrapper)
    pageHasFocus = false
    await fire(wrapper, 'blur')
    pageHasFocus = true

    await enter(other)

    expect(LockService.releaseRef).toHaveBeenCalledWith('criteria::inclusion')
  })

  it('entering the same box again does not release it', async () => {
    wrapper = createWrapper()
    await enter(wrapper)
    await fire(wrapper, 'blur')

    await enter(wrapper)

    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })
})
