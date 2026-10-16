import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))
const deferred = () => { let resolve, reject; const promise = new Promise((res, rej) => { resolve = res; reject = rej }); return { promise, resolve, reject } }

const stagesWith = (leafPatch = {}) => [{
  key: 0,
  options: [
    { option: 'A', text: 'mine', notes: '', ...leafPatch },
    { option: null, text: '', notes: '' },
    { option: null, text: '', notes: '' },
    { option: null, text: '', notes: '' }
  ]
}]
const assessmentsWith = (leafPatch) => ({
  id: 'assess1',
  items: [{ ref_id: 'ref1', authors: 'Author 2024', stages: stagesWith(leafPatch) }]
})
const savedDoc = (version, leaf = {}) => ({
  data: { id: 'assess1', items: [{ ref_id: 'ref1', stages: stagesWith({ ...leaf, _v: version }) }] }
})
const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
const mountWith = (leafPatch) => mount(AssessmentForm, {
  localVue,
  propsData: { selectedMeta: 0, modalStage: 0, modalIndex: 0, refId: 'ref1', assessments: assessmentsWith(leafPatch) },
  mocks: { $t: key => key, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal: { show: jest.fn(), hide: jest.fn() }, $notify },
  stubs: {
    'b-card': true, 'b-form-group': true, 'b-form-radio-group': true, 'b-form-radio': true,
    'b-form-textarea': true, 'b-button': true, 'b-modal': true
  }
})
const payloads = () => Api.patch.mock.calls.map(c => c[1])
const versionConflict = (option) => Object.assign(new Error('409'), {
  config: { url: '/isoqf_assessments/assess1/item/ref1/stage/0/option/0' },
  response: { status: 409, data: { status: false, reason: 'version_conflict', option } }
})

// #395: one person, one browser, and the Step 4 cell answered "Someone else saved
// changes here" with identical content on both sides. The autosave (1.5 s) went out
// with _v=N, Save (or "Do it later") went out before its answer with the same N, and
// the second PATCH met N+1 on the server.
describe('AssessmentForm — saves of one cell go one after another (#395)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.get.mockResolvedValue({ data: [] })
    Api.patch.mockResolvedValue({ data: {} })
  })

  it('does not send a second PATCH while the first is on its way', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.performSave(true)
    await flushPromises()
    wrapper.vm.performSave(false)
    await flushPromises()
    expect(Api.patch).toHaveBeenCalledTimes(1)
    first.resolve(savedDoc(5, { text: 'one' }))
    await flushPromises(); await flushPromises()
    expect(Api.patch).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('sends the queued save with the version the first one left', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.performSave(true)
    await flushPromises()
    wrapper.vm.performSave(false)
    first.resolve(savedDoc(5, { text: 'one' }))
    await flushPromises(); await flushPromises()
    expect(payloads().map(p => p._v)).toEqual([4, 5])
    wrapper.destroy()
  })

  it('reads the fields when the queued save runs, not when it was queued', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.performSave(true)
    await flushPromises()
    wrapper.vm.performSave(false)
    await wrapper.setData({ text1: 'two' })
    first.resolve(savedDoc(5, { text: 'one' }))
    await flushPromises(); await flushPromises()
    expect(payloads()[1].text).toBe('two')
    wrapper.destroy()
  })

  it('collapses the saves asked for while one is on its way into one', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.performSave(true)
    await flushPromises()
    wrapper.vm.performSave(true)
    wrapper.vm.performSave(false)
    wrapper.vm.performSave(true)
    first.resolve(savedDoc(5, { text: 'one' }))
    await flushPromises(); await flushPromises()
    expect(Api.patch).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  it('returns a promise that settles after the queued save too', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.performSave(true)
    const queued = wrapper.vm.performSave(false)
    let settled = false
    queued.then(() => { settled = true })
    await flushPromises()
    expect(settled).toBe(false)
    first.resolve(savedDoc(5, { text: 'one' }))
    await queued
    expect(Api.patch).toHaveBeenCalledTimes(2)
    wrapper.destroy()
  })

  // StepFour waits on this before releasing the cell's lock (settlePendingWrites).
  it('lets whoever leaves wait for a manual save on its way, with no autosave pending', async () => {
    const wrapper = mountWith({ _v: 4 })
    const first = deferred()
    Api.patch.mockReturnValueOnce(first.promise)
    await wrapper.setData({ text1: 'one' })
    wrapper.vm.saveNow()
    await flushPromises()
    const pending = wrapper.vm.flushPendingEdits()
    expect(pending).toBeInstanceOf(Promise)
    let settled = false
    pending.then(() => { settled = true })
    await flushPromises()
    expect(settled).toBe(false)
    first.resolve(savedDoc(5, { text: 'one' }))
    await pending
    wrapper.destroy()
  })

  it('stamps the new version on the cell of the shared document, not only in the form', async () => {
    const wrapper = mountWith({ _v: 4 })
    Api.patch.mockResolvedValueOnce(savedDoc(5, { text: 'one' }))
    await wrapper.setData({ text1: 'one' })
    await wrapper.vm.performSave(false)
    await flushPromises()
    expect(wrapper.props('assessments').items[0].stages[0].options[0]._v).toBe(5)
    wrapper.destroy()
  })

  it('takes a version conflict over identical content as saved, and absorbs its version', async () => {
    const wrapper = mountWith({ _v: 4 })
    await wrapper.setData({ selected: 'D', text1: 'same', notes: '' })
    Api.patch.mockRejectedValueOnce(versionConflict({ option: 'D', text: 'same', notes: '', _v: 7 }))
    await wrapper.vm.performSave(false)
    await flushPromises()
    expect(wrapper.vm.versionConflict).toBe(false)
    expect(wrapper.vm.leafVersion).toBe(7)
    wrapper.destroy()
  })

  it('still shows the conflict when what is stored differs from what was sent', async () => {
    const wrapper = mountWith({ _v: 4 })
    await wrapper.setData({ selected: 'D', text1: 'mine now', notes: '' })
    Api.patch.mockRejectedValueOnce(versionConflict({ option: 'B', text: 'theirs', notes: '', _v: 7 }))
    await wrapper.vm.performSave(false)
    await flushPromises()
    expect(wrapper.vm.versionConflict).toBe(true)
    wrapper.destroy()
  })
})
