import viewProject from '@/components/project/viewProject.vue'
import Api from '@/utils/Api'

jest.mock('@/utils/Api', () => ({ __esModule: true, default: { get: jest.fn() } }))

const { refreshProjectForPropertiesLock, getProject } = viewProject.methods

/**
 * El lock de Propiedades refresca ANTES de habilitar: si el refresco falla, o sale de la
 * caché, se editaría sobre datos viejos y se pisaría lo que otra persona acaba de guardar.
 */
describe('viewProject — refresco para el lock de Propiedades', () => {
  it('pide el proyecto sólo a la red', async () => {
    const ctx = { project: { id: 'p1' }, getProject: jest.fn(function () { this.project = { id: 'p1' } }) }
    await refreshProjectForPropertiesLock.call(ctx)
    expect(ctx.getProject).toHaveBeenCalledWith({ networkOnly: true })
  })

  it('resuelve si llegó un proyecto nuevo', async () => {
    const ctx = { project: { id: 'p1' }, getProject: jest.fn(function () { this.project = { id: 'p1', name: 'nuevo' } }) }
    await expect(refreshProjectForPropertiesLock.call(ctx)).resolves.toBeUndefined()
  })

  it('rechaza si getProject no pudo (se traga el error y deja el mismo objeto)', async () => {
    const ctx = { project: { id: 'p1' }, getProject: jest.fn(() => Promise.resolve()) }
    await expect(refreshProjectForPropertiesLock.call(ctx)).rejects.toThrow()
  })

  it('getProject pasa el config a Api.get', async () => {
    Api.get.mockRejectedValue(new Error('offline'))
    const ctx = { $route: { params: { id: 'p1', org_id: 'o1' } }, $notify: { warning: jest.fn() }, $t: k => k }
    await getProject.call(ctx, { networkOnly: true })
    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/p1', { organization: 'o1' }, { networkOnly: true })
  })
})
