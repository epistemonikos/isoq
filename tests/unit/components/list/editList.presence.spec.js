// La worksheet marca presencia al entrar y la suelta al salir. Es el ÚNICO punto de
// alta: los editores (dimensión, nombre, referencias, borrado) ya sostienen un lock
// real que el listado lee, así que marcarles presencia además los nombraría dos veces.
import PresenceService from '@/services/presenceService'
import editList from '@/components/list/editList.vue'

jest.mock('@/services/presenceService', () => ({
  enter: jest.fn().mockResolvedValue(undefined),
  leave: jest.fn().mockResolvedValue(undefined),
  fetch: jest.fn().mockResolvedValue([])
}))

describe('editList — presencia', () => {
  beforeEach(() => {
    PresenceService.enter.mockClear()
    PresenceService.leave.mockClear()
    PresenceService.fetch.mockResolvedValue([])
  })

  it('entra al hallazgo con el project_id de la LISTA, no el de la ruta', async () => {
    // En `/worksheet/:id/edit` el `:id` es el de la list. El project_id sólo existe
    // tras getList(), y por eso el alta va ahí y no en mounted.
    const vm = {
      list: { project_id: 'p1' },
      findings: { id: 'f1' },
      enterPresence: editList.methods.enterPresence
    }

    await vm.enterPresence()

    expect(PresenceService.enter).toHaveBeenCalledWith('p1', 'f1')
  })

  it('sin finding todavía no marca nada', async () => {
    const vm = {
      list: { project_id: 'p1' },
      findings: null,
      enterPresence: editList.methods.enterPresence
    }

    await vm.enterPresence()

    expect(PresenceService.enter).not.toHaveBeenCalled()
  })

  it('el sondeo de la worksheet trae también la presencia', async () => {
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])
    const vm = {
      $_alive: true,
      list: { project_id: 'p1' },
      activePresence: [],
      fetchPresence: editList.methods.fetchPresence
    }

    await vm.fetchPresence()

    expect(vm.activePresence).toHaveLength(1)
  })

  it('un sondeo que llega tras destruir la vista no escribe', async () => {
    // Misma guarda `$_alive` que ya usa fetchAndUpdateRefLocks: salir a mitad de un
    // sondeo dejaba la promesa corriendo sobre un componente destruido.
    const vm = {
      $_alive: false,
      list: { project_id: 'p1' },
      activePresence: [],
      fetchPresence: editList.methods.fetchPresence
    }
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])

    await vm.fetchPresence()

    expect(vm.activePresence).toEqual([])
  })

  it('el aviso nombra a los OTROS, nunca a uno mismo', () => {
    const vm = {
      activePresence: [
        { finding_id: 'f1', user_id: 'u-yo', user_name: 'Yo Mismo' },
        { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
      ],
      foreignRefLocks: [],
      findings: { id: 'f1' },
      currentUserId: 'u-yo',
      $t: (key, params) => key === 'presence.reviewing_one'
        ? `${params.users} está revisando este hallazgo` : key,
      presenceNotice: editList.computed.presenceNotice
    }

    expect(vm.presenceNotice.call(vm)).toBe('Ana Soto está revisando este hallazgo')
  })
})
