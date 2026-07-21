import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import actionButtons from '@/components/project/actionButtons.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

// user.personal_organization deliberately does NOT match org_id, so
// checkPermissions('can_write') falls through to checking project.can_write/can_read
// instead of short-circuiting to true — letting these tests control the transition.
function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
      $notify
    },
    stubs
  })
  // BootstrapVue installs $bvToast via beforeCreate, overwriting mocks — spy on the
  // real instance after mount instead (same pattern as viewProject.locks.spec.js).
  const bvToastToast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
  return { wrapper, $notify, bvToastToast }
}

describe('viewProject.vue — refreshPermissions()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('updates project.can_write/can_read without touching other project fields', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1', name: 'Custom Name', can_write: [1], can_read: [] } })
    Api.get.mockResolvedValueOnce({ data: { can_write: [], can_read: [1] } })

    await wrapper.vm.refreshPermissions()

    expect(wrapper.vm.project.can_write).toEqual([])
    expect(wrapper.vm.project.can_read).toEqual([1])
    expect(wrapper.vm.project.name).toBe('Custom Name')
    wrapper.destroy()
  })

  describe('reactivity regression: initial payload omits can_write entirely', () => {
    it('canWrite computed updates after refreshPermissions even when the project was first loaded without a can_write key', async () => {
      const { wrapper } = createWrapper()
      // Let any Api.get call triggered by mount settle first, so it doesn't consume
      // the mockResolvedValueOnce meant for the explicit getProject() call below.
      await flushPromises()
      // Simulates the backend omitting can_write for a user who currently only has
      // can_read — checkPermissions()'s hasOwnProperty guard must not prevent Vue
      // from tracking can_write as a dependency once it's added later via $set.
      Api.get.mockResolvedValueOnce({ data: { id: 'proj1', can_read: [1] } })
      await wrapper.vm.getProject()
      await flushPromises()

      expect(wrapper.vm.canWrite).toBe(false)

      Api.get.mockResolvedValueOnce({ data: { can_write: [1], can_read: [1] } })
      await wrapper.vm.refreshPermissions()

      expect(wrapper.vm.canWrite).toBe(true)
      wrapper.destroy()
    })
  })

  describe('downgrade: user loses can_write', () => {
    it('drops mode from edit to view and shows a toast when currently editing', async () => {
      const { wrapper, bvToastToast } = createWrapper()
      await wrapper.setData({
        project: { id: 'proj1', can_write: [1], can_read: [] },
        mode: 'edit'
      })
      Api.get.mockResolvedValueOnce({ data: { can_write: [], can_read: [1] } })

      await wrapper.vm.refreshPermissions()

      expect(wrapper.vm.mode).toBe('view')
      expect(bvToastToast).toHaveBeenCalledWith('lock.permissions_revoked', expect.objectContaining({
        title: 'notifications.error'
      }))
      wrapper.destroy()
    })

    it('does not change mode or show a toast when the user was already in view mode', async () => {
      const { wrapper, bvToastToast } = createWrapper()
      await wrapper.setData({
        project: { id: 'proj1', can_write: [1], can_read: [] },
        mode: 'view'
      })
      Api.get.mockResolvedValueOnce({ data: { can_write: [], can_read: [1] } })

      await wrapper.vm.refreshPermissions()

      expect(wrapper.vm.mode).toBe('view')
      expect(bvToastToast).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  describe('upgrade: user gains can_write', () => {
    it('switches mode to edit and shows a toast, so editing is available without an extra click', async () => {
      const { wrapper, bvToastToast } = createWrapper()
      await wrapper.setData({
        project: { id: 'proj1', can_write: [], can_read: [1] },
        mode: 'view'
      })
      Api.get.mockResolvedValueOnce({ data: { can_write: [1], can_read: [1] } })

      await wrapper.vm.refreshPermissions()

      expect(wrapper.vm.mode).toBe('edit')
      expect(bvToastToast).toHaveBeenCalledWith('lock.permissions_granted', expect.objectContaining({
        title: 'notifications.success'
      }))
      wrapper.destroy()
    })
  })

  describe('no change', () => {
    it('does not touch mode or show a toast when can_write is unchanged', async () => {
      const { wrapper, bvToastToast } = createWrapper()
      await wrapper.setData({
        project: { id: 'proj1', can_write: [1], can_read: [] },
        mode: 'edit'
      })
      Api.get.mockResolvedValueOnce({ data: { can_write: [1], can_read: [] } })

      await wrapper.vm.refreshPermissions()

      expect(wrapper.vm.mode).toBe('edit')
      expect(bvToastToast).not.toHaveBeenCalled()
      wrapper.destroy()
    })
  })

  it('fails silently (no throw) when the request errors', async () => {
    const { wrapper } = createWrapper()
    await wrapper.setData({ project: { id: 'proj1', can_write: [1], can_read: [] }, mode: 'edit' })
    Api.get.mockRejectedValueOnce(new Error('network error'))

    await expect(wrapper.vm.refreshPermissions()).resolves.not.toThrow()
    expect(wrapper.vm.mode).toBe('edit')
    wrapper.destroy()
  })
})

describe('viewProject.vue — route watchers trigger refreshPermissions()', () => {
  it('calls refreshPermissions when $route.query.tab changes', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    const spy = jest.spyOn(wrapper.vm, 'refreshPermissions').mockResolvedValue()

    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, 'iSoQ')

    expect(spy).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('calls refreshPermissions when $route.query.step changes', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    const spy = jest.spyOn(wrapper.vm, 'refreshPermissions').mockResolvedValue()

    wrapper.vm.$options.watch['$route.query.step'].call(wrapper.vm, '3')

    expect(spy).toHaveBeenCalled()
    wrapper.destroy()
  })
})

describe('viewProject.vue — tab change re-derives mode (iSoQ preview must not leak across tabs)', () => {
  it('restores edit mode on tab change when the user has can_write (leftover iSoQ preview view mode)', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'refreshPermissions').mockResolvedValue()
    // user id 1 has write; mode='view' simulates the iSoQ "Print or export" toggle
    await wrapper.setData({ project: { id: 'proj1', can_write: [1], can_read: [1] }, mode: 'view' })

    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, 'Project-Property')
    await flushPromises()

    expect(wrapper.vm.mode).toBe('edit')
    wrapper.destroy()
  })

  it('keeps view mode on tab change when the user only has can_read', async () => {
    const { wrapper } = createWrapper()
    await flushPromises()
    jest.spyOn(wrapper.vm, 'refreshPermissions').mockResolvedValue()
    await wrapper.setData({ project: { id: 'proj1', can_write: [], can_read: [1] }, mode: 'view' })

    wrapper.vm.$options.watch['$route.query.tab'].call(wrapper.vm, 'Project-Property')
    await flushPromises()

    expect(wrapper.vm.mode).toBe('view')
    wrapper.destroy()
  })
})

describe('viewProject.vue — end-to-end: real actionButtons child reacts to refreshPermissions()', () => {
  // Mounts the REAL actionButtons.vue (instead of stubbing it) to prove the reactive
  // chain actually reaches the DOM: project.can_write -> canWrite computed -> the
  // :canWrite prop -> the "Edit" button's v-if. A stubbed child can't catch a broken
  // link anywhere in that chain.
  function createWrapperWithRealActionButtons () {
    const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    const wrapper = shallowMount(viewProject, {
      localVue,
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
        $router: { push: jest.fn() },
        $store: { state: { user: { personal_organization: 'other-org', id: 1 } } },
        $notify
      },
      stubs: { ...stubs, 'action-buttons': actionButtons }
    })
    const bvToastToast = jest.spyOn(wrapper.vm.$bvToast, 'toast').mockImplementation(() => {})
    return { wrapper, $notify, bvToastToast }
  }

  function findButtonByText (wrapper, text) {
    return wrapper.findAll('b-button-stub').filter(w => w.text().includes(text))
  }

  it('drops the user straight into edit mode after an upgrade, and back to read-only after a downgrade', async () => {
    const { wrapper } = createWrapperWithRealActionButtons()
    // Let every Api.get call triggered by mount (getProject, getLists, etc.) settle
    // before taking control of the mock — otherwise mockResolvedValueOnce can be
    // consumed by one of those unrelated calls instead of refreshPermissions()'s own.
    await flushPromises()
    await wrapper.setData({
      project: { id: 'proj1', can_write: [], can_read: [1] },
      mode: 'view'
    })
    await wrapper.vm.$nextTick()
    expect(findButtonByText(wrapper, 'actionButtons.edit').length).toBe(0)

    Api.get.mockResolvedValueOnce({ data: { can_write: [1], can_read: [1] } })
    await wrapper.vm.refreshPermissions()
    await wrapper.vm.$nextTick()

    // Upgrade lands the user directly in edit mode — no extra click needed. The real
    // actionButtons child now shows the edit-mode toggle ("switch back to print/view"),
    // not the "Edit" entry button, confirming the switch actually reached the DOM.
    expect(wrapper.vm.mode).toBe('edit')
    expect(findButtonByText(wrapper, 'actionButtons.edit').length).toBe(0)
    expect(findButtonByText(wrapper, 'actionButtons.print_or_export').length).toBe(1)

    Api.get.mockResolvedValueOnce({ data: { can_write: [], can_read: [1] } })
    await wrapper.vm.refreshPermissions()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.mode).toBe('view')
    expect(findButtonByText(wrapper, 'actionButtons.edit').length).toBe(0)
    expect(findButtonByText(wrapper, 'actionButtons.print_or_export').length).toBe(0)
    wrapper.destroy()
  })
})
