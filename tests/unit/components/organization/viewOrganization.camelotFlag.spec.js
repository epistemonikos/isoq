import ViewOrganization from '@/components/organization/viewOrganization.vue'

jest.mock('@/utils/Api')
jest.mock('@/services/lockService')

// "New project" opens the form with a copy of `tmp_buffer_project`: that is the methodology default
// the person sees. With ENABLE_CAMELOT off it must be the classic one, or the project would be
// created as CAMELOT without the selector being visible.
describe('viewOrganization.vue — methodology default according to ENABLE_CAMELOT', () => {
  const originalFlag = process.env.ENABLE_CAMELOT
  const initialData = () => ViewOrganization.data.call({ $t: (key) => key, $route: { params: {}, query: {} } })

  afterEach(() => {
    process.env.ENABLE_CAMELOT = originalFlag
  })

  it('on: a new project starts with CAMELOT', () => {
    process.env.ENABLE_CAMELOT = 'on'
    expect(initialData().tmp_buffer_project.use_camelot).toBe(true)
  })

  it('off: a new project starts without CAMELOT', () => {
    process.env.ENABLE_CAMELOT = 'off'
    expect(initialData().tmp_buffer_project.use_camelot).toBe(false)
  })
})
