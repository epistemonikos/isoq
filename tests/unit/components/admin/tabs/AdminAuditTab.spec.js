import { shallowMount, createLocalVue } from '@vue/test-utils'
import AdminAuditTab from '@/components/admin/tabs/AdminAuditTab.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api', () => ({
  get: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeEvent = (overrides = {}) => ({
  id: 'evt1',
  timestamp: '2026-05-12T15:30:00.000000',
  action: 'forced_login',
  actor_id: 'actor_id',
  actor_username: 'soporte@episte.cl',
  target_id: 'target_id',
  target_username: 'usuario@test.com',
  ip: '192.168.1.1',
  details: {},
  ...overrides
})

const makeResponse = (events = [makeEvent()], total = 1) => ({
  data: { events, total, limit: 50, offset: 0 }
})

const makeWrapper = () => shallowMount(AdminAuditTab, {
  localVue,
  mocks: { $t: key => key },
  stubs: {
    'b-alert': true, 'b-spinner': true, 'b-row': true, 'b-col': true,
    'b-table': true, 'b-pagination': true, 'b-form-select': true,
    'b-form-input': true, 'b-badge': true
  }
})

describe('AdminAuditTab.vue — loadEvents()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls GET /admin/audit on created', async () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    makeWrapper()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/audit', expect.objectContaining({ _limit: 50, _offset: 0 }))
  })

  it('stores events and total from response', async () => {
    const events = [makeEvent(), makeEvent({ id: 'evt2' })]
    Api.get.mockResolvedValueOnce(makeResponse(events, 2))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.events).toHaveLength(2)
    expect(wrapper.vm.total).toBe(2)
  })

  it('sets isBusy to false after successful load', async () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.isBusy).toBe(false)
  })

  it('sets loadError on API failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.loadError).toBe('admin.audit_load_error')
  })

  it('uses correct offset when loading page 2', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce(makeResponse())
    wrapper.vm.goToPage(2)
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/audit', expect.objectContaining({ _offset: 50 }))
  })

  it('includes action filter when set', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce(makeResponse())
    wrapper.vm.filterAction = 'forced_login'
    wrapper.vm.onFilterChange()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledWith('/admin/audit', expect.objectContaining({ action: 'forced_login' }))
  })

  it('omits action param when filter is empty', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce(makeResponse())
    wrapper.vm.filterAction = ''
    wrapper.vm.onFilterChange()
    await flushPromises()
    const callParams = Api.get.mock.calls[0][1]
    expect(callParams.action).toBeUndefined()
  })

  it('resets to page 1 when filter changes', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.currentPage = 3
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce(makeResponse())
    wrapper.vm.onFilterChange()
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(1)
  })

  it('resets to page 1 when perPage changes', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    wrapper.vm.currentPage = 3
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce(makeResponse())
    wrapper.vm.onPerPageChange()
    await flushPromises()
    expect(wrapper.vm.currentPage).toBe(1)
  })
})

describe('AdminAuditTab.vue — formatDetails()', () => {
  it('returns empty string for null details', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.formatDetails(null)).toBe('')
  })

  it('formats fields array', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.formatDetails({ fields: ['first_name', 'last_name'] })).toBe('first_name, last_name')
  })

  it('formats tokens_deleted', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.formatDetails({ tokens_deleted: 3 })).toBe('3 token(s)')
  })
})

describe('AdminAuditTab.vue — actionVariant()', () => {
  it('returns danger for admin_delete_user', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.actionVariant('admin_delete_user')).toBe('danger')
  })

  it('returns secondary for unknown actions', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.actionVariant('unknown_action')).toBe('secondary')
  })
})
