import { mount, createLocalVue } from '@vue/test-utils'
import ShareProjectModal from '@/components/organization/modals/ShareProjectModal.vue'
import BootstrapVue from 'bootstrap-vue'
import Vuex from 'vuex'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
localVue.use(Vuex)

jest.mock('@/utils/Api')

// Estos casos van sobre el DOM renderizado a propósito. Un test verde sobre el estado no
// prueba que se vea: la columna `username` sólo tenía `v-if="state === 'active'"` y
// `v-else-if="state === 'inactive'"`, sin rama final, así que cualquier otro valor
// —incluido el 'pending' que `getDisabledTitle()` ya contempla— dejaba la celda vacía,
// sin nombre ni email. Eso no se ve en una aserción sobre `users_allowed`.
describe('ShareProjectModal — la columna de usuario siempre muestra un nombre', () => {
  let store

  const renderedHtml = async (usersAllowed) => {
    const wrapper = mount_(usersAllowed)
    wrapper.vm.show()
    await wrapper.vm.$nextTick()
    await new Promise(resolve => setTimeout(resolve, 0))
    await wrapper.vm.$nextTick()
    return document.body.innerHTML
  }

  const mount_ = (usersAllowed) => mount(ShareProjectModal, {
    localVue,
    store,
    mocks: { $t: (msg) => msg, $route: { params: { id: 'org-123' } } },
    propsData: {
      project: { id: 'test-id', name: 'Test Project', sharedTo: '', tmp_invite_emails: [] },
      usersAllowed,
      initialTab: 1
    },
    mixins: [{ computed: { isOnline () { return true } } }]
  })

  beforeEach(() => {
    document.body.innerHTML = ''
    store = new Vuex.Store({ state: { user: { name: 'test_user', id: 'user-1' } } })
  })

  it('muestra el nombre del usuario activo, sin tachar', async () => {
    const html = await renderedHtml([
      { id: 'u1', username: 'damian@episte.co', first_name: 'diaman', last_name: 'garrido', user_can: 1, state: 'active' }
    ])
    expect(html).toContain('damian@episte.co')
    expect(html).not.toContain('line-through')
  })

  it('tacha al usuario inactivo', async () => {
    const html = await renderedHtml([
      { id: 'u1', username: 'viejo@example.com', first_name: 'V', last_name: 'C', user_can: 0, state: 'inactive' }
    ])
    expect(html).toContain('viejo@example.com')
    expect(html).toContain('line-through')
  })

  it('no deja la celda vacía con un state que este cliente no conoce', async () => {
    // Mismo criterio que la allowlist de `lockErrors.js`: un valor que el cliente todavía
    // no conoce cae en el comportamiento por defecto, nunca en la nada.
    const html = await renderedHtml([
      { id: 'u1', username: 'pendiente@example.com', first_name: 'P', last_name: 'U', user_can: 0, state: 'un_estado_que_todavia_no_existe' }
    ])
    expect(html).toContain('pendiente@example.com')
  })

  it('cae al email cuando no hay username', async () => {
    const html = await renderedHtml([
      { id: 'u1', email: 'solo-email@example.com', first_name: 'S', last_name: 'E', user_can: 0, state: 'active' }
    ])
    expect(html).toContain('solo-email@example.com')
  })
})
