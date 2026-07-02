jest.mock('@/utils/Api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    post: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
    put: jest.fn(() => Promise.resolve({ data: {} }))
  }
}))

jest.mock('@/services/lockService', () => ({
  __esModule: true,
  default: {
    release: jest.fn(() => Promise.resolve())
  }
}))

import { store, parseUserFromResponse } from '@/store'
import Api from '@/utils/Api'
import LockService from '@/services/lockService'

const flushPromises = () => new Promise(resolve => process.nextTick(resolve))

const loggedInState = (overrides = {}) => ({
  status: 'success',
  token: 'valid-token',
  user: { status: 'active' },
  isOnline: true,
  ...overrides
})

const emptyState = (overrides = {}) => ({
  status: '',
  token: null,
  user: {},
  isOnline: true,
  ...overrides
})

describe('parseUserFromResponse', () => {
  it('returns data directly when data.user is absent', () => {
    const data = { status: 'active', access_token: 'tok' }
    expect(parseUserFromResponse(data)).toMatchObject({ status: 'active', access_token: 'tok' })
  })

  it('returns data.user when present', () => {
    const data = { user: { status: 'active' }, access_token: 'tok' }
    const result = parseUserFromResponse(data)
    expect(result.status).toBe('active')
  })

  it('promotes access_token from root to userObject', () => {
    const data = { user: { status: 'active' }, access_token: 'root-token' }
    expect(parseUserFromResponse(data).access_token).toBe('root-token')
  })

  it('preserves access_token already in userObject', () => {
    const data = { user: { status: 'active', access_token: 'user-token' }, access_token: 'root-token' }
    expect(parseUserFromResponse(data).access_token).toBe('user-token')
  })

  it('promotes status from root when userObject has none', () => {
    const data = { user: { access_token: 'tok' }, status: 'active' }
    expect(parseUserFromResponse(data).status).toBe('active')
  })

  it('preserves status already in userObject', () => {
    const data = { user: { status: 'active', access_token: 'tok' }, status: 'other' }
    expect(parseUserFromResponse(data).status).toBe('active')
  })
})

describe('Vuex store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    store.replaceState(emptyState())
  })

  // ─── State initialization ────────────────────────────────────────────────────

  describe('state initialization', () => {
    it('reads token from localStorage l_s when present', () => {
      localStorage.setItem('l_s', 'stored-token')
      jest.isolateModules(() => {
        const { store: freshStore } = require('@/store')
        expect(freshStore.state.token).toBe('stored-token')
      })
    })

    it('initializes token as null when l_s is absent', () => {
      localStorage.removeItem('l_s')
      jest.isolateModules(() => {
        const { store: freshStore } = require('@/store')
        expect(freshStore.state.token).toBeNull()
      })
    })
  })

  // ─── Mutations ───────────────────────────────────────────────────────────────

  describe('mutation: auth_success', () => {
    it('sets state.token from user.access_token', () => {
      store.commit('auth_success', { access_token: 'new-token', status: 'active' })
      expect(store.state.token).toBe('new-token')
    })

    it('writes l_s to localStorage', () => {
      store.commit('auth_success', { access_token: 'new-token', status: 'active' })
      expect(localStorage.getItem('l_s')).toBe('new-token')
    })

    it('keeps access_token in state.user', () => {
      store.commit('auth_success', { access_token: 'new-token', status: 'active' })
      expect(store.state.user.access_token).toBe('new-token')
    })

    it('sets state.status to success', () => {
      store.commit('auth_success', { access_token: 'new-token', status: 'active' })
      expect(store.state.status).toBe('success')
    })

    it('saves user to localStorage user-data', () => {
      store.commit('auth_success', { access_token: 'new-token', status: 'active', email: 'test@example.com' })
      const saved = JSON.parse(localStorage.getItem('user-data'))
      expect(saved.email).toBe('test@example.com')
    })

    it('falls back to existing state.token when user has no access_token', () => {
      store.replaceState(emptyState({ token: 'existing-token' }))
      store.commit('auth_success', { status: 'active' })
      expect(store.state.token).toBe('existing-token')
      expect(localStorage.getItem('l_s')).toBe('existing-token')
    })

    it('does not overwrite a valid token with null', () => {
      store.replaceState(emptyState({ token: 'existing-token' }))
      store.commit('auth_success', { access_token: null, status: 'active' })
      expect(store.state.token).toBe('existing-token')
    })

    it('does not overwrite a valid token with the string "null"', () => {
      store.replaceState(emptyState({ token: 'existing-token' }))
      store.commit('auth_success', { access_token: 'null', status: 'active' })
      expect(store.state.token).toBe('existing-token')
    })

    it('does not write l_s when neither user nor state has a token', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      store.commit('auth_success', { status: 'active' })
      const lsWrites = setItemSpy.mock.calls.filter(([key]) => key === 'l_s')
      expect(lsWrites).toHaveLength(0)
    })

    it('writes l_s exactly once per auth_success call', () => {
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
      store.commit('auth_success', { access_token: 'new-token', status: 'active' })
      const lsWrites = setItemSpy.mock.calls.filter(([key]) => key === 'l_s')
      expect(lsWrites).toHaveLength(1)
    })
  })

  // ─── Mutations: logout ───────────────────────────────────────────────────────

  describe('mutation: logout', () => {
    beforeEach(() => {
      store.replaceState(loggedInState())
      localStorage.setItem('l_s', 'some-token')
      localStorage.setItem('user-data', JSON.stringify({ status: 'active' }))
    })

    it('clears state.token to null', () => {
      store.commit('logout')
      expect(store.state.token).toBeNull()
    })

    it('clears state.user', () => {
      store.commit('logout')
      expect(store.state.user).toEqual({})
    })

    it('clears state.status', () => {
      store.commit('logout')
      expect(store.state.status).toBe('')
    })

    it('removes l_s from localStorage', () => {
      store.commit('logout')
      expect(localStorage.getItem('l_s')).toBeNull()
    })

    it('removes user-data from localStorage', () => {
      store.commit('logout')
      expect(localStorage.getItem('user-data')).toBeNull()
    })
  })

  // ─── Action: logout ────────────────────────────────────────────────────────

  describe('action: logout', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      store.replaceState(loggedInState())
      localStorage.setItem('l_s', 'some-token')
      Api.get.mockResolvedValue({ data: {} })
    })

    it('releases the project lock before the auth token is cleared', async () => {
      let tokenAtReleaseTime
      LockService.release.mockImplementation(() => {
        tokenAtReleaseTime = localStorage.getItem('l_s')
        return Promise.resolve()
      })

      await store.dispatch('logout')

      expect(LockService.release).toHaveBeenCalled()
      expect(tokenAtReleaseTime).toBe('some-token')
      expect(localStorage.getItem('l_s')).toBeNull()
    })

    it('still logs out even if releasing the lock fails', async () => {
      LockService.release.mockRejectedValue(new Error('network error'))

      await store.dispatch('logout')

      expect(store.state.token).toBeNull()
    })
  })

  // ─── Getters ─────────────────────────────────────────────────────────────────

  describe('getter: isLoggedIn', () => {
    it('returns true when user.status and valid token are present', () => {
      store.replaceState(loggedInState())
      expect(store.getters.isLoggedIn).toBe(true)
    })

    it('returns false when token is null', () => {
      store.replaceState(loggedInState({ token: null }))
      expect(store.getters.isLoggedIn).toBe(false)
    })

    it('returns false when token is the string "null"', () => {
      store.replaceState(loggedInState({ token: 'null' }))
      expect(store.getters.isLoggedIn).toBe(false)
    })

    it('returns false when user.status is falsy', () => {
      store.replaceState(loggedInState({ user: {} }))
      expect(store.getters.isLoggedIn).toBe(false)
    })

    it('returns false when both token and user.status are absent', () => {
      store.replaceState(emptyState())
      expect(store.getters.isLoggedIn).toBe(false)
    })

    it('does not read l_s from localStorage', () => {
      // This is the core invariant: the getter must derive from state.token, not localStorage.
      // If localStorage is empty but state.token is valid, isLoggedIn must still be true.
      localStorage.removeItem('l_s')
      store.replaceState(loggedInState())
      expect(store.getters.isLoggedIn).toBe(true)
    })

    it('returns false even when l_s is present but state.token is null', () => {
      // State is the source of truth; stale localStorage should not grant access.
      localStorage.setItem('l_s', 'stale-token')
      store.replaceState(loggedInState({ token: null }))
      expect(store.getters.isLoggedIn).toBe(false)
    })
  })

  // ─── Actions ─────────────────────────────────────────────────────────────────

  describe('action: getLogginInfo', () => {
    it('skips API call and saves resolved promise when already logged in with token', async () => {
      store.replaceState(loggedInState())
      await store.dispatch('getLogginInfo')
      expect(Api.post).not.toHaveBeenCalled()
      await expect(store.state.promise).resolves.toBeUndefined()
    })

    it('calls /auth/user when status is empty', () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'active', access_token: 'server-token' } })
      store.replaceState(emptyState())
      store.dispatch('getLogginInfo')
      expect(Api.post).toHaveBeenCalledWith('/auth/user', null)
    })

    it('commits auth_success and sets token on valid server response', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'active', access_token: 'server-token' } })
      store.replaceState(emptyState())
      store.dispatch('getLogginInfo')
      await flushPromises()
      expect(store.state.token).toBe('server-token')
      expect(store.state.status).toBe('success')
    })

    it('commits logout on not_logged response', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'not_logged' } })
      store.replaceState(emptyState())
      store.dispatch('getLogginInfo')
      await flushPromises()
      expect(store.state.token).toBeNull()
      expect(store.state.status).toBe('')
    })

    it('uses state.token (not localStorage) to check for existing token', async () => {
      // state.token is set but localStorage l_s is absent — must still skip the API call
      localStorage.removeItem('l_s')
      store.replaceState(loggedInState())
      await store.dispatch('getLogginInfo')
      expect(Api.post).not.toHaveBeenCalled()
    })

    describe('offline recovery', () => {
      const offlineError = () => {
        const err = new Error('Network Error')
        err.isOfflineError = true
        return err
      }

      it('restores session from user-data when offline', async () => {
        const savedUser = { status: 'active', access_token: 'offline-token' }
        localStorage.setItem('user-data', JSON.stringify(savedUser))
        Api.post.mockRejectedValueOnce(offlineError())

        store.replaceState(emptyState({ isOnline: false }))
        store.dispatch('getLogginInfo')
        await flushPromises()

        expect(store.state.token).toBe('offline-token')
        expect(store.state.status).toBe('success')
        expect(store.getters.isLoggedIn).toBe(true)
      })

      it('writes l_s exactly once during offline recovery (via auth_success, not duplicated)', async () => {
        const savedUser = { status: 'active', access_token: 'offline-token' }
        localStorage.setItem('user-data', JSON.stringify(savedUser))
        Api.post.mockRejectedValueOnce(offlineError())

        store.replaceState(emptyState({ isOnline: false }))
        const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')

        store.dispatch('getLogginInfo')
        await flushPromises()

        const lsWrites = setItemSpy.mock.calls.filter(([key]) => key === 'l_s')
        expect(lsWrites).toHaveLength(1)
        expect(lsWrites[0][1]).toBe('offline-token')
      })

      it('commits logout when offline and no user-data is stored', async () => {
        localStorage.removeItem('user-data')
        Api.post.mockRejectedValueOnce(offlineError())

        store.replaceState(emptyState({ isOnline: false }))
        store.dispatch('getLogginInfo')
        // The internal promise rejects when offline with no cache; suppress the unhandled rejection.
        if (store.state.promise) store.state.promise.catch(() => {})
        await flushPromises()

        expect(store.state.token).toBeNull()
        expect(store.state.status).toBe('')
      })
    })
  })

  describe('action: login', () => {
    it('sets token and status on successful login', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'active', access_token: 'login-token' } })
      await store.dispatch('login', { username: 'user@test.com', password: 'pass' })
      expect(store.state.token).toBe('login-token')
      expect(store.state.status).toBe('success')
    })

    it('rejects and sets error status on email_not_verified', async () => {
      Api.post.mockResolvedValueOnce({ data: { status: 'email_not_verified' } })
      await expect(
        store.dispatch('login', { username: 'user@test.com', password: 'pass' })
      ).rejects.toBeDefined()
      expect(store.state.status).toBe('error')
    })

    it('rejects and sets error status on network error', async () => {
      Api.post.mockRejectedValueOnce(new Error('Network Error'))
      await expect(
        store.dispatch('login', { username: 'user@test.com', password: 'pass' })
      ).rejects.toBeDefined()
      expect(store.state.status).toBe('error')
    })

    it('does not set token on failed login', async () => {
      Api.post.mockRejectedValueOnce(new Error('Network Error'))
      await store.dispatch('login', { username: 'user@test.com', password: 'pass' }).catch(() => {})
      expect(store.state.token).toBeNull()
    })
  })
})
