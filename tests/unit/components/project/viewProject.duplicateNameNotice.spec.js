import { mount, createLocalVue } from '@vue/test-utils'
import viewProject from '@/components/project/viewProject.vue'
import BootstrapVue from 'bootstrap-vue'
import Api from '@/utils/Api'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  delete: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  fetchRefLocks: jest.fn().mockResolvedValue([]),
  acquire: jest.fn().mockResolvedValue({ success: true }),
  release: jest.fn(),
  releaseRef: jest.fn()
}))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

// `b-modal` no dibuja su contenido mientras está cerrado, así que se reemplaza por un
// contenedor que sí rinde el slot. Todo lo de adentro —`b-form-group`, `b-form-input` y
// el `<p>` del aviso— es el real: es justamente lo que hay que ver en el DOM.
const stubs = {
  'action-buttons': true, 'propertiesProject': true, 'UploadReferences': true,
  'InclusionExclusioCriteria': true, 'crudTables': true, 'PrintViewTable': true,
  'ViewTable': true, 'CamelotStepThree': true, 'CamelotStepFour': true,
  'videoHelp': true, 'back-to-top': true, 'content-guidance': true,
  'b-modal': { render (h) { return h('div', this.$slots.default) } }
}

// Dos veces en este repositorio un conflicto seteó un estado que la plantilla no dibujaba
// en ninguna rama, y las dos pasaron revisión de código y suite verde con tests que sólo
// miraban el estado. Este spec mira el texto renderizado.
describe('viewProject.vue — el aviso de nombre duplicado se DIBUJA', () => {
  const duplicateKeyError = {
    config: { url: '/isoqf_list_categories/c1', method: 'patch' },
    response: { status: 409, data: { status: false, reason: 'duplicate_key' } }
  }

  async function conModalAbierto (extra) {
    const wrapper = mount(viewProject, {
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
    await flushPromises()
    jest.spyOn(wrapper.vm, 'getLists').mockImplementation(() => {})
    jest.spyOn(wrapper.vm, 'getListCategories').mockResolvedValue()
    await wrapper.setData({
      modal_edit_list_categories: {
        ...wrapper.vm.modal_edit_list_categories,
        options: [{ id: 'c9', text: 'Otra cosa' }],
        ...extra
      }
    })
    return wrapper
  }

  beforeEach(() => jest.clearAllMocks())

  it('no hay aviso antes de que el servidor rechace', async () => {
    const wrapper = await conModalAbierto({ edit: true, id: 'c1', text: '7. Skills' })

    expect(wrapper.text()).not.toContain('categories.duplicate_name')
    wrapper.destroy()
  })

  it('el texto del aviso aparece en el DOM tras el 409 del rename', async () => {
    Api.patch.mockRejectedValueOnce(duplicateKeyError)
    const wrapper = await conModalAbierto({ edit: true, id: 'c1', text: '7. Skills' })

    await wrapper.vm.updateCategoryName()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('categories.duplicate_name')
    wrapper.destroy()
  })

  it('el texto del aviso aparece en el DOM tras el 409 del alta', async () => {
    Api.post.mockRejectedValueOnce(duplicateKeyError)
    const wrapper = await conModalAbierto({ new: true, text: '7. Skills' })

    await wrapper.vm.saveNewCategory()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('categories.duplicate_name')
    wrapper.destroy()
  })

  // El input queda marcado como inválido además del texto: `state=false` es lo que le da
  // el borde rojo, y es la única señal para quien no lee el párrafo de abajo.
  it('marca el input como inválido, no sólo escribe un párrafo', async () => {
    Api.patch.mockRejectedValueOnce(duplicateKeyError)
    const wrapper = await conModalAbierto({ edit: true, id: 'c1', text: '7. Skills' })

    await wrapper.vm.updateCategoryName()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('input.is-invalid').exists()).toBe(true)
    wrapper.destroy()
  })
})
