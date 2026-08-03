import axios from 'axios'

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn(),
  getPendingOperations: jest.fn(),
  removePendingOperation: jest.fn(),
  getPendingOperationsCount: jest.fn()
}))
jest.mock('@/plugins/i18n', () => ({ i18n: { t: (key) => key } }))

// Importing the real Api registers the response interceptor on the mocked axios.
jest.requireActual('@/utils/Api')

// The interceptor's error handler is the 2nd argument of the first .use() call.
const errorHandler = axios.interceptors.response.use.mock.calls[0][1]

describe('Api.js interceptor — ref-lock-conflict', () => {
  let dispatched

  let setItemSpy

  beforeEach(() => {
    dispatched = []
    jest.spyOn(window, 'dispatchEvent').mockImplementation(e => { dispatched.push(e); return true })
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {})
  })

  afterEach(() => jest.restoreAllMocks())

  const makeError = (url, data, lockedBy) => ({
    config: { url, method: 'patch', data: JSON.stringify(data) },
    response: { status: 409, data: { locked_by: lockedBy } }
  })

  it('dispara ref-lock-conflict en un 409 de PATCH parcial de characteristics', async () => {
    const err = makeError('/isoqf_characteristics/char1/item/ref1', { ref_id: 'ref1', campo1: 'v' }, 'Ana')
    await expect(errorHandler(err)).rejects.toBe(err)

    const event = dispatched.find(e => e.type === 'ref-lock-conflict')
    expect(event).toBeTruthy()
    expect(event.detail).toEqual({
      refId: 'ref1',
      failedData: { ref_id: 'ref1', campo1: 'v' },
      lockedBy: 'Ana'
    })
    expect(setItemSpy).toHaveBeenCalledWith(
      'conflict_ref_ref1',
      expect.stringContaining('Ana')
    )
  })

  it('dispara ref-lock-conflict en un 409 de PATCH parcial de assessments', async () => {
    const err = makeError('/isoqf_assessments/assess1/item/ref2', { ref_id: 'ref2' }, 'Bob')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(dispatched.some(e => e.type === 'ref-lock-conflict')).toBe(true)
  })

  it('dispara ref-lock-conflict en un 409 de PATCH parcial de extracted_data', async () => {
    const err = makeError('/isoqf_extracted_data/ed1/item/ref3', { ref_id: 'ref3', column_0: 'v' }, 'Carol')
    await expect(errorHandler(err)).rejects.toBe(err)
    const event = dispatched.find(e => e.type === 'ref-lock-conflict')
    expect(event).toBeTruthy()
    expect(event.detail.refId).toBe('ref3')
    expect(event.detail.lockedBy).toBe('Carol')
  })

  // Endpoint A writes through /section/<name>, which the URL filter did not cover:
  // a 409 there reached no listener at all, so the failure was console-only.
  it('dispara ref-lock-conflict en un 409 de PATCH por sección de un finding', async () => {
    const err = makeError(
      '/isoqf_findings/finding1/section/coherence',
      { option: 2, explanation: 'texto' },
      'Ana'
    )
    await expect(errorHandler(err)).rejects.toBe(err)

    const event = dispatched.find(e => e.type === 'ref-lock-conflict')
    expect(event).toBeTruthy()
    // The lock unit of endpoint A is the document id, not a study ref.
    expect(event.detail.refId).toBe('finding1')
    expect(event.detail.failedData).toEqual({ option: 2, explanation: 'texto' })
    expect(event.detail.lockedBy).toBe('Ana')
  })

  it('dispara ref-lock-conflict en un 409 de PATCH por sección de una lista', async () => {
    const err = makeError('/isoqf_lists/list1/section/cerqual', { option: 1 }, 'Bob')
    await expect(errorHandler(err)).rejects.toBe(err)
    const event = dispatched.find(e => e.type === 'ref-lock-conflict')
    expect(event).toBeTruthy()
    expect(event.detail.refId).toBe('list1')
  })

  it('NO dispara ref-lock-conflict en un 409 que no es PATCH parcial', async () => {
    const err = makeError('/isoqf_characteristics/char1/', { ref_id: 'ref1' }, 'Ana')
    await expect(errorHandler(err)).rejects.toBe(err)
    expect(dispatched.some(e => e.type === 'ref-lock-conflict')).toBe(false)
  })

  // Endpoint D nests the position under /item/: splitting on '/item/' yields
  // 'ref4/stage/0/option/2', which matches no lock the client ever acquired.
  describe('endpoint D — composite lock key', () => {
    it('compone la clave de hoja en vez de partir la URL cruda', async () => {
      const err = makeError(
        '/isoqf_assessments/assess1/item/ref4/stage/0/option/2',
        { option: 'A', text: 'x', notes: '' },
        'Dana'
      )
      await expect(errorHandler(err)).rejects.toBe(err)

      const event = dispatched.find(e => e.type === 'ref-lock-conflict')
      expect(event.detail.refId).toBe('ref4::s0::o2')
      expect(setItemSpy).toHaveBeenCalledWith(
        'conflict_ref_ref4::s0::o2',
        expect.stringContaining('Dana')
      )
    })

    it('conserva el payload de la hoja que falló', async () => {
      const err = makeError(
        '/isoqf_assessments/assess1/item/ref4/stage/3/option/0',
        { option: 'C', text: 'explicación', notes: 'nota' },
        'Dana'
      )
      await expect(errorHandler(err)).rejects.toBe(err)

      const event = dispatched.find(e => e.type === 'ref-lock-conflict')
      expect(event.detail.refId).toBe('ref4::s3::o0')
      expect(event.detail.failedData).toEqual({
        option: 'C', text: 'explicación', notes: 'nota'
      })
    })

    it('cae al ref pelado cuando la URL no trae una posición válida', async () => {
      const err = makeError(
        '/isoqf_assessments/assess1/item/ref4/stage/9/option/0', {}, 'Dana'
      )
      await expect(errorHandler(err)).rejects.toBe(err)

      const event = dispatched.find(e => e.type === 'ref-lock-conflict')
      expect(event.detail.refId).toBe('ref4')
    })
  })
})
