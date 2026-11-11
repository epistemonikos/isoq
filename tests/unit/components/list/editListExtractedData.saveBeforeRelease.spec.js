import { shallowMount, createLocalVue } from '@vue/test-utils'
import editListExtractedData from '@/components/list/editListExtractedData.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const ROWS = [
  { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'texto 1' },
  { ref_id: 'ref2', authors: 'Jones 2021', column_0: 'texto 2' }
]

function deferred () {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

function createWrapper () {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const wrapper = shallowMount(editListExtractedData, {
    localVue,
    propsData: {
      ui: {},
      show: { selected: ['ed'] },
      mode: 'edit',
      list: { id: 'list1', organization: 'org1', project_id: 'proj1' },
      permission: true,
      extractedData: { id: 'ed1', fields: [{ key: 'column_0' }, { key: 'actions' }], fieldsObj: [], items: ROWS },
      modePrintFieldObject: [],
      refsWithTitle: []
    },
    mocks: { $t: key => key, $route: { params: { org_id: 'org1', id: 'list1' } }, $notify },
    stubs: {
      videoHelp: true, 'bc-filters': true, 'back-to-top': true,
      'b-table': true, 'b-button': true, 'font-awesome-icon': true,
      'b-modal': true, 'b-form-group': true, 'b-alert': true
    }
  })
  // BootstrapVue's own $bvModal cannot be mocked away; spy on the instance's.
  jest.spyOn(wrapper.vm.$bvModal, 'hide').mockImplementation(() => {})
  wrapper.vm.$refs['modal-extracted-data-remove-data-item'] = { show: jest.fn(), hide: jest.fn() }
  return { wrapper, $notify }
}

const okEvent = () => ({ preventDefault: jest.fn() })
const removerClosed = wrapper => wrapper.vm.$bvModal.hide.mock.calls
  .some(c => c[0] === 'modal-extracted-data-remove-data-item')

// #404: closing at once let the modal's `hidden` release the row lock while the PATCH was
// still on its way, so the server answered 409 lock_not_held. The in-place editor's side of
// this is in `editListExtractedData.inline.spec.js`; the clear-row confirmation is a modal.
describe('editListExtractedData — the row lock outlives the clear-row write (#404)', () => {
  beforeEach(() => {
    Api.patch.mockReset().mockResolvedValue({ data: {} })
    LockService.acquireRef.mockReset().mockResolvedValue({ success: true })
    LockService.releaseRef.mockReset()
  })

  it('waits for the PATCH before closing the clear-row confirmation', async () => {
    const { wrapper } = createWrapper()
    wrapper.vm.openModalExtractedDataRemoveDataItem('ref1')
    await flushPromises()
    const patch = deferred()
    Api.patch.mockReturnValueOnce(patch.promise)

    const evt = okEvent()
    wrapper.vm.onRemoveRowOk(evt)
    await flushPromises()
    expect(evt.preventDefault).toHaveBeenCalled()
    expect(removerClosed(wrapper)).toBe(false)
    expect(LockService.releaseRef).not.toHaveBeenCalled()

    patch.resolve({ data: {} })
    await flushPromises()
    expect(removerClosed(wrapper)).toBe(true)
  })

  it('clears the row that was clicked, found by its study', async () => {
    const { wrapper } = createWrapper()
    wrapper.vm.openModalExtractedDataRemoveDataItem('ref2')
    await flushPromises()

    wrapper.vm.onRemoveRowOk(okEvent())
    await flushPromises()

    expect(Api.patch).toHaveBeenCalledWith('/isoqf_extracted_data/ed1/item/ref2',
      expect.objectContaining({ ref_id: 'ref2', column_0: '' }))
  })
})
