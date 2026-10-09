// El salto al guardar en el Paso 4, con la misma causa que en crudTables pero peor.
//
// `StepFour.vue:3` es `<b-alert v-if="isLoading">` con TODA la tabla en el `v-else`: no
// desaparece el tbody como con el slot `table-busy`, desaparece la tabla entera con sus
// encabezados. El documento pasa de varias pantallas a una línea, y el navegador clampea
// la posición del usuario a lo que queda.
//
// Por eso el hold va en getAssessments(): es el punto único por donde pasan el guardado de
// una celda (AssessmentForm emite `getAssessments`), el cierre del modal y la recarga.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepFour from '@/components/camelot/StepFour.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => {
  const actual = jest.requireActual('@/services/lockService')
  return {
    __esModule: true,
    studyLockState: actual.studyLockState,
    default: {
      fetchRefLocks: jest.fn().mockResolvedValue([]),
      acquireRef: jest.fn().mockResolvedValue({ success: true }),
      releaseRef: jest.fn(),
      refLocks: new Map()
    }
  }
})

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return shallowMount(StepFour, {
    localVue,
    propsData: {
      type: 'isoqf_assessments',
      references: [{ id: 'ref1', authors: ['Alvarez'], publication_year: '2021' }],
      canEdit: true
    },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { first_name: 'Yo', last_name: 'Mismo' } } }
    }
  })
}

describe('StepFour.vue — sostener la posición al recargar la tabla', () => {
  it('getAssessments() congela la posición antes de vaciar la tabla', () => {
    const wrapper = createWrapper()
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.getAssessments()

    expect(hold).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('la congela ANTES de encender isLoading, no después', () => {
    const wrapper = createWrapper()
    const order = []
    jest.spyOn(wrapper.vm, 'holdScrollPosition').mockImplementation(() => order.push('hold'))
    // El clamp ocurre en el repintado que dispara isLoading: sostener después ya sería tarde.
    const observer = { get: () => wrapper.vm.isLoading }
    wrapper.vm.$watch(observer.get, () => order.push('isLoading'))

    wrapper.vm.getAssessments()

    expect(order[0]).toBe('hold')
    wrapper.destroy()
  })
})
