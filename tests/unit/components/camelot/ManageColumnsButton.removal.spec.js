// El borrado de una columna YA EXISTENTE no sacaba la fila del modal.
//
// El padre arma `columnDefinitions` en `openColumnsModal()` a partir de `charsData.fields`,
// donde no hay `id`: la identidad de una columna guardada es su `key`. El hijo
// (`CustomFieldsManager`) trabaja sobre una copia profunda y le inventa un `id` sintético a
// cada fila para el `:key` del v-for — un id que nunca vuelve al padre, porque el watcher
// que lo asigna no emite `input`.
//
// Así que el objeto que llega en `remove-requested` trae un `id` que ninguna definición del
// padre tiene, y el filtro por `id` no sacaba nada. El DELETE sí se hacía: de ahí que la
// tabla apareciera correcta recién al cerrar el modal.
//
// Los specs existentes no lo veían porque inyectan `columnDefinitions` con `id` vía
// `setData`, una forma que el código real no produce nunca.
import { shallowMount, mount } from '@vue/test-utils'
import ManageColumnsButton from '@/components/camelot/ManageColumnsButton.vue'
import CustomFieldsManager from '@/components/camelot/CustomFieldsManager.vue'
import columnService from '@/services/columnService'

const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

jest.mock('vuedraggable', () => ({ render: h => h('div') }))

jest.mock('@/utils/Api', () => ({
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} }))
}))

jest.mock('@/services/columnService', () => ({
  __esModule: true,
  default: {
    addColumn: jest.fn(() => Promise.resolve({ key: 'column_nueva', response: { data: {} } })),
    renameColumn: jest.fn(() => Promise.resolve({ data: {} })),
    deleteColumn: jest.fn(() => Promise.resolve({ data: {} })),
    reorderColumns: jest.fn(() => Promise.resolve({ data: {} })),
    ensureTableDocument: jest.fn(() => Promise.resolve('char_creado'))
  }
}))

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    acquireRef: jest.fn(() => Promise.resolve({ success: true })),
    releaseRef: jest.fn(() => Promise.resolve())
  }
}))

const CHARS = {
  id: 'char1',
  fields: [
    { key: 'ref_id', label: 'ID' },
    { key: 'authors', label: 'Authors' },
    { key: 'column_a', label: 'Contexto' },
    { key: 'column_b', label: 'País' }
  ],
  items: []
}

function createWrapper () {
  return shallowMount(ManageColumnsButton, {
    propsData: { charsData: CHARS, visibleColumnKeys: ['column_a', 'column_b'], canEdit: true },
    mocks: {
      $t: key => key,
      $route: { params: { org_id: 'org1', id: 'proj1' } },
      $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
      $bvToast: { toast: jest.fn() }
    },
    stubs: { 'b-button': true, 'b-modal': true, 'font-awesome-icon': true, 'CustomFieldsManager': true }
  })
}

/**
 * Lo que `CustomFieldsManager` emite: su propia copia de la fila, con el `id` que se
 * inventó para el v-for. Reproducirlo acá es lo que hace al test fiel al camino real.
 */
function asChildEmits (definition, index) {
  return { ...JSON.parse(JSON.stringify(definition)), id: `field_${Date.now()}_${index}` }
}

describe('ManageColumnsButton — borrado de una columna existente', () => {
  beforeEach(() => jest.clearAllMocks())

  it('saca del modal la columna que el usuario borró', async () => {
    const wrapper = createWrapper()
    wrapper.vm.openColumnsModal()

    expect(wrapper.vm.columnDefinitions.map(c => c.key)).toEqual(['column_a', 'column_b'])

    await wrapper.vm.onRemoveRequested(asChildEmits(wrapper.vm.columnDefinitions[0], 0))
    await flushPromises()

    expect(columnService.deleteColumn).toHaveBeenCalledWith('isoqf_characteristics', 'char1', 'column_a')
    expect(wrapper.vm.columnDefinitions.map(c => c.key)).toEqual(['column_b'])
  })

  it('borra sólo la fila pedida cuando ninguna definición tiene id', async () => {
    const wrapper = createWrapper()
    wrapper.vm.openColumnsModal()

    await wrapper.vm.onRemoveRequested(asChildEmits(wrapper.vm.columnDefinitions[1], 1))
    await flushPromises()

    expect(wrapper.vm.columnDefinitions.map(c => c.key)).toEqual(['column_a'])
  })

  it('sigue borrando por id la columna nueva que todavía no tiene key', async () => {
    const wrapper = createWrapper()
    wrapper.vm.openColumnsModal()
    // El alta del hijo sí llega al padre por v-model, con su id y sin key.
    wrapper.vm.columnDefinitions.unshift({ id: 'field_nueva', label: '' })

    await wrapper.vm.onRemoveRequested({ id: 'field_nueva', label: '' })
    await flushPromises()

    expect(columnService.deleteColumn).not.toHaveBeenCalled()
    expect(wrapper.vm.columnDefinitions.map(c => c.key)).toEqual(['column_a', 'column_b'])
  })
})

// El estado no es la pantalla: `columnDefinitions` viaja al hijo por `v-model` (que acá
// mapea al prop `fields`, no a `value`) y recién su watcher lo copia a las filas que se
// dibujan. Este caso monta el par real y afirma sobre el DOM, que es donde el usuario
// mira — el bug original se veía exactamente ahí y en ningún otro lado.
describe('ManageColumnsButton + CustomFieldsManager — la fila desaparece del DOM', () => {
  beforeEach(() => jest.clearAllMocks())

  it('deja de dibujar la fila de la columna borrada', async () => {
    const wrapper = mount(ManageColumnsButton, {
      propsData: { charsData: CHARS, visibleColumnKeys: ['column_a', 'column_b'], canEdit: true },
      mocks: {
        $t: key => key,
        $route: { params: { org_id: 'org1', id: 'proj1' } },
        $bvModal: { show: jest.fn(), hide: jest.fn(), msgBoxConfirm: jest.fn(() => Promise.resolve(true)) },
        $bvToast: { toast: jest.fn() }
      },
      stubs: {
        // El async component del padre se reemplaza por el real: es el eslabón a probar.
        CustomFieldsManager,
        'font-awesome-icon': true,
        'b-modal': { template: '<div><slot/><slot name="modal-footer"/></div>' },
        'b-card': { template: '<div><slot/></div>' },
        'b-button': { template: '<button><slot/></button>' },
        'b-form-group': { template: '<div><slot/></div>' },
        'b-form-input': { props: ['value'], template: '<input :value="value" />' },
        'b-form-textarea': true,
        'b-form-invalid-feedback': true,
        'b-spinner': true,
        'b-sidebar': true,
        draggable: { template: '<div><slot/></div>' }
      }
    })

    wrapper.vm.openColumnsModal()
    await wrapper.vm.$nextTick()

    const manager = wrapper.findComponent(CustomFieldsManager)
    expect(manager.vm.localFields.map(f => f.label)).toEqual(['Contexto', 'País'])
    expect(wrapper.find('#column-def-0').exists()).toBe(true)
    expect(wrapper.find('#column-def-1').exists()).toBe(true)

    // El camino del usuario: el botón de borrar del hijo, con su id sintético.
    manager.vm.removeField(0)
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(manager.vm.localFields.map(f => f.label)).toEqual(['País'])
    expect(wrapper.find('#column-def-1').exists()).toBe(false)
  })
})
