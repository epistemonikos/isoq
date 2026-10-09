import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import editListExtractedData from '@/components/list/editListExtractedData.vue'
import LockService from '@/services/lockService'

const localVue = createLocalVue()
localVue.use(BootstrapVue)
const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [] }),
  patch: jest.fn().mockResolvedValue({ data: {} })
}))

jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))

const ROWS = [
  { ref_id: 'ref1', authors: 'Smith 2020', column_0: 'texto 1' },
  { ref_id: 'ref2', authors: 'Jones 2021', column_0: 'texto 2' }
]

// `mount` con el `b-table` real: lo que se afirma es que los botones de la fila se VEN
// deshabilitados, no sólo que un computed diga que lo están.
function createWrapper ({ activeRefLocks = [], permission = true } = {}) {
  return mount(editListExtractedData, {
    localVue,
    propsData: {
      ui: { adequacy: { extracted_data: { display_warning: false } } },
      show: { selected: ['ed'] },
      mode: 'edit',
      list: { id: 'list1', organization: 'org1', project_id: 'proj1' },
      permission,
      extractedData: {
        id: 'ed1',
        fields: [{ key: 'column_0' }, { key: 'actions' }],
        fieldsObj: [{ key: 'authors' }, { key: 'column_0' }, { key: 'actions' }],
        items: ROWS
      },
      modePrintFieldObject: [],
      refsWithTitle: [],
      activeRefLocks
    },
    mocks: {
      $t: (key, params) => (params && params.user ? `${key}:${params.user}` : key),
      $notify: { warning: jest.fn() },
      $store: { state: { user: { name: 'Yo', lastname: 'Mismo' } } }
    },
    stubs: {
      videoHelp: true, 'bc-filters': true, 'back-to-top': true, 'b-modal': true,
      'font-awesome-icon': { props: ['icon'], template: '<i :data-icon="icon" />' }
    }
  })
}

const editBtn = (wrapper, refId) => wrapper.find(`[data-testid="ed-edit-${refId}"]`)
const removeBtn = (wrapper, refId) => wrapper.find(`[data-testid="ed-remove-${refId}"]`)

describe('editListExtractedData.vue — fila tomada por otra persona', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LockService.refLocks.clear()
    LockService.acquireRef.mockResolvedValue({ success: true })
  })

  it('grisa editar y borrar SÓLO en la fila que otro tiene', async () => {
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ed1::ed::ref1', user_name: 'Ana Pérez' }]
    })
    await flushPromises()

    expect(editBtn(wrapper, 'ref1').attributes('disabled')).toBeDefined()
    expect(removeBtn(wrapper, 'ref1').attributes('disabled')).toBeDefined()
    expect(editBtn(wrapper, 'ref2').attributes('disabled')).toBeUndefined()
    expect(removeBtn(wrapper, 'ref2').attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('dice quién la tiene y cambia el ícono por el de persona', async () => {
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ed1::ed::ref1', user_name: 'Ana Pérez' }]
    })
    await flushPromises()

    const holder = wrapper.find('[data-testid="ed-locked-ref1"]')
    expect(holder.exists()).toBe(true)
    expect(holder.attributes('title')).toBe('lock.ref_locked_by:Ana Pérez')
    expect(editBtn(wrapper, 'ref1').find('[data-icon="user"]').exists()).toBe(true)
    expect(editBtn(wrapper, 'ref2').find('[data-icon="edit"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('la misma referencia tomada en OTRO hallazgo no grisa nada', async () => {
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ed2::ed::ref1', user_name: 'Ana Pérez' }]
    })
    await flushPromises()

    expect(editBtn(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('el estudio tomado en el Paso 3 no grisa la fila', async () => {
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ref1', user_name: 'Ana Pérez' }]
    })
    await flushPromises()

    expect(editBtn(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('un lock PROPIO no me grisa mi fila', async () => {
    // El sondeo trae también mis locks; `foreignRefLocks` los separa por el registro de
    // esta pestaña.
    LockService.refLocks.set('ed1::ed::ref1', 'proj1')
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ed1::ed::ref1', user_name: 'Yo Mismo' }]
    })
    await flushPromises()

    expect(editBtn(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
    wrapper.destroy()
  })

  it('se habilita en cuanto el lock ajeno desaparece del sondeo', async () => {
    const wrapper = createWrapper({
      activeRefLocks: [{ ref_id: 'ed1::ed::ref1', user_name: 'Ana Pérez' }]
    })
    await flushPromises()
    await wrapper.setProps({ activeRefLocks: [] })

    expect(editBtn(wrapper, 'ref1').attributes('disabled')).toBeUndefined()
    expect(wrapper.find('[data-testid="ed-locked-ref1"]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('un rechazo al abrir avisa al padre para que el sondeo corra YA', async () => {
    // Sin esto el grisado esperaría el próximo tick del sondeo.
    LockService.acquireRef.mockResolvedValue({ success: false, lockedBy: 'Ana Pérez' })
    const wrapper = createWrapper()
    wrapper.vm.$refs['modal-extracted-data-data'] = { show: jest.fn() }
    wrapper.vm.openModalExtractedDataEditDataItem({ index: 0, item: ROWS[0] })
    await flushPromises()

    expect(wrapper.emitted('lock-denied')).toBeTruthy()
    wrapper.destroy()
  })

  it('un acquire exitoso no avisa rechazo', async () => {
    const wrapper = createWrapper()
    wrapper.vm.$refs['modal-extracted-data-data'] = { show: jest.fn() }
    wrapper.vm.openModalExtractedDataEditDataItem({ index: 0, item: ROWS[0] })
    await flushPromises()

    expect(wrapper.emitted('lock-denied')).toBeFalsy()
    wrapper.destroy()
  })
})
