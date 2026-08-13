jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: { result: 'success' } }))
  }
}))

import { shallowMount, createLocalVue } from '@vue/test-utils'
import Vuex from 'vuex'
import VueI18n from 'vue-i18n'
import viewProfile from '@/components/profile/viewProfile'
import en from '@/lang/en.json'

const Api = require('@/utils/Api').default
const localVue = createLocalVue()
localVue.use(Vuex)
localVue.use(VueI18n)

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

// Ojo con la forma de los datos: medido en la base local, can_write y
// can_read contienen SÓLO a los colaboradores — el dueño no está en esas
// listas. La pertenencia se decide por organization === personal_organization.
// Muchos proyectos ni siquiera tienen los campos.
function build () {
  const actions = { updateUser: jest.fn(), setTheme: jest.fn(), logout: jest.fn(() => Promise.resolve()) }
  const store = new Vuex.Store({
    state: {
      user: { id: 'me', personal_organization: 'org1', first_name: 'Ana', last_name: 'Soto', name: 'ana' },
      theme: 'light'
    },
    actions
  })
  const i18n = new VueI18n({ locale: 'en', messages: { en } })
  const wrapper = shallowMount(viewProfile, {
    localVue,
    store,
    i18n,
    stubs: ['b-modal', 'b-button', 'b-form-input', 'b-form-group', 'b-spinner', 'b-alert',
      'b-form-checkbox', 'b-container', 'b-row', 'b-col', 'b-card', 'b-form-textarea',
      'b-form-select', 'b-table-simple', 'b-tbody', 'b-tr', 'b-td'],
    mocks: {
      $bvModal: { show: jest.fn(), hide: jest.fn() },
      $router: { push: jest.fn() }
    }
  })
  return { wrapper, actions }
}

function mockProjectsAndUsers (projects, users) {
  Api.get.mockImplementation(path => {
    if (path === '/api/getProjects') return Promise.resolve({ data: projects })
    const uid = path.replace('/users/', '')
    return Promise.resolve({ data: users[uid] || {} })
  })
}

const BEA = { status: true, first_name: 'Bea', last_name: 'Rojas', username: 'bea' }
const CARO = { status: true, first_name: 'Caro', last_name: 'Lima', username: 'caro' }

describe('viewProfile.vue — eliminar cuenta', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Api.delete.mockResolvedValue({ data: { result: 'success' } })
  })

  // ─── Qué proyectos necesitan un dueño nuevo ──────────────────────────────────

  it('ignora los proyectos que no son míos', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Ajeno', organization: 'otra_org', can_write: ['me'] }
    ], {})
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects).toEqual([])
  })

  it('ignora mis proyectos sin colaboradores', async () => {
    // El backend los borra en cascada en vez de pedir transferencia
    // (core.py:621 is_shared).
    mockProjectsAndUsers([
      { id: 'p1', name: 'Solo mío', organization: 'org1', can_write: [], can_read: [] }
    ], {})
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects).toEqual([])
  })

  it('tolera proyectos sin los campos can_write / can_read', async () => {
    // Medido: hay proyectos en la base que no traen ninguno de los dos.
    mockProjectsAndUsers([
      { id: 'p1', name: 'Viejo', organization: 'org1' }
    ], {})
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects).toEqual([])
  })

  it('lista mis proyectos compartidos con sus candidatos', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_write: ['u2'], can_read: ['u3'] }
    ], { u2: BEA, u3: CARO })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects).toHaveLength(1)
    expect(wrapper.vm.sharedProjects[0].candidates.map(c => c.value)).toEqual(['u2', 'u3'])
  })

  it('pone a los de escritura antes que a los de sólo lectura', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_read: ['u3'], can_write: ['u2'] }
    ], { u2: BEA, u3: CARO })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects[0].candidates[0].value).toBe('u2')
  })

  it('marca con asterisco a los candidatos de sólo lectura', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_write: [], can_read: ['u3'] }
    ], { u3: CARO })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects[0].candidates[0].text).toMatch(/\*$/)
  })

  it('no duplica a quien está en can_write y en can_read', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_write: ['u2'], can_read: ['u2'] }
    ], { u2: BEA })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects[0].candidates).toHaveLength(1)
    // Aparece como colaborador de escritura, sin asterisco.
    expect(wrapper.vm.sharedProjects[0].candidates[0].text).not.toMatch(/\*$/)
  })

  it('descarta a los usuarios inactivos', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_write: ['u2', 'u9'], can_read: [] }
    ], { u2: BEA, u9: { status: false, first_name: 'Baja', last_name: 'Ex', username: 'ex' } })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.sharedProjects[0].candidates.map(c => c.value)).toEqual(['u2'])
  })

  it('pide cada usuario una sola vez aunque aparezca en varios proyectos', async () => {
    // El original hacía un GET por usuario dentro de un bucle anidado y en
    // serie: 10 proyectos × 5 colaboradores = 50 peticiones encadenadas.
    mockProjectsAndUsers([
      { id: 'p1', name: 'A', organization: 'org1', can_write: ['u2'], can_read: [] },
      { id: 'p2', name: 'B', organization: 'org1', can_write: ['u2'], can_read: [] }
    ], { u2: BEA })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    const userCalls = Api.get.mock.calls.filter(c => c[0] === '/users/u2')
    expect(userCalls).toHaveLength(1)
  })

  it('inicializa el nuevo dueño de cada proyecto en null', async () => {
    mockProjectsAndUsers([
      { id: 'p1', name: 'Compartido', organization: 'org1', can_write: ['u2'], can_read: [] }
    ], { u2: BEA })
    const { wrapper } = build()
    await wrapper.vm.loadSharedProjects()
    await flushPromises()

    expect(wrapper.vm.projectsNewOwners.p1).toBeNull()
    expect(wrapper.vm.allProjectsHaveNewOwner).toBe(false)
  })

  it('no bloquea el borrado cuando no hay proyectos compartidos', async () => {
    const { wrapper } = build()
    wrapper.setData({ sharedProjects: [] })

    expect(wrapper.vm.allProjectsHaveNewOwner).toBe(true)
  })

  // ─── Borrado ─────────────────────────────────────────────────────────────────

  it('exige la contraseña antes de borrar', async () => {
    const { wrapper } = build()
    wrapper.setData({ deletePassword: '' })
    await wrapper.vm.confirmDeleteAccount()

    expect(Api.delete).not.toHaveBeenCalled()
    expect(wrapper.vm.deleteError).toBeTruthy()
  })

  it('exige un nuevo dueño para cada proyecto compartido', async () => {
    const { wrapper } = build()
    wrapper.setData({
      deletePassword: 'secreta',
      sharedProjects: [{ id: 'p1', name: 'A', candidates: [] }],
      projectsNewOwners: { p1: null }
    })
    await wrapper.vm.confirmDeleteAccount()

    expect(Api.delete).not.toHaveBeenCalled()
    expect(wrapper.vm.deleteError).toBeTruthy()
  })

  it('manda contraseña y transferencias con la firma de Api.delete', async () => {
    // Api.delete(path, data, config) — el cuerpo va como SEGUNDO argumento
    // (Api.js:529 arma { ...config, data }). Envolverlo en { data: ... }
    // mandaría {"data": {...}} anidado y el backend leería password como
    // undefined: 400 password_required.
    const { wrapper } = build()
    wrapper.setData({
      deletePassword: 'secreta',
      sharedProjects: [{ id: 'p1', name: 'A', candidates: [] }],
      projectsNewOwners: { p1: 'u2' }
    })
    await wrapper.vm.confirmDeleteAccount()
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledWith('/users/delete_account', {
      password: 'secreta',
      ownership_transfers: { p1: 'u2' }
    })
  })

  it('cierra la sesión y vuelve al login tras borrar', async () => {
    const { wrapper, actions } = build()
    wrapper.setData({ deletePassword: 'secreta', sharedProjects: [], projectsNewOwners: {} })
    await wrapper.vm.confirmDeleteAccount()
    await flushPromises()

    expect(actions.logout).toHaveBeenCalled()
    expect(wrapper.vm.$router.push).toHaveBeenCalledWith({ name: 'Login' })
  })

  it('muestra el mensaje del backend si el borrado falla', async () => {
    Api.delete.mockRejectedValueOnce({ response: { data: { message: 'Incorrect password' } } })
    const { wrapper, actions } = build()
    wrapper.setData({ deletePassword: 'mala', sharedProjects: [], projectsNewOwners: {} })
    await wrapper.vm.confirmDeleteAccount()
    await flushPromises()

    expect(wrapper.vm.deleteError).toBe('Incorrect password')
    expect(wrapper.vm.isDeletingAccount).toBe(false)
    // Si falló, la sesión sigue viva: la cuenta no se borró.
    expect(actions.logout).not.toHaveBeenCalled()
  })

  it('no borra dos veces con doble clic', async () => {
    const { wrapper } = build()
    wrapper.setData({ deletePassword: 'secreta', sharedProjects: [], projectsNewOwners: {} })

    await Promise.all([wrapper.vm.confirmDeleteAccount(), wrapper.vm.confirmDeleteAccount()])
    await flushPromises()

    expect(Api.delete).toHaveBeenCalledTimes(1)
  })

  it('resetDeleteModal deja el modal limpio', () => {
    const { wrapper } = build()
    wrapper.setData({
      deletePassword: 'x',
      deleteError: 'y',
      sharedProjects: [{ id: 'p1', name: 'A', candidates: [] }],
      projectsNewOwners: { p1: 'u2' }
    })
    wrapper.vm.resetDeleteModal()

    expect(wrapper.vm.deletePassword).toBe('')
    expect(wrapper.vm.deleteError).toBe('')
    expect(wrapper.vm.sharedProjects).toEqual([])
    expect(wrapper.vm.projectsNewOwners).toEqual({})
  })

  // ─── i18n ────────────────────────────────────────────────────────────────────

  it('tiene traducidas las claves del borrado', () => {
    const { wrapper } = build()
    const keys = ['label', 'description', 'warning', 'button', 'modalTitle', 'transferIntro',
      'readOnlyNote', 'selectPlaceholder', 'passwordPrompt', 'passwordRequired',
      'ownersRequired', 'genericError', 'confirm', 'cancel',
      'noteIntro', 'note1', 'note6', 'noteFooter', 'and', 'termsAndConditions']

    keys.forEach(key => {
      const full = `gdpr.deleteAccount.${key}`
      expect(wrapper.vm.$t(full)).not.toBe(full)
    })
  })
})
