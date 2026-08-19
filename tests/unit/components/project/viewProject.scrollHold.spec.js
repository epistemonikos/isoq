// La tabla de findings usa el slot `table-busy`, que en Bootstrap-Vue reemplaza el `tbody`
// completo: las filas se vuelven una fila con spinner, el documento se acorta y el
// navegador clampea la posición del usuario.
//
// El hold va en getLists() y no en cada guardado porque getLists es el punto único por
// donde pasan todas las mutaciones de la tabla — crear un finding, borrarlo, reordenar.
import { shallowMount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))
jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true
}

function createWrapper () {
  return shallowMount(viewProject, {
    localVue,
    mocks: {
      $t: (key) => key,
      $route: { params: { id: 'proj1', org_id: 'org1' }, query: {} },
      $router: { push: jest.fn() },
      $store: { state: { user: { personal_organization: 'org1', id: 1 } } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() }
    },
    stubs
  })
}

describe('viewProject.vue — sostener la posición al recargar la tabla', () => {
  beforeEach(() => jest.clearAllMocks())

  it('getLists() congela la posición antes de recargar', () => {
    const wrapper = createWrapper()
    const hold = jest.spyOn(wrapper.vm, 'holdScrollPosition')

    wrapper.vm.getLists()

    expect(hold).toHaveBeenCalled()
    wrapper.destroy()
  })
})
