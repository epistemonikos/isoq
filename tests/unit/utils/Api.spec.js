
import axios from 'axios'
import { addPendingOperation } from '@/services/db'

// We need to use requireActual because jest.config.js mocks Api.js by default
const Api = jest.requireActual('@/utils/Api').default

jest.mock('axios')
jest.mock('@/services/db', () => ({
  addPendingOperation: jest.fn(),
  getPendingOperations: jest.fn(),
  removePendingOperation: jest.fn(),
  getPendingOperationsCount: jest.fn()
}))

// Mock i18n
jest.mock('@/plugins/i18n', () => ({
  i18n: {
    t: (key) => key
  }
}))

describe('Api.js (Real Implementation)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset online status
    Api.setOnline(true)
  })

  describe('Offline handling with FormData and Auth (DESIRED behavior)', () => {
    it('should NOT attempt to queue a FormData object and should throw offline error', async () => {
      // Simulate offline
      Api.setOnline(false)
      
      const formData = new FormData()
      formData.append('username', 'test')

      // With our fix, it should NOT call addPendingOperation
      // and it should throw an offline error (isOfflineError = true)
      try {
        await Api.post('/isoqf_references/process-ris', formData)
        fail('Should have thrown an offline error')
      } catch (error) {
        expect(error.isOfflineError).toBe(true)
        expect(addPendingOperation).not.toHaveBeenCalled()
      }
    })

    it('should NOT attempt to queue if it is an auth endpoint even if it is not FormData', async () => {
      // Simulate offline
      Api.setOnline(false)
      
      const payload = { username: 'test', password: 'abc' }
      
      try {
        await Api.post('/auth/login', payload)
        fail('Should have thrown an offline error')
      } catch (error) {
        expect(error.isOfflineError).toBe(true)
        expect(addPendingOperation).not.toHaveBeenCalled()
      }
    })
  })
})
