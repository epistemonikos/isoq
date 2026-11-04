import Api from '@/utils/Api'
import { fetchPublicationState } from '@/utils/publicationState'

jest.mock('@/utils/Api')

describe('fetchPublicationState', () => {
  beforeEach(() => jest.clearAllMocks())

  test('reads the project and its lists from the network', async () => {
    Api.get.mockImplementation(path => Promise.resolve(path.startsWith('/isoqf_projects') ? { id: 'p1' } : [{ id: 'L1' }]))
    const state = await fetchPublicationState('p1')
    expect(state).toEqual({ project: { id: 'p1' }, lists: [{ id: 'L1' }] })
    expect(Api.get).toHaveBeenCalledWith('/isoqf_projects/p1', {}, { networkOnly: true })
    expect(Api.get).toHaveBeenCalledWith('/isoqf_lists', { project_id: 'p1' }, { networkOnly: true })
  })

  test('rejects when a read fails', async () => {
    Api.get.mockRejectedValue(new Error('boom'))
    await expect(fetchPublicationState('p1')).rejects.toThrow('boom')
  })
})
