// Mismo clamp que en el Paso 4: `StepThree.vue:3` esconde la tabla completa detrás de
// `<b-alert v-if="isLoading">`. Al recargar, el documento pasa de varias pantallas a una
// línea y el navegador reubica al usuario en el nuevo máximo.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import StepThree from '@/components/camelot/StepThree.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([])
}))
jest.mock('@/mixins/camelotMixin', () => ({ camelotMixin: { computed: {}, methods: {}, data: () => ({}) } }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

function createWrapper () {
  return shallowMount(StepThree, {
    localVue,
    propsData: { references: [], type: 'isoqf_characteristics' },
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' } }
    }
  })
}

describe('StepThree.vue — sostener la posición al recargar la tabla', () => {
  it('loadCharacteristicsData() congela la posición antes de vaciar la tabla', () => {
    const wrapper = createWrapper()
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.loadCharacteristicsData()

    expect(hold).toHaveBeenCalled()
    wrapper.destroy()
  })

  it('la congela ANTES de encender isLoading, no después', () => {
    const wrapper = createWrapper()
    const order = []
    jest.spyOn(wrapper.vm, 'holdScrollPosition').mockImplementation(() => order.push('hold'))
    wrapper.vm.$watch(() => wrapper.vm.isLoading, () => order.push('isLoading'))

    wrapper.vm.loadCharacteristicsData()

    expect(order[0]).toBe('hold')
    wrapper.destroy()
  })
})
