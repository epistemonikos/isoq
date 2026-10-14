import { shallowMount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import AssessmentForm from '@/components/camelot/assessment/AssessmentForm.vue'
import Api from '@/utils/Api'
import { requestPendingEditsFlush } from '@/mixins/pendingEditsMixin'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const assessments = {
  id: 'asmt1',
  items: [{
    ref_id: 'R1',
    stages: [{ key: 0, options: [{ option: null, text: '', notes: '' }, { option: null, text: '', notes: '' }] }]
  }]
}

function createWrapper (overrides = {}) {
  return shallowMount(AssessmentForm, {
    localVue,
    propsData: {
      assessments,
      modalStage: 0,
      selectedMeta: 0,
      refId: 'R1',
      modalIndex: 0,
      ...overrides
    },
    mocks: {
      $t: key => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: {} } }
    }
  })
}

beforeEach(() => { jest.clearAllMocks() })

describe('AssessmentForm — flush por lotes', () => {
  it('persiste lo pendiente sin esperar el debounce de 1,5 s', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ text1: 'explicación a medio escribir' })
    await flushPromises()
    expect(Api.patch).not.toHaveBeenCalled()

    requestPendingEditsFlush('R1')
    await flushPromises()

    expect(Api.patch).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('ignora el pedido de otro estudio', async () => {
    const wrapper = createWrapper()
    await wrapper.setData({ text1: 'algo' })
    await flushPromises()

    requestPendingEditsFlush('R9')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('no guarda en solo lectura', async () => {
    const wrapper = createWrapper({ isReadOnly: true })
    await wrapper.setData({ text1: 'algo' })
    await flushPromises()

    requestPendingEditsFlush('R1')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  // Sin nada agendado, flush() de lodash es no-op. Por eso no hace falta consultar el
  // leaf lock: las instancias hermanas que nadie tocó no emiten igual.
  it('sin cambios pendientes no escribe nada', async () => {
    const wrapper = createWrapper()
    await flushPromises()

    requestPendingEditsFlush('R1')
    await flushPromises()

    expect(Api.patch).not.toHaveBeenCalled()
    wrapper.destroy()
  })
})
