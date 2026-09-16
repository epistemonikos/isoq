// La presencia se DIBUJA. Este repo ya se comió dos veces un test verde sobre un
// estado que la plantilla no mostraba en ninguna rama, así que las aserciones van
// sobre el DOM renderizado y no sobre el valor del método.
import { mount, createLocalVue } from '@vue/test-utils'
import BootstrapVue from 'bootstrap-vue'
import ViewTable from '@/components/project/ViewTable.vue'
import PresenceService from '@/services/presenceService'

jest.mock('@/utils/Api', () => ({
  get: jest.fn().mockResolvedValue({ data: [{ id: 'finding1' }] }),
  patch: jest.fn().mockResolvedValue({ data: {} }),
  post: jest.fn().mockResolvedValue({ data: {} })
}))
jest.mock('@/services/lockService', () => ({
  acquireRef: jest.fn().mockResolvedValue({ success: true }),
  releaseRef: jest.fn(),
  refLocks: new Map()
}))
jest.mock('@/services/presenceService', () => ({
  fetch: jest.fn().mockResolvedValue([])
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const localVue = createLocalVue()
localVue.use(BootstrapVue)

const LISTS = [{
  id: 'list1', name: 'Finding One', notes: '', sort: 1, references: ['ref1'],
  category: null, category_name: '', cerqual_option: '', cerqual_explanation: '',
  raw_ref: ['ref1'], filter_cerqual: '', displayNumber: 1
}]
const FINDINGS = [{ id: 'finding1', list_id: 'list1' }]

const $t = (key, params) => {
  if (key === 'presence.and') return 'y'
  if (key === 'presence.reviewing_one') return `${params.users} está revisando este hallazgo`
  if (key === 'presence.reviewing_many') return `${params.users} están revisando este hallazgo`
  return key
}

// Mismo montaje que tests/unit/components/project/ViewTable.refLocks.spec.js: mount
// COMPLETO (shallowMount stubea b-table y sus v-slot:cell(...) no se ejecutan, así
// que los avisos no existirían en el DOM), y `project`/`references` explícitos porque
// son props REQUERIDAS del componente (Task 9 usará `project.private` en el modal de
// borrado, que también monta con este mismo build()).
function build (presence, refLocks = []) {
  const wrapper = mount(ViewTable, {
    localVue,
    propsData: {
      lists: LISTS,
      list_categories: { options: [], selected: null },
      fields: { with_categories: [{ key: 'name', label: 'Finding' }], without_categories: [{ key: 'name', label: 'Finding' }] },
      project: { id: 'p1', private: true, is_public: false },
      references: [],
      refs: [],
      isBusy: false,
      filter: '',
      mode: 'edit',
      canEdit: true,
      findings: FINDINGS,
      refLocks,
      presence
    },
    mocks: {
      $t,
      $route: { params: { id: 'p1', org_id: 'o1' } },
      $store: { state: { user: { id: 'u-yo', first_name: 'Yo', last_name: 'Mismo' } } }
    },
    stubs: { videoHelp: true, 'b-tooltip': true, 'font-awesome-icon': true, 'b-modal': true }
  })
  // El stub automático de b-modal no reimplementa `show`/`hide` (sólo conserva props):
  // Task 9 llama a los abridores de verdad, así que sin esto `.show()` explota dentro
  // del modal. Mismo parche que usa ViewTable.refLocks.spec.js.
  wrapper.vm.$refs['edit-finding-name'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['remove-finding'] = { show: jest.fn(), hide: jest.fn() }
  wrapper.vm.$refs['modal-references-list'] = { show: jest.fn(), hide: jest.fn() }
  return wrapper
}

describe('ViewTable — presencia', () => {
  it('una persona adentro se ve en la fila', () => {
    const wrapper = build([
      { finding_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])

    const aviso = wrapper.find('[data-testid="finding-presence"]')
    expect(aviso.exists()).toBe(true)
    expect(aviso.text()).toContain('Ana Soto está revisando este hallazgo')
  })

  it('dos personas van en UNA línea, unidas por el conector del idioma', () => {
    const wrapper = build([
      { finding_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' },
      { finding_id: 'finding1', user_id: 'u-luis', user_name: 'Luis Paz' }
    ])

    const avisos = wrapper.findAll('[data-testid="finding-presence"]')
    expect(avisos).toHaveLength(1)
    expect(avisos.at(0).text()).toContain('Ana Soto y Luis Paz están revisando')
  })

  it('tres personas se separan con comas salvo la última', () => {
    const wrapper = build([
      { finding_id: 'finding1', user_id: 'u-a', user_name: 'Ana Soto' },
      { finding_id: 'finding1', user_id: 'u-b', user_name: 'Luis Paz' },
      { finding_id: 'finding1', user_id: 'u-c', user_name: 'Mara Ruiz' }
    ])

    expect(wrapper.find('[data-testid="finding-presence"]').text())
      .toContain('Ana Soto, Luis Paz y Mara Ruiz están revisando')
  })

  it('sin nadie adentro no se dibuja nada', () => {
    const wrapper = build([])

    expect(wrapper.find('[data-testid="finding-presence"]').exists()).toBe(false)
  })

  it('LA PROMESA: la presencia no deshabilita los botones', () => {
    const wrapper = build([
      { finding_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])

    const botones = wrapper.findAll('button').filter(b => !b.attributes('disabled'))
    expect(botones.length).toBeGreaterThan(0)
    expect(wrapper.vm.isFindingLocked('list1')).toBe(false)
  })

  it('quien tiene el lock sale de la línea de presencia y queda en la de lock', () => {
    const wrapper = build(
      [{ finding_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' }],
      [{ ref_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' }]
    )

    expect(wrapper.find('[data-testid="finding-presence"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="finding-locked"]').exists()).toBe(true)
  })
})

describe('ViewTable — presencia en los modales', () => {
  beforeEach(() => {
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'finding1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])
  })

  it('abrir el modal de borrado pide presencia FRESCA, sin esperar el sondeo', async () => {
    // El sondeo corre cada 15 s; borrar es la única acción irreversible de las tres.
    const wrapper = build([])

    await wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(PresenceService.fetch).toHaveBeenCalledWith('p1')
    expect(wrapper.vm.modalPresenceNotice).toContain('Ana Soto')
  })

  it('el aviso se DIBUJA dentro del modal de borrado', async () => {
    const wrapper = build([])

    await wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    const aviso = wrapper.find('[data-testid="modal-presence"]')
    expect(aviso.exists()).toBe(true)
    expect(aviso.text()).toContain('Ana Soto está revisando este hallazgo')
  })

  it('abrir el modal de nombre también consulta', async () => {
    const wrapper = build([])

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(PresenceService.fetch).toHaveBeenCalledWith('p1')
  })

  it('cerrar el modal limpia la presencia fresca', async () => {
    // Si no, el próximo modal abre mostrando a quien estaba en el hallazgo anterior.
    const wrapper = build([])
    await wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    wrapper.vm.onRemoveFindingHidden()
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.freshPresence).toEqual([])
    expect(wrapper.vm.modalPresenceNotice).toBe('')
    expect(wrapper.find('[data-testid="modal-presence"]').exists()).toBe(false)
  })

  it('sin nadie adentro el modal no muestra el aviso', async () => {
    PresenceService.fetch.mockResolvedValue([])
    const wrapper = build([])

    await wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(wrapper.find('[data-testid="modal-presence"]').exists()).toBe(false)
  })
})

describe('ViewTable — la presencia NUNCA retrasa la apertura de un modal', () => {
  // Este es el punto de F1: un GET de presencia colgado (ni resuelto ni rechazado,
  // no hay timeout de axios en el repo) no debe poder dejar cerrado un modal de
  // renombrar / referencias / BORRAR. Si algún día vuelve un `await` delante de
  // `refreshPresenceFor`, este test se cuelga y falla por timeout.
  beforeEach(() => {
    PresenceService.fetch.mockReturnValue(new Promise(() => {}))
  })

  it('el modal de nombre se abre igual', async () => {
    const wrapper = build([])

    await wrapper.vm.editModalFindingName({ index: 0, item: LISTS[0] })

    expect(wrapper.vm.$refs['edit-finding-name'].show).toHaveBeenCalled()
  })

  it('el modal de referencias se abre igual', async () => {
    // openModalReferences no es async: resuelve el Api.get con un .then, así que
    // lo que hay que drenar es esa cadena, no una promesa devuelta por el método.
    const wrapper = build([])

    wrapper.vm.openModalReferences({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(wrapper.vm.$refs['modal-references-list'].show).toHaveBeenCalled()
  })

  it('el modal de borrado se abre igual', async () => {
    const wrapper = build([])

    wrapper.vm.removeModalFinding({ index: 0, item: LISTS[0] })
    await flushPromises()

    expect(wrapper.vm.$refs['remove-finding'].show).toHaveBeenCalled()
  })
})
