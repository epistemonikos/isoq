import { mount, createLocalVue } from '@vue/test-utils'
import UploadReferences from '@/components/project/UploadReferences.vue'
import BootstrapVue from 'bootstrap-vue'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/utils/commons', () => ({
  getAuthorsFormat: jest.fn(() => 'Smith J'),
  parseReference: jest.fn(() => 'Smith J 2020'),
  getLastName: jest.fn(a => a.split(',')[0])
}))
jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: { refLocks: new Map() }
}))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

Object.defineProperty(window, 'localStorage', {
  value: { getItem: jest.fn(() => null), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() },
  configurable: true
})

const translate = (key, params) => (params ? `${key}|${JSON.stringify(params)}` : key)

function createWrapper (activeRefLocks, extra = {}) {
  return mount(UploadReferences, {
    localVue,
    propsData: {
      canEdit: true,
      // `_showDetails` abre la confirmación de borrado de la fila, como el botón.
      references: [{ id: 'R1', authors: 'Smith J', title: 'T', _showDetails: true, ...extra }],
      lists: [],
      activeRefLocks
    },
    mocks: {
      $t: translate,
      $route: { params: { id: 'proj1', org_id: 'org1' } },
      $notify: { success: jest.fn(), error: jest.fn(), warning: jest.fn() },
      $store: { state: { user: { id: 'me' } } }
    },
    stubs: { 'font-awesome-icon': true, videoHelp: true }
  })
}

// Borrar se puede siempre, pero quien borra tiene que saber que le cierra el editor a
// alguien. La afirmación va sobre el DOM: el dato tiene que terminar en pantalla.
describe('UploadReferences — advertencia de estudio en uso', () => {
  it.each([
    ['el estudio entero', 'R1'],
    ['una celda del Paso 4', 'R1::s1::o0'],
    ['una fila de datos extraídos', 'ed9::ed::R1']
  ])('aparece cuando otra persona tiene %s', (_label, key) => {
    const wrapper = createWrapper([{ ref_id: key, user_id: 'u2', user_name: 'Bea Rojas' }])
    const alert = wrapper.find('[data-test="ref-in-use"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Bea Rojas')
    wrapper.destroy()
  })

  it('no aparece por un lock propio', () => {
    const wrapper = createWrapper([{ ref_id: 'R1', user_id: 'me', user_name: 'Yo' }])
    expect(wrapper.find('[data-test="ref-in-use"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('no aparece por otro estudio', () => {
    const wrapper = createWrapper([{ ref_id: 'R2', user_id: 'u2', user_name: 'Bea Rojas' }])
    expect(wrapper.find('[data-test="ref-in-use"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('advierte pero no bloquea: el botón de confirmar sigue ahí', () => {
    const wrapper = createWrapper([{ ref_id: 'R1', user_id: 'u2', user_name: 'Bea Rojas' }])
    const yes = wrapper.findAll('button').filter(b => b.text() === 'common.yes')
    expect(yes.length).toBe(1)
    expect(yes.at(0).attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('«Borrar todas» resume cuántos están en uso y por quién', async () => {
    const wrapper = createWrapper([{ ref_id: 'R1', user_id: 'u2', user_name: 'Bea Rojas' }], { _showDetails: false })
    await wrapper.setData({ appearMsgRemoveReferences: true })
    const alert = wrapper.find('[data-test="refs-in-use"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('"count":1')
    expect(alert.text()).toContain('Bea Rojas')
    wrapper.destroy()
  })
})
