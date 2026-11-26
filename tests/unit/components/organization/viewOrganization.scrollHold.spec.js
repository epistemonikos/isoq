// La lista de proyectos usa el slot `table-busy`: al recargar, el `tbody` entero se vuelve
// una fila con spinner, el documento se acorta y el navegador clampea la posición.
//
// getProjects() es el punto único: lo llaman crear, editar, borrar, duplicar y dejar un
// proyecto. Sostener ahí cubre las cinco rutas de una vez.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import ViewOrganization from '@/components/organization/viewOrganization.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService')

describe('viewOrganization.vue — sostener la posición al recargar la lista', () => {
  it('getProjects() congela la posición antes de encender el spinner', () => {
    const store = new Vuex.Store({
      state: { user: { personal_organization: 'org-123', id: 'user-1' }, isOnline: true }
    })
    const wrapper = shallowMount(ViewOrganization, {
      localVue,
      store,
      mocks: {
        $t: (msg) => msg,
        $route: { params: { id: 'org-123' } },
        $router: { push: jest.fn() }
      },
      mixins: [{ computed: { isOnline () { return true } } }]
    })
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.getProjects()

    expect(hold).toHaveBeenCalled()
    wrapper.destroy()
  })
})
