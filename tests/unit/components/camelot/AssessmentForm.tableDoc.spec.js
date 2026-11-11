import { mount, createLocalVue } from '@vue/test-utils'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'

const localVue = createLocalVue()

jest.mock('@/utils/Api')
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn()
}))

/**
 * El segundo de los tres lugares que crean un documento de tabla. Mismo patrón que tenía
 * `StepFour.saveField` antes de arreglarse: `assessments.id` en blanco significaba "no
 * existe" y se creaba uno nuevo, cuando también puede significar "el GET falló" o "todavía
 * no llegó". La regla ahora vive en `resolveTableDoc` y se consulta al servidor.
 */
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const doc = (id) => ({
  id,
  items: [
    {
      ref_id: 'ref1',
      authors: 'Author 2024',
      stages: [
        { key: 0, options: [{ option: null, text: '', notes: '' }] }
      ]
    }
  ]
})

describe('AssessmentForm — no crear un segundo documento de assessments', () => {
  let wrapper
  const notify = { success: jest.fn(), error: jest.fn(), warning: jest.fn() }

  const build = (assessments) => mount(AssessmentForm, {
    localVue,
    propsData: { selectedMeta: 0, modalStage: 0, modalIndex: 0, refId: 'ref1', assessments },
    mocks: {
      $t: (key) => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: notify
    },
    stubs: {
      'b-card': true, 'b-form-group': true, 'b-form-radio-group': true, 'b-form-radio': true,
      'b-form-textarea': true, 'b-button': true, 'b-modal': true, 'b-alert': true,
      'font-awesome-icon': true
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    console.error = jest.fn()
    Api.get.mockResolvedValue({ data: [] })
    Api.patch.mockResolvedValue({ data: {} })
    Api.post.mockResolvedValue({ data: { id: 'nuevo1' } })
  })

  afterEach(() => { if (wrapper) wrapper.destroy() })

  it('con el documento cargado actualiza la hoja, sin consultar de más', async () => {
    wrapper = build(doc('assess1'))
    Api.get.mockClear()

    wrapper.vm.selected = 'C'
    await wrapper.vm.performSave(true)

    expect(Api.patch).toHaveBeenCalled()
    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.get).not.toHaveBeenCalled()
  })

  it('sin id local, si el servidor YA tiene documento, escribe en ese', async () => {
    wrapper = build(doc(undefined))
    Api.get.mockResolvedValue({ data: [{ id: 'assess1' }] })

    wrapper.vm.selected = 'C'
    await wrapper.vm.performSave(true)
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).toHaveBeenCalledWith(
      expect.stringContaining('/isoqf_assessments/assess1/item/ref1/'),
      expect.any(Object)
    )
  })

  it('sin id y sin documento en el servidor, crea: es la primera vez', async () => {
    wrapper = build(doc(undefined))
    Api.get.mockResolvedValue({ data: [] })

    wrapper.vm.selected = 'C'
    await wrapper.vm.performSave(true)
    await flushPromises()

    expect(Api.post).toHaveBeenCalledWith('/isoqf_assessments', expect.objectContaining({
      project_id: 'proj1'
    }))
  })

  it('si no se puede verificar, no crea a ciegas', async () => {
    wrapper = build(doc(undefined))
    Api.get.mockRejectedValue(new Error('red caída'))

    wrapper.vm.selected = 'C'
    await wrapper.vm.performSave(true)
    await flushPromises()

    expect(Api.post).not.toHaveBeenCalled()
    expect(Api.patch).not.toHaveBeenCalled()
    expect(wrapper.vm.autoSaveStatus).toBe('error')
  })
})
