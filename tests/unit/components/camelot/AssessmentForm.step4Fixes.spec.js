import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

const leafs = (n) => Array.from({ length: n }, () => ({ option: null, text: '', notes: '' }))
const doc = () => ({
  id: 'assess1',
  items: [{ ref_id: 'ref1', authors: 'Author 2024', stages: [{ key: 0, options: leafs(4) }, { key: 1, options: leafs(4) }, { key: 2, options: leafs(1) }, { key: 3, options: leafs(1) }] }]
})

function createWrapper (assessments = doc()) {
  const $notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
  const $bvModal = { show: jest.fn(), hide: jest.fn() }
  const wrapper = mount(AssessmentForm, {
    localVue,
    propsData: { selectedMeta: 0, modalStage: 0, modalIndex: 0, refId: 'ref1', assessments },
    mocks: { $t: (k) => k, $route: { params: { org_id: 'org1', id: 'proj1' } }, $bvModal, $notify },
    stubs: {
      'b-card': true, 'b-form-group': true, 'b-form-radio-group': true, 'b-form-radio': true,
      'b-form-textarea': true, 'b-button': true, 'b-modal': true, 'b-container': true, 'b-row': true, 'b-col': true
    }
  })
  return { wrapper, $notify, assessments }
}

const celda = (assessments) => assessments.items[0].stages[0].options[0]
const rechazo = () => Object.assign(new Error('500'), { response: { status: 500, data: { status: 'error' } }, config: { url: '/isoqf_assessments/assess1/item/ref1/stage/0/option/0' } })

// La grilla se pinta ANTES del PATCH, para que la tabla cambie sin esperar el refetch. Si el
// servidor rechazaba, la celda quedaba pintada con un juicio que no se guardó.
describe('AssessmentForm — la celda pintada de antemano vuelve si el servidor rechaza', () => {
  beforeEach(() => jest.clearAllMocks())

  it('restaura lo que la celda tenía, y el formulario conserva lo escrito', async () => {
    const assessments = doc()
    celda(assessments).option = 'A'
    celda(assessments).text = 'guardado antes'
    const { wrapper } = createWrapper(assessments)
    await wrapper.setData({ selected: 'D', text1: 'nuevo juicio' })
    Api.patch.mockRejectedValueOnce(rechazo())
    await wrapper.vm.performSave()
    await flushPromises()
    expect(celda(assessments)).toEqual({ option: 'A', text: 'guardado antes', notes: '' })
    expect(wrapper.vm.selected).toBe('D')
    expect(wrapper.vm.text1).toBe('nuevo juicio')
    wrapper.destroy()
  })

  it('también con un rechazo de lock', async () => {
    const assessments = doc()
    const { wrapper } = createWrapper(assessments)
    await wrapper.setData({ selected: 'C', text1: 'x' })
    Api.patch.mockRejectedValueOnce(Object.assign(rechazo(), { response: { status: 409, data: { locked_by: 'Ana' } } }))
    await wrapper.vm.performSave()
    await flushPromises()
    expect(celda(assessments).option).toBeNull()
    wrapper.destroy()
  })

  it('si un guardado posterior ya cambió la celda, no la pisa', async () => {
    const assessments = doc()
    const { wrapper } = createWrapper(assessments)
    await wrapper.setData({ selected: 'B', text1: 'primero' })
    let rechazar
    Api.patch.mockImplementationOnce(() => new Promise((resolve, reject) => { rechazar = reject }))
    const primero = wrapper.vm.performSave()
    await flushPromises()
    // Mientras el primer PATCH vuela, otro guardado pinta la celda con lo nuevo.
    Object.assign(celda(assessments), { option: 'C', text: 'segundo', notes: '' })
    rechazar(rechazo())
    await primero
    await flushPromises()
    expect(celda(assessments)).toEqual({ option: 'C', text: 'segundo', notes: '' })
    wrapper.destroy()
  })

  it('si sale bien, la celda queda con lo guardado', async () => {
    const assessments = doc()
    const { wrapper } = createWrapper(assessments)
    await wrapper.setData({ selected: 'B', text1: 'ok' })
    Api.patch.mockResolvedValueOnce({ data: {} })
    await wrapper.vm.performSave()
    await flushPromises()
    expect(celda(assessments)).toEqual({ option: 'B', text: 'ok', notes: '' })
    wrapper.destroy()
  })
})

describe('AssessmentForm — checkChanges sin la celda en el documento', () => {
  it('no revienta con items vacío: compara contra la última hidratación', async () => {
    const { wrapper } = createWrapper({ id: 'assess1', items: [] })
    expect(() => wrapper.vm.checkChanges()).not.toThrow()
    await wrapper.setData({ selected: 'B' })
    await flushPromises()
    expect(wrapper.vm.button.disabled).toBe(false)
    wrapper.destroy()
  })
})

// «Do it now» pedía el foco una vez, en un nextTick, y bootstrap-vue lo devolvía al botón
// Save al cerrar el aviso. Su prop `return-focus` gana sobre el elemento que capturó al abrir
// y se aplica en `onAfterLeave`, cuando ya nadie lo pisa: mismo arreglo que el aviso de StepFour.
describe('AssessmentForm — «Do it now» deja el cursor en la explicación', () => {
  it('el aviso devuelve el foco al textarea de esta celda', async () => {
    const { wrapper } = createWrapper()
    wrapper.vm.doItNow()
    await wrapper.vm.$nextTick()
    const modal = wrapper.find('b-modal-stub')
    expect(modal.attributes('return-focus')).toBe('#assessment-explanation-0-0')
    wrapper.destroy()
  })

  it('al abrir el aviso otra vez vuelve al comportamiento normal', async () => {
    const { wrapper } = createWrapper()
    wrapper.vm.doItNow()
    await wrapper.setData({ selected: 'B', text1: '' })
    await wrapper.vm.save()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('b-modal-stub').attributes('return-focus')).toBeUndefined()
    wrapper.destroy()
  })
})
