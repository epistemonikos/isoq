import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListExtractedData from '@/components/list/editListExtractedData.vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

/**
 * Extracted data is edited in the row itself, the way the Adequacy panel did it (Megan:
 * "Standardise the design of the extracted data table to what is currently shown in
 * Adequacy (in-modal edits)"). The same component serves the worksheet page and the
 * Methodological limitations, Coherence and Adequacy panels, so they all edit alike.
 *
 * `mount` with the real `b-table`: what is asserted is what the row shows.
 */
const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const ROWS = [
  { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'texto 1', _v: 4 },
  { ref_id: 'ref2', authors: 'Jones 2021', column_0: 'texto 2' }
]

function deferred () {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function createWrapper ({ permission = true, mode = 'edit', show = { selected: ['ed'] }, hideable } = {}) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = mount(editListExtractedData, {
    localVue,
    attachTo: document.body,
    propsData: {
      ui: { adequacy: { extracted_data: { display_warning: false } } },
      show,
      ...(hideable === undefined ? {} : { hideable }),
      mode,
      list: { id: 'list1', organization: 'org1', project_id: 'proj1' },
      permission,
      extractedData: {
        id: 'ed1',
        fields: [{ key: 'authors' }, { key: 'column_0' }, { key: 'actions' }],
        fieldsObj: [{ key: 'authors' }, { key: 'column_0' }, { key: 'actions' }],
        items: JSON.parse(JSON.stringify(ROWS))
      },
      modePrintFieldObject: [{ key: 'authors' }, { key: 'column_0' }],
      refsWithTitle: []
    },
    mocks: { $t: (key, params) => (params && params.user ? `${key}:${params.user}` : key), $notify },
    stubs: {
      videoHelp: true, 'bc-filters': true, 'back-to-top': true, 'b-modal': true,
      'font-awesome-icon': { props: ['icon'], template: '<i :data-icon="icon" />' }
    }
  })
  return { wrapper, $notify }
}

const byTestId = (wrapper, id) => wrapper.find(`[data-testid="${id}"]`)
const textarea = (wrapper, refId) => byTestId(wrapper, `ed-inline-text-${refId}`)

async function startEditing (wrapper, refId = 'ref1') {
  // The table draws its rows on the tick after `mounted` copies the prop.
  await flushPromises()
  await byTestId(wrapper, `ed-edit-${refId}`).trigger('click')
  await flushPromises()
}

let wrapper
afterEach(() => {
  if (wrapper) wrapper.destroy()
  wrapper = null
  document.body.innerHTML = ''
})

beforeEach(() => {
  jest.clearAllMocks()
  Api.patch.mockReset().mockResolvedValue({ data: {} })
  LockService.acquireRef.mockReset().mockResolvedValue({ success: true })
  LockService.refLocks.clear()
})

describe('editListExtractedData — editing a row in place', () => {
  it('opens the editor in the row, with its text, and no modal for it', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper, 'ref2')

    expect(textarea(wrapper, 'ref2').element.value).toBe('texto 2')
    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(byTestId(wrapper, 'ed-save-ref2').exists()).toBe(true)
    expect(byTestId(wrapper, 'ed-cancel-ref2').exists()).toBe(true)
    expect(wrapper.find('#modal-extracted-data-data').exists()).toBe(false)
  })

  it('asks for the lock of that row of this document', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper, 'ref2')

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ed1::ed::ref2')
  })

  it('one row at a time: the other rows cannot be edited or cleared meanwhile', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper, 'ref1')

    expect(byTestId(wrapper, 'ed-edit-ref2').attributes('disabled')).toBeDefined()
    expect(byTestId(wrapper, 'ed-remove-ref2').attributes('disabled')).toBeDefined()
  })

  it('Cancel closes the editor without writing and releases the row', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('a draft')

    await byTestId(wrapper, 'ed-cancel-ref1').trigger('click')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(wrapper.text()).toContain('texto 1')
    expect(byTestId(wrapper, 'ed-edit-ref2').attributes('disabled')).toBeUndefined()
  })

  it('Save PATCHes only that row, with its `_v`, then closes and releases', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('new text')

    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_extracted_data/ed1/item/ref1',
      { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'new text', _v: 4 })
    expect(wrapper.emitted('getExtractedData')).toEqual([[true]])
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
  })

  it('without edit permission there is nothing to edit', async () => {
    ({ wrapper } = createWrapper({ permission: false }))
    await flushPromises()
    expect(wrapper.text()).toContain('texto 1')
    expect(byTestId(wrapper, 'ed-edit-ref1').exists()).toBe(false)
  })

  it('in view mode there is nothing to edit', async () => {
    ({ wrapper } = createWrapper({ mode: 'view' }))
    await flushPromises()
    expect(byTestId(wrapper, 'ed-edit-ref1').exists()).toBe(false)
    expect(wrapper.text()).toContain('texto 1')
  })

  it('edits the row that was clicked when the table is filtered', async () => {
    // The table on the worksheet page has a filter: the row's position on screen is not its
    // position in the data, so the row is found by its study, never by `data.index`.
    ({ wrapper } = createWrapper())
    wrapper.vm.tableSettings.filter = 'Jones'
    await flushPromises()

    await startEditing(wrapper, 'ref2')

    expect(LockService.acquireRef).toHaveBeenCalledWith('proj1', 'ed1::ed::ref2')
    expect(textarea(wrapper, 'ref2').element.value).toBe('texto 2')
  })
})

// #404: the row lock outlives the save, or the server answers 409 lock_not_held.
// The worksheet page lets the reader hide its sections; that choice is about the page. A
// panel that shows extracted data to assess with keeps it whatever the page shows.
describe('editListExtractedData — hiding the section', () => {
  it('the worksheet page hides it when the reader unticks it', async () => {
    ({ wrapper } = createWrapper({ show: { selected: ['cs'] } }))
    await flushPromises()
    expect(wrapper.text()).not.toContain('texto 1')
  })

  it('a panel that is not hideable shows it anyway', async () => {
    ({ wrapper } = createWrapper({ show: { selected: ['cs'] }, hideable: false }))
    await flushPromises()
    expect(wrapper.text()).toContain('texto 1')
  })
})

describe('editListExtractedData — the row lock outlives the save (#404)', () => {
  it('keeps the editor open, and the lock held, until the PATCH answers', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)
    const patch = deferred()
    Api.patch.mockReturnValueOnce(patch.promise)

    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    await flushPromises()
    expect(textarea(wrapper, 'ref1').exists()).toBe(true)
    expect(LockService.releaseRef).not.toHaveBeenCalled()

    patch.resolve({ data: {} })
    await flushPromises()
    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
  })

  it('sends one PATCH when Save is pressed twice while saving', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)
    const patch = deferred()
    Api.patch.mockReturnValueOnce(patch.promise)

    wrapper.vm.saveRowEdit()
    wrapper.vm.saveRowEdit()
    patch.resolve({ data: {} })
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledTimes(1)
  })

  it('keeps Save disabled while the row lock is being acquired and while saving', async () => {
    ({ wrapper } = createWrapper())
    const acquire = deferred()
    LockService.acquireRef.mockReturnValueOnce(acquire.promise)
    const saveDisabled = () => byTestId(wrapper, 'ed-save-ref1').attributes('disabled')
    await flushPromises()

    await byTestId(wrapper, 'ed-edit-ref1').trigger('click')
    expect(saveDisabled()).toBeDefined()

    acquire.resolve({ success: true })
    await flushPromises()
    expect(saveDisabled()).toBeUndefined()

    const patch = deferred()
    Api.patch.mockReturnValueOnce(patch.promise)
    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    expect(saveDisabled()).toBeDefined()
    patch.resolve({ data: {} })
    await flushPromises()
  })

  it('leaves the editor open with the text when the save fails, and says so', async () => {
    const created = createWrapper()
    wrapper = created.wrapper
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('what I typed')
    Api.patch.mockRejectedValueOnce(Object.assign(new Error('500'), { response: { status: 500 } }))

    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    await flushPromises()

    expect(textarea(wrapper, 'ref1').element.value).toBe('what I typed')
    expect(created.$notify.error).toHaveBeenCalledWith('notifications.save_error')
    expect(LockService.releaseRef).not.toHaveBeenCalled()
  })

  it('turns the editor read-only, keeping the text, when the server says the lock is not held', async () => {
    const created = createWrapper()
    wrapper = created.wrapper
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('what I typed')
    Api.patch.mockRejectedValueOnce(Object.assign(new Error('409'), {
      config: { url: '/isoqf_extracted_data/ed1/item/ref1' },
      response: { status: 409, data: { status: false, reason: 'lock_not_held', locked_by: null } }
    }))

    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    await flushPromises()

    expect(textarea(wrapper, 'ref1').element.value).toBe('what I typed')
    expect(textarea(wrapper, 'ref1').attributes('disabled')).toBeDefined()
    // Already toasted by the Api interceptor (OfflineIndicator).
    expect(created.$notify.error).not.toHaveBeenCalled()
  })

  // The editor is still open: the conflict is a state of the row, so it is a banner in the
  // row, not a toast, and the text stays until the person chooses to reload.
  it('a version conflict leaves a banner in the row, keeps the text, and reloads on request', async () => {
    const created = createWrapper()
    wrapper = created.wrapper
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('what I typed')
    Api.patch.mockRejectedValueOnce(Object.assign(new Error('409'), {
      config: { url: '/isoqf_extracted_data/ed1/item/ref1' },
      response: { status: 409, data: { reason: 'version_conflict' } }
    }))

    await byTestId(wrapper, 'ed-save-ref1').trigger('click')
    await flushPromises()

    expect(byTestId(wrapper, 'row-version-conflict').exists()).toBe(true)
    expect(textarea(wrapper, 'ref1').element.value).toBe('what I typed')
    expect(wrapper.emitted('getExtractedData')).toBeFalsy()
    expect(created.$notify.warning).not.toHaveBeenCalled()

    await byTestId(wrapper, 'row-version-conflict').find('button').trigger('click')
    await flushPromises()

    expect(wrapper.emitted('getExtractedData')).toEqual([[true]])
    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
  })
})

describe('editListExtractedData — the row lock while editing in place', () => {
  it('a lock held by someone else: read-only, and only the banner in the row says who', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const created = createWrapper()
    wrapper = created.wrapper
    await startEditing(wrapper)

    expect(textarea(wrapper, 'ref1').attributes('disabled')).toBeDefined()
    expect(byTestId(wrapper, 'ed-save-ref1').attributes('disabled')).toBeDefined()
    expect(byTestId(wrapper, 'row-readonly-notice').text()).toContain('lock.ref_locked_by:Ana Pérez')
    expect(created.$notify.warning).not.toHaveBeenCalled()
    expect(wrapper.emitted('lock-denied')).toBeTruthy()
  })

  it('the banner explains a refusal by granularity', async () => {
    LockService.acquireRef.mockResolvedValue({
      success: false, lockedBy: 'Ana Pérez', reason: 'locked_at_another_granularity'
    })
    ;({ wrapper } = createWrapper())
    await startEditing(wrapper)

    expect(byTestId(wrapper, 'row-readonly-notice').text()).toContain('lock.locked_at_another_granularity')
  })

  it('with permissions revoked the banner says that', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, permissionDenied: true })
    ;({ wrapper } = createWrapper())
    await startEditing(wrapper)

    expect(byTestId(wrapper, 'row-readonly-notice').text()).toContain('lock.permissions_revoked')
  })

  it('no banner while the row can be edited', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)

    expect(byTestId(wrapper, 'row-readonly-notice').exists()).toBe(false)
    expect(textarea(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
  })

  it('losing the lock with the editor open turns the row read-only and says why', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'ed1::ed::ref1', lockedBy: 'Ana Pérez', reason: 'evicted_granularity_conflict' }
    }))
    await flushPromises()

    expect(textarea(wrapper, 'ref1').attributes('disabled')).toBeDefined()
    expect(byTestId(wrapper, 'row-readonly-notice').text()).toContain('lock.evicted_granularity')
  })

  it('ignores a lost lock of another row', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)

    window.dispatchEvent(new CustomEvent('ref-lock-lost', {
      detail: { refId: 'ed1::ed::ref2', lockedBy: 'Ana Pérez' }
    }))
    await flushPromises()

    expect(textarea(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
  })

  it('a read-only row does not write', async () => {
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    ;({ wrapper } = createWrapper())
    await startEditing(wrapper)

    await wrapper.vm.saveRowEdit()

    expect(Api.patch).not.toHaveBeenCalled()
  })

  it('cancelling a refused row clears its state for the next one', async () => {
    LockService.acquireRef.mockResolvedValueOnce({ success: false, lockedBy: 'Ana Pérez' })
    ;({ wrapper } = createWrapper())
    await startEditing(wrapper, 'ref1')
    await byTestId(wrapper, 'ed-cancel-ref1').trigger('click')

    await startEditing(wrapper, 'ref2')

    expect(textarea(wrapper, 'ref2').attributes('disabled')).toBeUndefined()
    expect(byTestId(wrapper, 'row-readonly-notice').exists()).toBe(false)
  })

  it('a lock granted after Cancel is given back at once', async () => {
    // Cancel is one click away from Edit now: the answer to the acquire can arrive after
    // the editor is gone, and nobody would release that lock until leaving the page.
    ({ wrapper } = createWrapper())
    const acquire = deferred()
    LockService.acquireRef.mockReturnValueOnce(acquire.promise)
    await flushPromises()
    await byTestId(wrapper, 'ed-edit-ref1').trigger('click')
    await byTestId(wrapper, 'ed-cancel-ref1').trigger('click')

    acquire.resolve({ success: true })
    await flushPromises()

    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
    expect(wrapper.vm.lockedRowRef).toBeNull()
  })

  it('releases the lock when the component goes away with the editor open', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)

    wrapper.destroy()
    wrapper = null

    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
  })

  it('closes the editor, without writing, when another person deletes the study', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)
    await textarea(wrapper, 'ref1').setValue('a draft')

    window.dispatchEvent(new CustomEvent('reference-deleted', { detail: { refId: 'ref1' } }))
    await flushPromises()

    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(Api.patch).not.toHaveBeenCalled()
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
  })

  it('cancelRowEdit is what the parent calls to close the editor (a closing panel)', async () => {
    ({ wrapper } = createWrapper())
    await startEditing(wrapper)

    wrapper.vm.cancelRowEdit()
    await flushPromises()

    expect(textarea(wrapper, 'ref1').exists()).toBe(false)
    expect(LockService.releaseRef).toHaveBeenCalledWith('ed1::ed::ref1')
  })
})
