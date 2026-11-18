import { mount, createLocalVue } from '@vue/test-utils'
import Browse from '@/components/Browse.vue'
import BootstrapVue from 'bootstrap-vue'

const Api = require('@/utils/Api')

const localVue = createLocalVue()
localVue.use(BootstrapVue)

jest.mock('@/utils/Api', () => ({ get: jest.fn().mockResolvedValue({ data: [] }) }))

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))
const DATE_OPTIONS = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }

// Browse listed the projects by name and only the name could be sorted. The publication
// date (`published_at`) only exists since 2026-10-07: projects published earlier have none,
// show a dash and go last whatever the direction.
describe('Browse sorts by publication date', () => {
  beforeEach(() => jest.clearAllMocks())

  const PROJECTS = [
    { id: 'a', name: 'Alpha (no date)', last_update: 1500000000000 },
    { id: 'b', name: 'Bravo (October)', last_update: 1700000000000, published_at: '2026-10-20T10:00:00.123000' },
    { id: 'c', name: 'Charlie (November)', last_update: 1600000000000, published_at: '2026-11-05T11:01:15.795000' }
  ]

  const mountIt = async (data = PROJECTS) => {
    Api.get.mockResolvedValueOnce({ data })
    const wrapper = mount(Browse, {
      localVue,
      mocks: { $t: (k) => k },
      stubs: { 'b-link': { template: '<a><slot /></a>' } }
    })
    for (let i = 0; i < 3; i++) await flushPromises()
    return wrapper
  }
  const rowNames = wrapper => wrapper.findAll('tbody tr').wrappers.map(r => r.find('td').text())
  const header = (wrapper, label) => wrapper.findAll('thead th').wrappers.find(th => th.text().includes(label))

  it('lists the most recently published first, and projects without a date last', async () => {
    const wrapper = await mountIt()
    expect(rowNames(wrapper)).toEqual(['Charlie (November)', 'Bravo (October)', 'Alpha (no date)'])
    wrapper.destroy()
  })

  it('keeps projects without a date last when the order is reversed', async () => {
    const wrapper = await mountIt()
    await header(wrapper, 'browse.published').trigger('click')
    expect(rowNames(wrapper)).toEqual(['Bravo (October)', 'Charlie (November)', 'Alpha (no date)'])
    wrapper.destroy()
  })

  it('shows a dash for a project without a publication date', async () => {
    const wrapper = await mountIt([PROJECTS[0]])
    expect(wrapper.find('[data-test="browse-published-at"]').text()).toBe('—')
    wrapper.destroy()
  })

  it('reads the naive server datetime as UTC', async () => {
    // The server sends `isoformat()` without an offset. Read as local time, 01:00 UTC on
    // 5 November would show 5 November west of UTC, where it is still the 4th. (Jest keeps a
    // per-file copy of process.env, so the zone cannot be pinned here: this catches the bug in
    // any zone but UTC, where it has no effect.)
    const wrapper = await mountIt([{ id: 'd', name: 'Delta', last_update: 0, published_at: '2026-11-05T01:00:00' }])
    const expected = new Date(Date.UTC(2026, 10, 5, 1)).toLocaleDateString(undefined, DATE_OPTIONS)
    expect(wrapper.find('[data-test="browse-published-at"]').text()).toBe(expected)
    wrapper.destroy()
  })

  it('lets the last modification be sorted too', async () => {
    const wrapper = await mountIt()
    await header(wrapper, 'browse.last_modification').trigger('click')
    expect(rowNames(wrapper)).toEqual(['Alpha (no date)', 'Charlie (November)', 'Bravo (October)'])
    wrapper.destroy()
  })
})
