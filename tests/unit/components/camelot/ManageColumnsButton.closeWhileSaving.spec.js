import { shallowMount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import columnService from '@/services/columnService'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api', () => ({
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/columnService', () => ({
  __esModule: true,
  default: {
    addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
    renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
    deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
    reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
    ensureTableDocument: jest.fn(() => Promise.resolve('char_creado')),
    movableKeys: jest.requireActual('@/services/columnService').movableKeys
  }
}))

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn(() => Promise.resolve({ success: true })),
    releaseRef: jest.fn(() => Promise.resolve())
  }
}))

const CHARS = {
  id: 'char1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_a', label: 'Contexto' },
    { key: 'context_extractedData', label: 'CAMELOT' },
    { key: 'context_comments', label: 'Comentarios' }
  ],
  items: []
}

function createWrapper (charsData = CHARS) {
  return shallowMount(ManageColumnsButton, {
    propsData: { charsData, visibleColumnKeys: ['authors', 'column_a'], canEdit: true },
    mocks: {
      $t: (key, params) => params ? `${key} ${JSON.stringify(params)}` : key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: {
        show: jest.fn(),
        hide: jest.fn(),
        msgBoxConfirm: jest.fn(() => Promise.resolve(true))
      },
      $bvToast: { toast: jest.fn() }
    },
    stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
  })
}

const deferred = () => { let resolve; const promise = new Promise(res => { resolve = res }); return { promise, resolve } }

// #393: closing the columns modal while a new column was being created released the
// fields lock under it (the create then got 409 lock_not_held and the column was lost)
// and cleared the modal, so no order was sent for it. Closing now waits for it.
describe('ManageColumnsButton — closing while a column is being created (#393)', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = createWrapper()
    wrapper.vm.openColumnsModal()
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  function startCreating () {
    const add = deferred()
    columnService.addColumn.mockReturnValueOnce(add.promise)
    const field = { id: 'f-new', label: 'New' }
    wrapper.vm.columnDefinitions.unshift(field)
    wrapper.vm.onFieldCommitted(field)
    return add
  }

  it('releases the columns lock only after the column has been created', async () => {
    const add = startCreating()
    await flushPromises()
    const closing = wrapper.vm.onModalHidden()
    await flushPromises()
    expect(LockService.releaseRef).not.toHaveBeenCalled()

    add.resolve({ key: 'column_nueva', response: { data: {} } })
    await closing
    expect(LockService.releaseRef).toHaveBeenCalled()
    expect(columnService.addColumn.mock.invocationCallOrder[0])
      .toBeLessThan(LockService.releaseRef.mock.invocationCallOrder[0])
  })

  it('still puts the new column first when the modal closed while it was being created', async () => {
    const add = startCreating()
    await flushPromises()
    const closing = wrapper.vm.onModalHidden()
    add.resolve({ key: 'column_nueva', response: { data: {} } })
    await closing
    const orders = columnService.reorderColumns.mock.calls.map(c => c[2])
    expect(orders.some(order => order[0] === 'column_nueva')).toBe(true)
  })
})
