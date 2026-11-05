import Api from '@/utils/Api'
import { fetchPublicationState, impactOfListChange } from '@/utils/publicationState'

jest.mock('@/utils/Api')

// Api.get resolves with the whole axios response (or `{ data, fromCache }`), never the body.
const serve = ({ project, lists }) => Api.get.mockImplementation(path =>
  Promise.resolve({ data: path.startsWith('/isoqf_projects') ? project : lists, status: 200 }))

const complete = id => ({ id, name: id, references: ['r1'], cerqual: { option: 1, explanation: 'x' } })

describe('fetchPublicationState', () => {
  beforeEach(() => jest.clearAllMocks())

  test('unwraps the body of both responses and reads from the network', async () => {
    serve({ project: { id: 'p1' }, lists: [{ id: 'L1' }] })
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

describe('impactOfListChange', () => {
  beforeEach(() => jest.clearAllMocks())
  const project = { public_type: 'fully' }

  test('hands the change a copy of the fresh list and judges the result', async () => {
    const fresh = complete('L1')
    serve({ project, lists: [fresh] })
    let received
    const impact = await impactOfListChange('p1', 'L1', list => {
      received = list
      list.references = []
      return list
    })
    expect(received).not.toBe(fresh)
    expect(fresh.references).toEqual(['r1'])
    expect(impact).toBe('project_private')
  })

  test('a deletion (null) with another visible finding hides only that one', async () => {
    serve({ project, lists: [complete('L1'), complete('L2')] })
    expect(await impactOfListChange('p1', 'L1', () => null)).toBe('finding_hidden')
  })

  test('a list that is not there is none', async () => {
    serve({ project, lists: [complete('L2')] })
    const change = jest.fn(() => null)
    expect(await impactOfListChange('p1', 'L1', change)).toBe('none')
  })

  test('a private project is none', async () => {
    serve({ project: { public_type: 'private' }, lists: [complete('L1')] })
    expect(await impactOfListChange('p1', 'L1', () => null)).toBe('none')
  })

  test('rejects when the read fails', async () => {
    Api.get.mockRejectedValue(new Error('boom'))
    await expect(impactOfListChange('p1', 'L1', () => null)).rejects.toThrow('boom')
  })
})
