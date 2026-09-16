import { shallowMount, createLocalVue } from '@vue/test-utils'
import AdminStatsTab from '@/components/admin/tabs/AdminStatsTab.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

// Fixed date: 2026-05-12 (Tuesday)
const FIXED_DATE = new Date('2026-05-12T12:00:00.000Z')

const mockStats = {
  users: {
    total: 1842,
    active: 1800,
    inactive: 42,
    email_verified: 1750,
    new_in_range: 48,
    logged_in_range: 930
  },
  projects: {
    total: 4200,
    published: 310,
    new_in_range: 45,
    published_in_range: 12
  },
  range: {
    from: '2026-04-12T00:00:00',
    to: '2026-05-12T23:59:59'
  }
}

jest.mock('@/utils/Api', () => ({
  get: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const makeWrapper = () => shallowMount(AdminStatsTab, {
  localVue,
  mocks: { $t: (key, params) => params ? `${key}:${JSON.stringify(params)}` : key },
  stubs: {
    'b-alert': true, 'b-spinner': true, 'b-row': true, 'b-col': true, 'b-card': true,
    'b-form-input': true, 'b-button': true, 'b-form-select': true, 'b-template': true
  }
})

// ─── buildParams ─────────────────────────────────────────────────────────────

describe('AdminStatsTab.vue — buildParams()', () => {
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(FIXED_DATE)
    Api.get.mockResolvedValue({ data: mockStats })
  })
  afterAll(() => jest.useRealTimers())

  it('last7: returns from=2026-05-06 and to=2026-05-12', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'last7'
    const p = wrapper.vm.buildParams()
    expect(p.from).toBe('2026-05-06')
    expect(p.to).toBe('2026-05-12')
  })

  it('last30: returns from=2026-04-13 and to=2026-05-12', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'last30'
    const p = wrapper.vm.buildParams()
    expect(p.from).toBe('2026-04-13')
    expect(p.to).toBe('2026-05-12')
  })

  it('this_month: from is 2026-05-01, to is today', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'this_month'
    const p = wrapper.vm.buildParams()
    expect(p.from).toBe('2026-05-01')
    expect(p.to).toBe('2026-05-12')
  })

  it('prev_month: from is 2026-04-01, to is 2026-04-30', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'prev_month'
    const p = wrapper.vm.buildParams()
    expect(p.from).toBe('2026-04-01')
    expect(p.to).toBe('2026-04-30')
  })

  it('custom: returns customFrom and customTo when both are set', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'custom'
    wrapper.vm.customFrom = '2026-01-01'
    wrapper.vm.customTo = '2026-01-31'
    const p = wrapper.vm.buildParams()
    expect(p).toEqual({ from: '2026-01-01', to: '2026-01-31' })
  })

  it('custom: omits empty customFrom', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'custom'
    wrapper.vm.customFrom = ''
    wrapper.vm.customTo = '2026-01-31'
    const p = wrapper.vm.buildParams()
    expect(p.from).toBeUndefined()
    expect(p.to).toBe('2026-01-31')
  })

  it('custom: omits empty customTo', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'custom'
    wrapper.vm.customFrom = '2026-01-01'
    wrapper.vm.customTo = ''
    const p = wrapper.vm.buildParams()
    expect(p.from).toBe('2026-01-01')
    expect(p.to).toBeUndefined()
  })

  it('custom: returns empty object when both are empty', () => {
    const wrapper = makeWrapper()
    wrapper.vm.selectedRange = 'custom'
    wrapper.vm.customFrom = ''
    wrapper.vm.customTo = ''
    expect(wrapper.vm.buildParams()).toEqual({})
  })

  it('all quick ranges return YYYY-MM-DD formatted strings', () => {
    const wrapper = makeWrapper()
    for (const range of ['last7', 'last30', 'this_month', 'prev_month']) {
      wrapper.vm.selectedRange = range
      const p = wrapper.vm.buildParams()
      expect(p.from).toMatch(DATE_RE)
      expect(p.to).toMatch(DATE_RE)
    }
  })
})

// ─── loadStats ───────────────────────────────────────────────────────────────

describe('AdminStatsTab.vue — loadStats()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls GET /admin/stats with last30 params on created (default range)', async () => {
    Api.get.mockResolvedValueOnce({ data: mockStats })
    makeWrapper()
    await flushPromises()
    const [url, params] = Api.get.mock.calls[0]
    expect(url).toBe('/admin/stats')
    expect(params).toHaveProperty('from')
    expect(params).toHaveProperty('to')
  })

  it('default selectedRange is last30', () => {
    Api.get.mockResolvedValueOnce({ data: mockStats })
    const wrapper = makeWrapper()
    expect(wrapper.vm.selectedRange).toBe('last30')
  })

  it('stores stats data from response', async () => {
    Api.get.mockResolvedValueOnce({ data: mockStats })
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.stats).toEqual(mockStats)
  })

  it('stores activeRange from response.range', async () => {
    Api.get.mockResolvedValueOnce({ data: mockStats })
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.activeRange).toEqual(mockStats.range)
  })

  it('sets activeRange to null when range is absent', async () => {
    const { range, ...statsWithoutRange } = mockStats
    Api.get.mockResolvedValueOnce({ data: statsWithoutRange })
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.activeRange).toBeNull()
  })

  it('sets isBusy to false after successful load', async () => {
    Api.get.mockResolvedValueOnce({ data: mockStats })
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.isBusy).toBe(false)
  })

  it('sets loadError on generic API failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.loadError).toBe('admin.stats_load_error')
    expect(wrapper.vm.stats).toBeNull()
  })

  it('sets error_invalid_date on 400 invalid_params', async () => {
    Api.get.mockRejectedValueOnce({
      response: { status: 400, data: { result: 'invalid_params', message: 'Invalid date format.' } }
    })
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.loadError).toBe('admin.error_invalid_date')
  })

  it('sets isBusy to false after failure', async () => {
    Api.get.mockRejectedValueOnce(new Error('Network error'))
    const wrapper = makeWrapper()
    await flushPromises()
    expect(wrapper.vm.isBusy).toBe(false)
  })
})

// ─── onRangeChange ───────────────────────────────────────────────────────────

describe('AdminStatsTab.vue — onRangeChange()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls loadStats when range is not custom', async () => {
    Api.get.mockResolvedValue({ data: mockStats })
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    Api.get.mockResolvedValueOnce({ data: mockStats })
    wrapper.vm.selectedRange = 'last7'
    wrapper.vm.onRangeChange()
    await flushPromises()
    expect(Api.get).toHaveBeenCalledTimes(1)
  })

  it('does not call loadStats when range is custom', async () => {
    Api.get.mockResolvedValue({ data: mockStats })
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    wrapper.vm.selectedRange = 'custom'
    wrapper.vm.onRangeChange()
    await flushPromises()
    expect(Api.get).not.toHaveBeenCalled()
  })
})

// ─── card groups ─────────────────────────────────────────────────────────────

describe('AdminStatsTab.vue — card definitions', () => {
  beforeEach(() => {
    Api.get.mockResolvedValue({ data: mockStats })
  })

  it('userHistoricalCards has 4 historical keys without range', () => {
    const wrapper = makeWrapper()
    const keys = wrapper.vm.userHistoricalCards.map(c => c.key)
    expect(keys).toEqual(expect.arrayContaining(['total', 'active', 'inactive', 'email_verified']))
    expect(keys).not.toContain('new_in_range')
    expect(keys).not.toContain('logged_in_range')
  })

  it('userPeriodCards has new_in_range and logged_in_range', () => {
    const wrapper = makeWrapper()
    const keys = wrapper.vm.userPeriodCards.map(c => c.key)
    expect(keys).toContain('new_in_range')
    expect(keys).toContain('logged_in_range')
    expect(keys).not.toContain('new_this_week')
    expect(keys).not.toContain('new_this_month')
  })

  it('projectHistoricalCards has total and published', () => {
    const wrapper = makeWrapper()
    const keys = wrapper.vm.projectHistoricalCards.map(c => c.key)
    expect(keys).toContain('total')
    expect(keys).toContain('published')
    expect(keys).not.toContain('new_in_range')
  })

  it('projectPeriodCards has new_in_range and published_in_range', () => {
    const wrapper = makeWrapper()
    const keys = wrapper.vm.projectPeriodCards.map(c => c.key)
    expect(keys).toContain('new_in_range')
    expect(keys).toContain('published_in_range')
  })
})
