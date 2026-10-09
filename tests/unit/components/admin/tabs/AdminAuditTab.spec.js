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

// ─── Filtros de actor y destinatario por email ────────────────────────────────
//
// Los cuadros se mandaban como actor_id/target_id y el servidor comparaba contra el ID
// interno: un email no encontraba nada. `actor`/`target` aceptan el ID o parte del email.
describe('AdminAuditTab.vue — filtros por email', () => {
  beforeEach(() => jest.clearAllMocks())

  it('manda actor y target, no actor_id ni target_id', async () => {
    Api.get.mockResolvedValue(makeResponse())
    const wrapper = makeWrapper()
    await flushPromises()
    jest.clearAllMocks()
    wrapper.vm.filterActor = ' ana@ '
    wrapper.vm.filterTarget = 'teresa'
    wrapper.vm.onFilterChange()
    await flushPromises()
    const params = Api.get.mock.calls[0][1]
    expect(params).toEqual(expect.objectContaining({ actor: 'ana@', target: 'teresa' }))
    expect(params).not.toHaveProperty('actor_id')
    expect(params).not.toHaveProperty('target_id')
  })
})

// ─── Despublicar desde el panel ───────────────────────────────────────────────
//
// `admin_unpublish_project` lleva en details el proyecto y un motivo de lista cerrada. Sin
// entrada propia caía en JSON crudo y el filtro de acción no lo ofrecía.
describe('AdminAuditTab.vue — despublicación por admin', () => {
  beforeEach(() => jest.clearAllMocks())

  it('el filtro de acción lo ofrece', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.actionOptions.map(o => o.value)).toContain('admin_unpublish_project')
  })

  it('muestra el motivo traducido y el proyecto', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    const details = { project_id: 'p1', reason: 'personal_data', previous_public_type: 'open_access' }
    expect(wrapper.vm.formatDetails(details)).toBe('admin.unpublish_reason_personal_data (p1)')
  })

  it('dice si se revocó el enlace y si el correo no salió', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    const details = {
      project_id: 'p1', reason: 'personal_data', owner_notified: false, shared_link_revoked: true
    }
    expect(wrapper.vm.formatDetails(details)).toBe(
      'admin.unpublish_reason_personal_data (p1) · admin.audit_shared_link_revoked · admin.audit_owner_not_notified'
    )
  })

  it('se marca como acción de peligro', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.actionVariant('admin_unpublish_project')).toBe('danger')
  })
})

// ─── Traspaso de proyectos al borrar una cuenta ───────────────────────────────
//
// `project_ownership_transferred` va a nombre de quien hereda, con la vía (self | admin |
// inactivity) y si se le avisó. El borrado lleva `transferred_to` con los ids.
describe('AdminAuditTab.vue — traspaso de proyectos', () => {
  beforeEach(() => jest.clearAllMocks())

  it('el filtro de acción lo ofrece', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    expect(wrapper.vm.actionOptions.map(o => o.value)).toContain('project_ownership_transferred')
  })

  it('muestra la vía traducida y el proyecto', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    const details = { project_id: 'p1', via: 'admin', heir_notified: true }
    expect(wrapper.vm.formatDetails(details)).toBe('admin.transfer_via_admin (p1)')
  })

  it('dice si a quien hereda no le llegó el correo', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    const details = { project_id: 'p1', via: 'self', heir_notified: false }
    expect(wrapper.vm.formatDetails(details)).toBe('admin.transfer_via_self (p1) · admin.audit_heir_not_notified')
  })

  it('en el borrado dice cuántos proyectos se traspasaron, junto al motivo', () => {
    Api.get.mockResolvedValueOnce(makeResponse())
    const wrapper = makeWrapper()
    const details = { reason: 'violation', transferred_to: { p1: 'u1', p2: 'u2' } }
    expect(wrapper.vm.formatDetails(details)).toBe('reason: violation · admin.audit_projects_transferred')
  })
})
