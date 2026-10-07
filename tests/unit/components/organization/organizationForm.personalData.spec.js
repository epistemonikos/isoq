import { shallowMount, createLocalVue } from '@vue/test-utils'
import organizationForm from '@/components/organization/organizationForm.vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

const FIELD = 'no_personal_data_confirmed'

/**
 * Propiedades (pestaña y modal de la lista) también publica: elegir un nivel público y
 * guardar va por PATCH /api/publish. La casilla tiene que estar acá igual que en el modal
 * Publicar, y sin ella el guardado no se puede pulsar.
 */
describe('organizationForm.vue — confirmación de datos personales', () => {
  function mount (formData) {
    return shallowMount(organizationForm, {
      localVue: createLocalVue(),
      propsData: { formData: { id: 'p1', name: 'Proyecto', public_type: 'private', ...formData }, canEdit: true },
      mocks: {
        $t: (key) => key,
        $route: { params: { id: 'p1', org_id: 'o1' }, query: {} },
        $router: { push: jest.fn() },
        $notify: { success: jest.fn(), error: jest.fn() }
      },
      stubs: { videoHelp: true }
    })
  }

  it('privado: ni casilla ni bloqueo', () => {
    const wrapper = mount({})
    expect(wrapper.find('#checkbox-project-personal-data').exists()).toBe(false)
    expect(wrapper.vm.isInvalid).toBe(false)
  })

  it('público sin confirmar: casilla visible y guardado deshabilitado', () => {
    const wrapper = mount({ public_type: 'fully', license_type: 'CC-BY' })
    expect(wrapper.find('#checkbox-project-personal-data').exists()).toBe(true)
    expect(wrapper.vm.isInvalid).toBe(true)
  })

  it('público confirmado: se puede guardar', () => {
    const wrapper = mount({ public_type: 'fully', license_type: 'CC-BY', [FIELD]: true })
    expect(wrapper.vm.isInvalid).toBe(false)
  })
})
