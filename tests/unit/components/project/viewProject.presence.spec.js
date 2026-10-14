// El sondeo de 15 s de viewProject pasa de dos preguntas a tres. Mismo timer: los
// cuatro tabs se ocultan con `d-none` y no con `v-if`, así que esta vista no se
// desmonta mientras se esté en el proyecto y un timer extra sería puro desperdicio.
import PresenceService from '@/services/presenceService'

jest.mock('@/services/presenceService', () => ({
  fetch: jest.fn().mockResolvedValue([]),
  enter: jest.fn(),
  leave: jest.fn()
}))

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

describe('viewProject — presencia', () => {
  it('el sondeo pide presencia junto con los locks', async () => {
    // Montaje mínimo: se prueba el método, no la vista entera (que arrastra medio
    // repo en imports). El componente se importa tarde para que el mock ya esté.
    const viewProject = require('@/components/project/viewProject.vue').default
    const vm = {
      activePresence: [],
      $route: { params: { id: 'p1' } },
      fetchPresence: viewProject.methods.fetchPresence
    }

    await vm.fetchPresence()

    expect(PresenceService.fetch).toHaveBeenCalledWith('p1')
    expect(vm.activePresence).toEqual([])
  })

  it('una respuesta con presentes queda en activePresence', async () => {
    PresenceService.fetch.mockResolvedValue([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])
    const viewProject = require('@/components/project/viewProject.vue').default
    const vm = {
      activePresence: [],
      $route: { params: { id: 'p1' } },
      fetchPresence: viewProject.methods.fetchPresence
    }

    await vm.fetchPresence()

    expect(vm.activePresence).toEqual([
      { finding_id: 'f1', user_id: 'u-ana', user_name: 'Ana Soto' }
    ])
  })

  it('startProjectPolling incluye la presencia en el primer tick y en cada uno', () => {
    jest.useFakeTimers()
    const viewProject = require('@/components/project/viewProject.vue').default
    const llamadas = []
    const vm = {
      projectPollTimer: null,
      fetchAndUpdateRefLocks: () => llamadas.push('locks'),
      checkProjectFreshness: () => llamadas.push('freshness'),
      fetchPresence: () => llamadas.push('presence'),
      startProjectPolling: viewProject.methods.startProjectPolling
    }

    vm.startProjectPolling()
    expect(llamadas).toEqual(['locks', 'freshness', 'presence'])

    jest.advanceTimersByTime(15000)
    expect(llamadas.filter(c => c === 'presence')).toHaveLength(2)

    clearInterval(vm.projectPollTimer)
    jest.useRealTimers()
  })
})
